import { healthRouter } from './healthRoutes.js';
import { tripRouter } from './tripRoutes.js';

/**
 * Mounts all API route groups onto the Express app.
 */
export function mountRoutes(app) {
  app.use('/api/health', healthRouter);
  app.use('/api/trips', tripRouter);
}
