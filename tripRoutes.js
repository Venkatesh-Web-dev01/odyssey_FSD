import { Router } from 'express';
import * as tripController from '../controllers/tripController.js';
import * as geocodeController from '../controllers/geocodeController.js';

export const tripRouter = Router();

/**
 * POST /api/trips
 * Create a new trip and trigger itinerary generation.
 */
tripRouter.post('/', tripController.createTrip);

/**
 * GET /api/trips/:id
 * Retrieve a trip and its current itinerary.
 */
tripRouter.get('/:id', tripController.getTrip);

/**
 * PUT /api/trips/:id
 * Update a trip's itinerary (e.g., after chat refinement).
 */
tripRouter.put('/:id', tripController.updateTrip);

/**
 * POST /api/trips/:tripId/generate
 * Trigger GenAI itinerary generation for a trip.
 */
tripRouter.post('/:tripId/generate', tripController.generateItinerary);

/**
 * POST /api/trips/:tripId/refine
 * Refine the current itinerary via conversational chat.
 */
tripRouter.post('/:tripId/refine', tripController.refineItinerary);

/**
 * GET /api/trips/:tripId/export/pdf
 * Export the current itinerary as an A4 PDF document.
 */
tripRouter.get('/:tripId/export/pdf', tripController.exportPdf);

/**
 * GET /api/trips/:tripId/export/calendar
 * Export the current itinerary as an RFC 5545 .ics calendar file.
 */
tripRouter.get('/:tripId/export/calendar', tripController.exportCalendar);

/**
 * GET /api/trips/:tripId/geocode
 * Geocode all activity locations in the trip's current itinerary.
 */
tripRouter.get('/:tripId/geocode', geocodeController.geocodeTrip);

