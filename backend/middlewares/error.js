export function notFound(req, res, next) {
  next(new Error(`Not Found - ${req.originalUrl}`));
}

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

  res.json({ status: false, message });
}
