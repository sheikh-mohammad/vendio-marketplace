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
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.code === 11000) {
    message = "An account with this email already exists";
  }

  if (err.name === "CastError") {
    message = "Invalid resource id";
  }

  res.json({
    status: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
