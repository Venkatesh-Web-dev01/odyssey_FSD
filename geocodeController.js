/**
 * Geocode Controller
 *
 * Handles geocoding requests for trip itinerary locations.
 * Returns lat/lng coordinates for all resolvable activity locations.
 */

import * as tripService from '../services/tripService.js';
import * as geocodingService from '../services/geocodingService.js';

/**
 * GET /api/trips/:tripId/geocode
 *
 * Geocodes all activity locations in the trip's current itinerary.
 * Returns an array of { activityId, day, lat, lng, title, time, location, category }.
 * Activities whose locations cannot be resolved are silently omitted.
 */
export async function geocodeTrip(req, res, next) {
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
        message: 'This trip does not have an itinerary. Please generate one first.',
      });
    }

    const locations = await geocodingService.geocodeItinerary(
      trip.itinerary,
      trip.destination
    );

    return res.json({
      tripId,
      destination: trip.destination,
      totalLocations: locations.length,
      locations,
    });
  } catch (err) {
    next(err);
  }
}
