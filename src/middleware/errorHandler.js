const ApiError = require("../utils/ApiError");

/**
 * Global error handler middleware
 * Handles all errors and returns consistent response format
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for development
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  // Mongoose bad ObjectId error
  if (err.name === "CastError") {
    if (err.path === "_id") {
      const message = "Resource not found";
      error = new ApiError(404, message);
    } else {
      const message = `Invalid value for ${err.path}`;
      error = new ApiError(400, message);
    }
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = messages.join(". ");
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired");
  }

  // Default status code
  const statusCode = error.statusCode || 500;

  // Response object
  const response = {
    success: false,
    message: error.message || "Internal Server Error",
  };

  // Include error details in development mode
  if (process.env.NODE_ENV === "development") {
    response.error = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
