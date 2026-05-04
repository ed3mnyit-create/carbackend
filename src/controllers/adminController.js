const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Car = require("../models/Car");
const Booking = require("../models/Booking");
const Blog = require("../models/Blog");

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getStats = asyncHandler(async (req, res) => {
  // Get all stats in parallel for performance
  const [
    totalBookings,
    pendingBookings,
    approvedBookings,
    rejectedBookings,
    totalCars,
    availableCars,
    totalUsers,
    totalBlogs,
    revenueResult,
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: "pending" }),
    Booking.countDocuments({ status: "approved" }),
    Booking.countDocuments({ status: "rejected" }),
    Car.countDocuments(),
    Car.countDocuments({ available: true }),
    User.countDocuments({ role: "user" }), // Count only regular users
    Blog.countDocuments(),
    Booking.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
  ]);

  // Extract total revenue from aggregation result
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      totalCars,
      availableCars,
      totalUsers,
      totalBlogs,
      totalRevenue,
    },
  });
});

module.exports = {
  getStats,
};
