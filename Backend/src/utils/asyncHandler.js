/**
 * Wraps an async Express handler so that any rejected promise is forwarded to
 * Express's error-handling middleware via next(err).
 *
 * On Express 4, an unhandled rejection inside an async route is NOT passed to
 * the error handler — the request hangs with no response. This wrapper fixes
 * that so failures return a proper error status instead of hanging.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Convenience helper: wrap every function on a controller's exports object.
 * Non-function values are passed through unchanged.
 */
const wrapAll = (handlers) => {
  const wrapped = {};
  for (const [key, value] of Object.entries(handlers)) {
    wrapped[key] = typeof value === 'function' ? asyncHandler(value) : value;
  }
  return wrapped;
};

module.exports = asyncHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.wrapAll = wrapAll;
