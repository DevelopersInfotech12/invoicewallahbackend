/* ── 404 handler ── */
export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/* ── Global error handler ── */
export function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  /* Mongoose validation error */
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(", ") });
  }

  /* Mongoose duplicate key */
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error:   `An account with this ${field} already exists.`,
    });
  }

  /* JWT errors */
  if (err.name === "JsonWebTokenError")  return res.status(401).json({ success:false, error:"Invalid token." });
  if (err.name === "TokenExpiredError")  return res.status(401).json({ success:false, error:"Token expired. Please log in again." });

  res.status(statusCode).json({
    success: false,
    error:   err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
