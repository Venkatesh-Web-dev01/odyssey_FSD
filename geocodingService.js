/**
 * Geocoding Service — Nominatim (OpenStreetMap)
 *
 * Geocodes activity location strings to lat/lng coordinates
 * using the free Nominatim API. Results are cached in SQLite
 * to avoid redundant lookups and respect the 1-req/sec rate limit.
 *
 * Includes multi-tier resolution:
 * 1. Cache hit
 * 2. Direct location + destination query
 * 3. Direct location query
 * 4. Destination fallback with deterministic geographic distribution
 *
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */

import { getDb } from '../db/database.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'TravelPlannerApp/1.0 (student-project)';
const RATE_LIMIT_MS = 1100; // >1 second between requests

let lastRequestTime = 0;

/**
 * Normalizes a location string for consistent cache keys.
 * Trims, lowercases, collapses whitespace, removes trailing punctuation.
 *
 * @param {string} location
 * @param {string} destination
 * @returns {string}
 */
function normalizeKey(location, destination) {
  const cleaned = [location, destination]
    .filter(Boolean)
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!]+$/, ''))
    .join(' | ');
  return cleaned;
}

/**
 * Simple deterministic string hash.
 *
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Rate-limit helper: waits until the minimum interval has passed
 * since the last Nominatim request.
 */
async function respectRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Checks the SQLite geocode_cache for a previously resolved location.
 *
 * @param {string} key - Normalized location key
 * @returns {{ lat: number, lng: number, displayName: string } | null}
 */
function getCached(key) {
  try {
    const db = getDb();
    const row = db.prepare('SELECT lat, lng, display_name FROM geocode_cache WHERE location_key = ?').get(key);
    if (row) {
      return { lat: row.lat, lng: row.lng, displayName: row.display_name };
    }
  } catch {
    // Cache miss or DB error — non-critical
  }
  return null;
}

/**
 * Stores a geocoding result in the SQLite cache.
 *
 * @param {string} key
 * @param {number} lat
 * @param {number} lng
 * @param {string} displayName
 */
function setCache(key, lat, lng, displayName) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO geocode_cache (location_key, lat, lng, display_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(key, lat, lng, displayName || '', new Date().toISOString());
  } catch {
    // Cache write failure is non-critical
  }
}

/**
 * Executes a single raw query against the Nominatim API.
 *
 * @param {string} query
 * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
 */
async function queryNominatim(query) {
  try {
    await respectRateLimit();

    const url = new URL(NOMINATIM_BASE);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`[Geocode] Nominatim returned ${response.status} for "${query}"`);
      return null;
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    const { lat, lon, display_name } = results[0];
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return null;
    }

    return { lat: latNum, lng: lngNum, displayName: display_name || query };
  } catch (err) {
    console.warn(`[Geocode] Error querying "${query}":`, err.message);
    return null;
  }
}

/**
 * Geocodes a single location string.
 *
 * @param {string} location - Activity location
 * @param {string} destination - Trip destination for context
 * @param {number} [index=0] - Activity index for deterministic offset
 * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
 */
export async function geocodeLocation(location, destination, index = 0) {
  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    return null;
  }

  const key = normalizeKey(location, destination);

  // 1. Check cache
  const cached = getCached(key);
  if (cached) return cached;

  const locClean = location.trim();
  const destClean = destination ? destination.trim() : '';

  // Determine primary query
  const destLower = destClean.toLowerCase();
  const locLower = locClean.toLowerCase();
  const alreadyHasDest = destClean && locLower.includes(destLower);

  const primaryQuery = alreadyHasDest || !destClean ? locClean : `${locClean}, ${destClean}`;

  // 2. Try primary query
  let result = await queryNominatim(primaryQuery);

  // 3. If primary query failed and it was compound, try pure location
  if (!result && !alreadyHasDest && destClean) {
    result = await queryNominatim(locClean);
  }

  // 4. Fallback: geocode destination itself, then apply deterministic offset
  if (!result && destClean) {
    const destKey = normalizeKey(destClean, '');
    let destCoords = getCached(destKey);
    if (!destCoords) {
      destCoords = await queryNominatim(destClean);
      if (destCoords) {
        setCache(destKey, destCoords.lat, destCoords.lng, destCoords.displayName);
      }
    }

    if (destCoords) {
      // Create a deterministic offset (~1-3km) around the city center so markers don't overlap
      const hash = hashString(`${locClean}_${index}`);
      const angle = (hash % 360) * (Math.PI / 180);
      const radiusDeg = 0.008 + ((hash % 15) * 0.0012); // ~1 to 2.5 km
      const offsetLat = destCoords.lat + radiusDeg * Math.cos(angle);
      const offsetLng = destCoords.lng + radiusDeg * Math.sin(angle);

      result = {
        lat: parseFloat(offsetLat.toFixed(6)),
        lng: parseFloat(offsetLng.toFixed(6)),
        displayName: `${locClean} (${destClean})`,
      };
    }
  }

  // 5. Store in cache if resolved
  if (result) {
    setCache(key, result.lat, result.lng, result.displayName);
  }

  return result;
}

/**
 * Geocodes all activity locations in an itinerary.
 * Returns an array of resolved locations with activity metadata.
 *
 * @param {object} itinerary - The itinerary object with days/activities
 * @param {string} destination - Trip destination for context
 * @returns {Promise<Array<{ activityId: string, day: number, lat: number, lng: number, title: string, time: string, location: string, category: string }>>}
 */
export async function geocodeItinerary(itinerary, destination) {
  if (!itinerary?.days || !Array.isArray(itinerary.days)) {
    return [];
  }

  const results = [];
  let overallIndex = 0;

  for (const day of itinerary.days) {
    const dayNumber = day.day || day.dayNumber;
    const activities = day.activities || [];

    for (const activity of activities) {
      const locationStr = activity.location;
      if (!locationStr || typeof locationStr !== 'string' || locationStr.trim().length === 0) {
        continue;
      }

      overallIndex++;
      const coords = await geocodeLocation(locationStr, destination, overallIndex);
      if (coords) {
        results.push({
          activityId: activity.id || `day${dayNumber}-${activities.indexOf(activity)}`,
          day: dayNumber,
          lat: coords.lat,
          lng: coords.lng,
          title: activity.title || activity.name || 'Untitled',
          time: activity.time || '',
          location: locationStr,
          category: activity.category || 'other',
        });
      }
    }
  }

  return results;
}
