const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Uses the MONGODB_URI from environment variables
 * Caches connection for serverless environments via mongoose readyState
 */
const connectDB = async () => {
  // If already connected and ready, reuse connection (important for serverless)
  if (mongoose.connection.readyState === 1) {
    return;
  }
  
  // If connection is connecting or disconnecting, wait for it
  if (mongoose.connection.readyState === 2) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit process in serverless environment
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};

module.exports = connectDB;

