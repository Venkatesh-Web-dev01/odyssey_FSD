/**
 * MapView — Interactive Leaflet map showing itinerary activity locations.
 *
 * Features:
 * - Colored markers grouped by day
 * - Click-to-highlight bidirectional sync
 * - Popups with activity details
 * - Graceful degradation when geocoding fails
 * - Loading / error / empty states
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeTrip } from '../services/api';
import './MapView.css';

// Fix Leaflet's default icon path issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Day-specific colors for map markers.
 * Each day gets a unique hue that visually maps to distinct groupings.
 */
const DAY_COLORS = [
  '#22d3ee', // cyan
  '#f59e0b', // amber
  '#a78bfa', // violet
  '#34d399', // emerald
  '#f472b6', // pink
  '#fb923c', // orange
  '#38bdf8', // sky
  '#e879f9', // fuchsia
  '#facc15', // yellow
  '#4ade80', // green
];

const CATEGORY_ICONS = {
  sightseeing: '🏛️',
  food: '🍜',
  adventure: '🧗',
  culture: '🎭',
  shopping: '🛍️',
  relaxation: '🧘',
  nightlife: '🍸',
  nature: '🌲',
  transit: '🚇',
  other: '📍',
};

/**
 * Creates a custom colored circle marker icon for a specific day.
 */
function createDayIcon(dayIndex) {
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="#0b0e14" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="6" fill="#0b0e14" opacity="0.5"/>
      <text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold"
            font-family="system-ui">${dayIndex + 1}</text>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

/**
 * Creates a highlighted (active) version of the marker icon.
 */
function createHighlightedIcon(dayIndex) {
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z"
            fill="${color}" stroke="white" stroke-width="2.5" filter="url(#glow)"/>
      <circle cx="18" cy="18" r="7" fill="#0b0e14" opacity="0.5"/>
      <text x="18" y="22" text-anchor="middle" fill="white" font-size="12" font-weight="bold"
            font-family="system-ui">${dayIndex + 1}</text>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-map-marker highlighted',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44],
  });
}

/**
 * Sub-component that pans/zooms the map when highlightedActivityId changes.
 */
function MapController({ locations, highlightedActivityId, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!highlightedActivityId || !locations.length) return;

    const target = locations.find((loc) => loc.activityId === highlightedActivityId);
    if (!target) return;

    map.flyTo([target.lat, target.lng], 15, { duration: 0.8 });

    // Open the popup for this marker
    const markerRef = markerRefs.current?.[highlightedActivityId];
    if (markerRef) {
      setTimeout(() => markerRef.openPopup(), 400);
    }
  }, [highlightedActivityId, locations, map, markerRefs]);

  return null;
}

/**
 * MapView component.
 *
 * @param {object} props
 * @param {string} props.tripId - Trip ID for geocoding
 * @param {string|null} props.highlightedActivityId - Activity to highlight on the map
 * @param {function} props.onMarkerClick - Callback when a marker is clicked: (activityId, day) => void
 * @param {number} props.itineraryVersion - Triggers re-geocode when itinerary changes
 */
function MapView({ tripId, highlightedActivityId, onMarkerClick, itineraryVersion }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const markerRefs = useRef({});

  // Memoize day icons to avoid re-creating on every render
  const dayIcons = useMemo(() => {
    const icons = {};
    for (let i = 0; i < DAY_COLORS.length; i++) {
      icons[i] = {
        normal: createDayIcon(i),
        highlighted: createHighlightedIcon(i),
      };
    }
    return icons;
  }, []);

  // Fetch geocoded locations
  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      setLoading(true);
      setError(null);
      try {
        const data = await geocodeTrip(tripId);
        if (!cancelled) {
          setLocations(data.locations || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load map locations');
          setLocations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (tripId) loadLocations();
    return () => { cancelled = true; };
  }, [tripId, itineraryVersion]);

  // Compute map center and bounds
  const { center, bounds } = useMemo(() => {
    if (!locations.length) {
      return { center: [35.6762, 139.6503], bounds: null }; // Tokyo default
    }

    const lats = locations.map((l) => l.lat);
    const lngs = locations.map((l) => l.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
      bounds: [
        [minLat - 0.01, minLng - 0.01],
        [maxLat + 0.01, maxLng + 0.01],
      ],
    };
  }, [locations]);

  // Loading state
  if (loading) {
    return (
      <div className="map-loading-container">
        <div className="map-loading-spinner" />
        <p className="map-loading-text">Geocoding activity locations...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="map-error-container">
        <span className="map-error-icon">🗺️</span>
        <p className="map-error-text">{error}</p>
        <p className="map-error-hint">The itinerary is still fully functional without the map.</p>
      </div>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <div className="map-empty-container">
        <span className="map-empty-icon">📍</span>
        <p className="map-empty-text">No locations could be mapped</p>
        <p className="map-empty-hint">Activity locations couldn't be geocoded. The itinerary works perfectly without the map.</p>
      </div>
    );
  }

  // Get unique days for the legend
  const uniqueDays = [...new Set(locations.map((l) => l.day))].sort((a, b) => a - b);

  return (
    <div className="map-view-wrapper">
      {/* Day Legend */}
      <div className="map-legend">
        {uniqueDays.map((day) => {
          const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];
          const count = locations.filter((l) => l.day === day).length;
          return (
            <span key={day} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              <span>Day {day}</span>
              <span className="legend-count">{count}</span>
            </span>
          );
        })}
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={center}
        zoom={13}
        bounds={bounds}
        className="map-container"
        scrollWheelZoom={true}
        style={{ height: '450px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          locations={locations}
          highlightedActivityId={highlightedActivityId}
          markerRefs={markerRefs}
        />

        {locations.map((loc) => {
          const dayIndex = (loc.day || 1) - 1;
          const isHighlighted = highlightedActivityId === loc.activityId;
          const icon = isHighlighted
            ? (dayIcons[dayIndex % DAY_COLORS.length]?.highlighted || dayIcons[0].highlighted)
            : (dayIcons[dayIndex % DAY_COLORS.length]?.normal || dayIcons[0].normal);
          const catIcon = CATEGORY_ICONS[(loc.category || 'other').toLowerCase()] || '📍';

          return (
            <Marker
              key={loc.activityId}
              position={[loc.lat, loc.lng]}
              icon={icon}
              ref={(el) => { if (el) markerRefs.current[loc.activityId] = el; }}
              eventHandlers={{
                click: () => onMarkerClick?.(loc.activityId, loc.day),
              }}
            >
              <Popup className="map-custom-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <span
                      className="popup-day-badge"
                      style={{ background: DAY_COLORS[dayIndex % DAY_COLORS.length] }}
                    >
                      Day {loc.day}
                    </span>
                    {loc.time && <span className="popup-time">⏰ {loc.time}</span>}
                  </div>
                  <h4 className="popup-title">{catIcon} {loc.title}</h4>
                  <p className="popup-location">📍 {loc.location}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapView;
