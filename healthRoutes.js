import { Router } from 'express';

export const healthRouter = Router();

/**
 * GET /api/health
 * Returns server health status, timestamp, and uptime.
 */
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
