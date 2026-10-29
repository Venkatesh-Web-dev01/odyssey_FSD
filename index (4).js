/**
 * @travel-planner/shared
 *
 * Canonical data models, schemas, and validation helpers
 * shared between client and server workspaces.
 */

export {
  ACTIVITY_CATEGORIES,
  TRANSPORT_MODES,
  TRIP_STATUSES,
  BUDGET_TIERS,
  AVAILABLE_INTERESTS,
  createEmptyTrip,
  createEmptyDay,
  createEmptyActivity,
  createEmptyLogistics,
  createEmptyItinerary,
  validateTrip,
  validateItinerarySchema,
  generateMockItinerary,
  sortActivitiesChronologically,
  reconcileItineraryCosts,
} from './schemas.js';
