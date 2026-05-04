const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require("./config/db");

// Import app
const app = require("./app");

// Create uploads directories if they don't exist (only for local development)
// Vercel has a read-only filesystem, so we skip this
if (!process.env.VERCEL) {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  const carsDir = path.join(uploadsDir, "cars");
  const documentsDir = path.join(uploadsDir, "documents");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("Created uploads directory");
  }

  if (!fs.existsSync(carsDir)) {
    fs.mkdirSync(carsDir, { recursive: true });
    console.log("Created uploads/cars directory");
  }

  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
    console.log("Created uploads/documents directory");
  }
}

// Port configuration
const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚗 Server running → http://localhost:${PORT}/api`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        console.log("💥 Process terminated!");
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server (only for local development, not Vercel)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}

// Export app for Vercel serverless functions
module.exports = app;
