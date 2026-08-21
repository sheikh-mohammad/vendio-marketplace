/**
 * 404 handler for unmatched routes.
 */
export function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * Central error handler — normalizes common Mongoose errors into
 * clean, user-friendly JSON responses with proper HTTP status codes.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";

  // Mongoose validation error → 400
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose duplicate key (unique email) → 400
  if (err.code === 11000) {
    statusCode = 400;
    message = "An account with this email already exists";
  }

  // Mongoose invalid ObjectId → 400 (must not crash the app)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id";
  }

  res.status(statusCode).json({
    status: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
