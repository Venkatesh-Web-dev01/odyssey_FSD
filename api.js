/**
 * API client service layer for the Travel Itinerary Planner frontend.
 * Interacts with Express server endpoints via Vite dev proxy (/api).
 */

const BASE_URL = '/api';

/**
 * Check backend health status.
 * @returns {Promise<{ status: string, timestamp: string, uptime: number }>}
 */
export async function fetchHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Creates a new trip.
 * @param {import('@travel-planner/shared').Trip} tripData
 * @returns {Promise<any>}
 */
export async function createTrip(tripData) {
  const response = await fetch(`${BASE_URL}/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create trip (${response.status})`);
  }

  return response.json();
}

/**
 * Fetches an existing trip with latest itinerary by ID.
 * @param {string} id
 * @returns {Promise<any>}
 */
export async function getTrip(id) {
  const response = await fetch(`${BASE_URL}/trips/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch trip (${response.status})`);
  }
  return response.json();
}

/**
 * Updates a trip itinerary state.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<any>}
 */
export async function updateTrip(id, updates) {
  const response = await fetch(`${BASE_URL}/trips/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update trip (${response.status})`);
  }

  return response.json();
}

/**
 * Triggers GenAI itinerary generation for a trip.
 * @param {string} tripId
 * @returns {Promise<any>}
 */
export async function generateItinerary(tripId) {
  const response = await fetch(`${BASE_URL}/trips/${tripId}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to generate itinerary (${response.status})`);
  }

  return response.json();
}

/**
 * Refines the current itinerary via conversational chat message.
 * @param {string} tripId
 * @param {string} message - The user's refinement request
 * @returns {Promise<any>}
 */
export async function refineItinerary(tripId, message) {
  const response = await fetch(`${BASE_URL}/trips/${tripId}/refine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to refine itinerary (${response.status})`);
  }

  return response.json();
}

/**
 * Exports the current trip itinerary as an A4 PDF.
 * Downloads the binary PDF blob and returns filename and blob.
 *
 * @param {string} tripId
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function exportTripPdf(tripId) {
  const response = await fetch(`${BASE_URL}/trips/${tripId}/export/pdf`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to export PDF (${response.status})`);
  }

  // Extract filename from Content-Disposition if present
  let filename = `Itinerary_${tripId}.pdf`;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
}

/**
 * Exports the current trip itinerary as an RFC 5545 standard .ics calendar file.
 * Downloads the text/calendar blob and returns filename and blob.
 *
 * @param {string} tripId
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function exportTripCalendar(tripId) {
  const response = await fetch(`${BASE_URL}/trips/${tripId}/export/calendar`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to export calendar (${response.status})`);
  }

  let filename = 'trip-itinerary.ics';
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
}

/**
 * Fetches geocoded coordinates for all activity locations in a trip's itinerary.
 *
 * @param {string} tripId
 * @returns {Promise<{ tripId: string, destination: string, totalLocations: number, locations: Array }>}
 */
export async function geocodeTrip(tripId) {
  const response = await fetch(`${BASE_URL}/trips/${tripId}/geocode`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to geocode trip locations (${response.status})`);
  }

  return response.json();
}
