import { randomUUID } from 'crypto';
import { getDb } from '../db/database.js';
import { validateTrip, TRIP_STATUSES, generateMockItinerary } from '@travel-planner/shared';
import * as itineraryAIService from './itineraryAIService.js';

/**
 * Creates a new trip record in the database and attaches
 * a structured, clearly marked mock itinerary for Milestone 1.
 *
 * @param {Object} input - Trip input from the client
 * @returns {Object} The created trip record with itinerary
 */
export async function createTrip(input) {
  const validation = validateTrip(input);
  if (!validation.valid) {
    const err = new Error(validation.errors.join(' '));
    err.status = 400;
    throw err;
  }

  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const budgetValue = typeof input.budget === 'string' ? input.budget.toLowerCase() : String(input.budget);

  db.prepare(`
    INSERT INTO trips (id, destination, duration_days, budget, interests, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.destination.trim(),
    Number(input.durationDays),
    budgetValue,
    JSON.stringify(input.interests),
    TRIP_STATUSES.GENERATED,
    now,
    now
  );

  const tripRecord = {
    id,
    destination: input.destination.trim(),
    durationDays: Number(input.durationDays),
    budget: input.budget,
    interests: input.interests,
    status: TRIP_STATUSES.GENERATED,
    createdAt: now,
    updatedAt: now,
  };

  // Generate clearly marked mock itinerary
  const mockItinerary = generateMockItinerary(tripRecord);

  // Persist version 1 in itineraries table
  db.prepare(`
    INSERT INTO itineraries (trip_id, itinerary_data, version, created_at)
    VALUES (?, ?, ?, ?)
  `).run(
    id,
    JSON.stringify(mockItinerary),
    1,
    now
  );

  return {
    ...tripRecord,
    itinerary: mockItinerary,
    itineraryVersion: 1,
    isMock: true,
  };
}

/**
 * Retrieves a trip by ID, along with its latest itinerary version.
 *
 * @param {string} id
 * @returns {Object|null}
 */
export async function getTripById(id) {
  const db = getDb();

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) return null;

  const latestItinerary = db.prepare(
    'SELECT * FROM itineraries WHERE trip_id = ? ORDER BY version DESC LIMIT 1'
  ).get(id);

  const chatHistory = db.prepare(
    'SELECT * FROM chat_messages WHERE trip_id = ? ORDER BY created_at ASC'
  ).all(id);

  const parsedItinerary = latestItinerary ? JSON.parse(latestItinerary.itinerary_data) : null;

  return {
    id: trip.id,
    destination: trip.destination,
    durationDays: trip.duration_days,
    budget: trip.budget,
    interests: JSON.parse(trip.interests),
    status: trip.status,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
    itinerary: parsedItinerary,
    itineraryVersion: latestItinerary?.version || 0,
    isMock: parsedItinerary ? Boolean(parsedItinerary.isMock) : true,
    chatHistory: chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at,
    })),
  };
}

/**
 * Updates a trip. Full implementation in Milestone 2 (chat refinement).
 *
 * @param {string} id
 * @param {Object} updates
 * @returns {Object|null}
 */
export async function updateTrip(id, updates) {
  const db = getDb();

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) return null;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE trips SET
      destination = COALESCE(?, destination),
      duration_days = COALESCE(?, duration_days),
      budget = COALESCE(?, budget),
      interests = COALESCE(?, interests),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.destination || null,
    updates.durationDays || null,
    updates.budget || null,
    updates.interests ? JSON.stringify(updates.interests) : null,
    updates.status || null,
    now,
    id
  );

  return getTripById(id);
}

/**
 * Triggers GenAI itinerary generation for a trip, persists
 * the validated result in SQLite with an incremented version,
 * and updates trip status.
 *
 * @param {string} tripId
 * @returns {Promise<Object>}
 */
export async function generateTripItinerary(tripId) {
  const db = getDb();
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) {
    const err = new Error(`Trip with ID "${tripId}" was not found.`);
    err.status = 404;
    throw err;
  }

  const tripParams = {
    id: trip.id,
    destination: trip.destination,
    durationDays: trip.duration_days,
    budget: trip.budget,
    interests: JSON.parse(trip.interests),
  };

  // Generate itinerary via AI service (or dev fallback mode)
  const itinerary = await itineraryAIService.generateItinerary(tripParams);

  // Find next version number for this trip
  const latest = db.prepare(
    'SELECT version FROM itineraries WHERE trip_id = ? ORDER BY version DESC LIMIT 1'
  ).get(tripId);

  const nextVersion = (latest?.version || 0) + 1;
  const now = new Date().toISOString();

  // Persist into itineraries table
  db.prepare(`
    INSERT INTO itineraries (trip_id, itinerary_data, version, created_at)
    VALUES (?, ?, ?, ?)
  `).run(
    tripId,
    JSON.stringify(itinerary),
    nextVersion,
    now
  );

  // Update trip status and timestamp
  db.prepare(`
    UPDATE trips SET status = ?, updated_at = ? WHERE id = ?
  `).run(TRIP_STATUSES.GENERATED, now, tripId);

  return {
    ...tripParams,
    status: TRIP_STATUSES.GENERATED,
    itinerary,
    itineraryVersion: nextVersion,
    isMock: Boolean(itinerary.isMock),
    createdAt: trip.created_at,
    updatedAt: now,
  };
}

/**
 * Refines the current itinerary based on a user's conversational message.
 * Loads the trip, current itinerary, and chat history, calls the AI
 * refinement service, persists the refined itinerary as a new version,
 * stores chat messages, and returns the updated trip.
 *
 * @param {string} tripId
 * @param {string} userMessage
 * @returns {Promise<Object>}
 */
export async function refineTripItinerary(tripId, userMessage) {
  const db = getDb();

  // 1. Load trip
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) {
    const err = new Error(`Trip with ID "${tripId}" was not found.`);
    err.status = 404;
    throw err;
  }

  // 2. Load latest itinerary
  const latestItineraryRow = db.prepare(
    'SELECT * FROM itineraries WHERE trip_id = ? ORDER BY version DESC LIMIT 1'
  ).get(tripId);

  if (!latestItineraryRow) {
    const err = new Error('No itinerary found for this trip. Generate one first.');
    err.status = 400;
    throw err;
  }

  const currentItinerary = JSON.parse(latestItineraryRow.itinerary_data);

  // 3. Load chat history
  const chatRows = db.prepare(
    'SELECT role, content FROM chat_messages WHERE trip_id = ? ORDER BY created_at ASC'
  ).all(tripId);

  const tripParams = {
    destination: trip.destination,
    durationDays: trip.duration_days,
    budget: trip.budget,
    interests: JSON.parse(trip.interests),
  };

  // 4. Call AI refinement service
  const refinedItinerary = await itineraryAIService.refineItinerary(
    tripParams,
    currentItinerary,
    chatRows,
    userMessage
  );

  // 5. Persist refined itinerary as new version
  const nextVersion = (latestItineraryRow.version || 0) + 1;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO itineraries (trip_id, itinerary_data, version, created_at)
    VALUES (?, ?, ?, ?)
  `).run(
    tripId,
    JSON.stringify(refinedItinerary),
    nextVersion,
    now
  );

  // 6. Persist chat messages (user message + AI summary response)
  db.prepare(`
    INSERT INTO chat_messages (trip_id, role, content, created_at)
    VALUES (?, ?, ?, ?)
  `).run(tripId, 'user', userMessage, now);

  const aiSummary = `Itinerary updated (v${nextVersion}). Applied your request: "${userMessage}"`;
  db.prepare(`
    INSERT INTO chat_messages (trip_id, role, content, created_at)
    VALUES (?, ?, ?, ?)
  `).run(tripId, 'assistant', aiSummary, now);

  // 7. Update trip status and timestamp
  db.prepare(`
    UPDATE trips SET status = ?, updated_at = ? WHERE id = ?
  `).run(TRIP_STATUSES.GENERATED, now, tripId);

  // 8. Reload full chat history for response
  const fullChatHistory = db.prepare(
    'SELECT role, content, created_at FROM chat_messages WHERE trip_id = ? ORDER BY created_at ASC'
  ).all(tripId);

  return {
    id: trip.id,
    ...tripParams,
    status: TRIP_STATUSES.GENERATED,
    itinerary: refinedItinerary,
    itineraryVersion: nextVersion,
    isMock: Boolean(refinedItinerary.isMock),
    createdAt: trip.created_at,
    updatedAt: now,
    chatHistory: fullChatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at,
    })),
  };
}
