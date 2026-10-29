import * as tripService from '../services/tripService.js';
import * as pdfService from '../services/pdfService.js';
import * as calendarService from '../services/calendarService.js';

/**
 * POST /api/trips
 * Creates a new trip record. AI generation will be added in Milestone 1.
 */
export async function createTrip(req, res, next) {
  try {
    const trip = await tripService.createTrip(req.body);
    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trips/:id
 * Retrieves a trip and its latest itinerary.
 */
export async function getTrip(req, res, next) {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({
        error: true,
        message: 'Trip not found',
      });
    }
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/trips/:id
 * Updates a trip's itinerary. Chat refinement will be added in Milestone 2.
 */
export async function updateTrip(req, res, next) {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body);
    if (!trip) {
      return res.status(404).json({
        error: true,
        message: 'Trip not found',
      });
    }
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/trips/:tripId/generate
 * Calls AI service to generate a new itinerary for the trip.
 */
export async function generateItinerary(req, res, next) {
  try {
    const { tripId } = req.params;
    const result = await tripService.generateTripItinerary(tripId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/trips/:tripId/refine
 * Refines the current itinerary based on a user's conversational message.
 */
export async function refineItinerary(req, res, next) {
  try {
    const { tripId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'A non-empty "message" string is required for refinement.',
      });
    }

    const result = await tripService.refineTripItinerary(tripId, message.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trips/:tripId/export/pdf
 * Generates and streams an A4 PDF document of the latest itinerary.
 */
export async function exportPdf(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await tripService.getTripById(tripId);

    if (!trip) {
      return res.status(404).json({
        error: true,
        message: `Trip with ID "${tripId}" was not found.`,
      });
    }

    if (!trip.itinerary) {
      return res.status(400).json({
        error: true,
        message: 'This trip does not have an itinerary to export. Please generate one first.',
      });
    }

    const pdfBuffer = await pdfService.generateItineraryPdf(trip);

    const safeDest = (trip.destination || 'Trip').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Itinerary_${safeDest}_v${trip.itineraryVersion || 1}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trips/:tripId/export/calendar
 * Generates and streams an RFC 5545 standard .ics calendar file of the latest itinerary.
 */
export async function exportCalendar(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await tripService.getTripById(tripId);

    if (!trip) {
      return res.status(404).json({
        error: true,
        message: `Trip with ID "${tripId}" was not found.`,
      });
    }

    if (!trip.itinerary) {
      return res.status(400).json({
        error: true,
        message: 'This trip does not have an itinerary to export. Please generate one first.',
      });
    }

    const icsContent = await calendarService.generateItineraryIcs(trip);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="trip-itinerary.ics"');

    return res.send(icsContent);
  } catch (err) {
    next(err);
  }
}
