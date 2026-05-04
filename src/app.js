const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const hpp = require("hpp");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const regionRoutes = require("./routes/regionRoutes");
const carRoutes = require("./routes/carRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const blogRoutes = require("./routes/blogRoutes");
const settingRoutes = require("./routes/settingRoutes");
const promoRoutes = require("./routes/promoRoutes");


// Import middleware
const errorHandler = require("./middleware/errorHandler");
const ApiError = require("./utils/ApiError");

// Import database connection for Vercel
const connectDB = require("./config/db");

// Initialize express app
const app = express();

// Trust proxy to fix rate limit warnings in Vercel
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving images cross-origin
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    xssFilter: true, // Enable XSS filter
    hidePoweredBy: true, // Hide X-Powered-By header
  }),
);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Database connection middleware for Vercel serverless
// Placed after CORS to ensure error responses have proper headers
app.use(async (req, res, next) => {
  // Skip DB connection for simple health checks or favicon
  if (req.path === "/favicon.ico" || req.path === "/") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Sanitize data to prevent NoSQL injection
const mongoSanitize = require("express-mongo-sanitize");
app.use(mongoSanitize());

// Prevent XSS attacks
const xssClean = require("./middleware/xss");
app.use(xssClean);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/promos", promoRoutes);


// Ignore favicon requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Root and /api welcome routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "Car Rental API - Use /api/* endpoints" });
});
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Car Rental API",
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
