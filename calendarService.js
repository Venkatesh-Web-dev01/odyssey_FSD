import { createEvents } from 'ics';

/**
 * Service to export travel itineraries into RFC 5545 standard .ics calendar format.
 * Converts every itinerary activity into a structured calendar event with
 * robust normalization for dates, times, durations, and special characters.
 */

/**
 * Parses an "HH:MM" or "H:MM" time string into hours and minutes integers.
 * Returns fallback values if the string is absent or invalid.
 *
 * @param {string} timeStr - Time string like "09:30" or "14:00"
 * @param {number} fallbackIndex - Activity index to generate sensible staggered times
 * @returns {{ hour: number, minute: number }}
 */
function parseActivityTime(timeStr, fallbackIndex = 0) {
  if (typeof timeStr === 'string') {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute };
      }
    }
  }

  // Progressive fallback times if time is missing or unparseable
  const fallbackSchedule = [
    { hour: 9, minute: 0 },   // Activity 1: Morning
    { hour: 12, minute: 0 },  // Activity 2: Lunch / Midday
    { hour: 15, minute: 0 },  // Activity 3: Afternoon
    { hour: 18, minute: 30 }, // Activity 4: Evening
    { hour: 20, minute: 30 }, // Activity 5: Night
  ];

  if (fallbackIndex < fallbackSchedule.length) {
    return fallbackSchedule[fallbackIndex];
  }

  const extraHour = Math.min(23, 20 + (fallbackIndex - 4));
  return { hour: extraHour, minute: 0 };
}

/**
 * Normalizes duration in minutes into an { hours, minutes } object.
 *
 * @param {number|string} durationMinutes
 * @returns {{ hours: number, minutes: number }}
 */
function normalizeDuration(durationMinutes) {
  let minutes = 60; // Default 1 hour

  if (typeof durationMinutes === 'number' && !isNaN(durationMinutes) && durationMinutes > 0) {
    minutes = Math.round(durationMinutes);
  } else if (typeof durationMinutes === 'string') {
    const parsed = parseInt(durationMinutes, 10);
    if (!isNaN(parsed) && parsed > 0) {
      minutes = parsed;
    }
  }

  // Clamp minimum duration to 15 mins
  minutes = Math.max(15, minutes);

  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}

/**
 * Derives a valid calendar date for a given day number in the trip.
 * Uses dayData.date if valid YYYY-MM-DD; otherwise defaults to (Tomorrow + (dayNum - 1) days).
 *
 * @param {number} dayNum - Day index (1-indexed)
 * @param {string|null} dateStr - Optional date string
 * @param {Date} baseDate - Anchor date for Day 1
 * @returns {{ year: number, month: number, day: number }} - 1-indexed month for ics package
 */
function deriveDayDate(dayNum, dateStr, baseDate) {
  if (typeof dateStr === 'string') {
    const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10); // 1-indexed (01-12)
      const day = parseInt(match[3], 10);
      return { year, month, day };
    }
  }

  // Calculate offset from baseDate (Tomorrow)
  const targetDate = new Date(baseDate.getTime());
  targetDate.setDate(targetDate.getDate() + Math.max(0, dayNum - 1));

  return {
    year: targetDate.getFullYear(),
    month: targetDate.getMonth() + 1, // ics package expects 1-indexed month (1 = Jan)
    day: targetDate.getDate(),
  };
}

/**
 * Generates an RFC 5545 standard .ics calendar string from a trip object.
 * Converts every activity in the current itinerary into a calendar event.
 *
 * @param {Object} trip - Trip object with latest itinerary
 * @returns {Promise<string>} ICS file content string
 */
export async function generateItineraryIcs(trip) {
  if (!trip || !trip.itinerary) {
    throw new Error('Trip does not contain an itinerary to export.');
  }

  const itinerary = trip.itinerary;
  const destination = trip.destination || itinerary.destination || 'Trip';
  const version = trip.itineraryVersion || 1;
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];

  if (days.length === 0) {
    throw new Error('Itinerary does not have any scheduled days or activities.');
  }

  // Base anchor date: Tomorrow starting at midnight
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);
  baseDate.setHours(0, 0, 0, 0);

  const events = [];

  for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
    const dayData = days[dayIdx];
    const dayNum = dayData.day || dayData.dayNumber || dayIdx + 1;
    const { year, month, day } = deriveDayDate(dayNum, dayData.date, baseDate);
    const activities = Array.isArray(dayData.activities) ? dayData.activities : [];

    for (let actIdx = 0; actIdx < activities.length; actIdx++) {
      const act = activities[actIdx];
      const { hour, minute } = parseActivityTime(act.time, actIdx);
      const duration = normalizeDuration(act.durationMinutes);

      const title = act.title || act.name || `Day ${dayNum} Activity ${actIdx + 1}`;
      const location = act.location ? `${act.location}, ${destination}` : destination;
      const category = act.category || 'sightseeing';

      // Build travel logistics note if available
      let travelInfo = '';
      if (act.travelFromPrevious && (act.travelFromPrevious.travelTimeMinutes || act.travelFromPrevious.distanceKm)) {
        const mode = act.travelFromPrevious.transportMode || 'transit';
        const tTime = act.travelFromPrevious.travelTimeMinutes ? `${act.travelFromPrevious.travelTimeMinutes} mins` : '';
        const tDist = act.travelFromPrevious.distanceKm ? ` (${act.travelFromPrevious.distanceKm} km)` : '';
        travelInfo = `Travel: ${mode} ~ ${tTime}${tDist}`;
      }

      // Build rich event description
      const descriptionLines = [
        act.description || title,
        '',
        `📍 Location: ${location}`,
        `💵 Est. Cost: $${act.estimatedCost != null ? act.estimatedCost : 0}`,
        `🏷️ Category: ${category}`,
        travelInfo ? `🚗 ${travelInfo}` : '',
        act.notes && act.notes !== act.description ? `💡 Tip: ${act.notes}` : '',
        '',
        `Itinerary: ${destination} • Day ${dayNum} • v${version}`,
      ].filter((line) => line !== '');

      const event = {
        title: `${destination}: ${title}`,
        start: [year, month, day, hour, minute],
        duration,
        location,
        description: descriptionLines.join('\n'),
        categories: [category, 'Travel'],
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
      };

      events.push(event);
    }
  }

  if (events.length === 0) {
    throw new Error('Itinerary has no activities to convert into calendar events.');
  }

  return new Promise((resolve, reject) => {
    createEvents(events, (error, value) => {
      if (error) {
        console.error('[Calendar Service] Failed to create ICS events:', error);
        return reject(new Error(`Failed to generate calendar events: ${error.message || error}`));
      }
      resolve(value);
    });
  });
}
