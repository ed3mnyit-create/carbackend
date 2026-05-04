const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const isAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "Not authorized, user not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Not authorized, invalid token");
    }
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Not authorized, token expired");
    }
    throw error;
  }
});

/**
 * Admin authorization middleware
 * Must be used after isAuth middleware
 * Checks if user has admin role
 */
const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Not authorized, please login first");
  }

  if (req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized, admin access required");
  }

  next();
});

/**
 * Optional authentication middleware
 * Attaches user to request if token exists, but does not block if it doesn't
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore errors for optional auth
    }
  }
  next();
});

module.exports = { isAuth, isAdmin, optionalAuth };
