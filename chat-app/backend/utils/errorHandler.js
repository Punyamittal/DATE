/**
 * Wraps async route handlers to properly catch and forward errors to the global error handler
 * @param {Function} fn - The async route handler function
 * @returns {Function} A wrapped route handler that catches errors and passes them to next()
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Creates a custom error with specified status code and message
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  asyncHandler,
  AppError
}; 