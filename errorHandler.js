/**
 * Centralized error-handling middleware.
 *
 * Catches all errors thrown or passed via next(err) in routes/controllers.
 * Returns a consistent JSON error response.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`❌ [${status}] ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  res.status(status).json({
    error: true,
    status,
    message,
  });
}
