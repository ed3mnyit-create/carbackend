const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Car = require("../models/Car");
const ApiError = require("../utils/ApiError");

/**
 * Helper function to build full image URL
 * @param {Object} req - Express request object
 * @param {string} imagePath - Relative image path
 * @returns {string} - Full URL
 */
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${req.protocol}://${req.get("host")}/${imagePath}`;
};

/**
 * @desc    Create new review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { carId, bookingId, rating, comment } = req.body;

  // Check if car exists
  const car = await Car.findById(carId);
  if (!car) {
    throw new ApiError(404, "Car not found");
  }

  // Check if booking exists and belongs to user
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Verify booking belongs to user
  if (booking.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to review this booking");
  }

  // Verify booking is for the specified car
  if (booking.car.toString() !== carId) {
    throw new ApiError(400, "Booking is not for this car");
  }

  // Verify booking is approved
  if (booking.status !== "approved") {
    throw new ApiError(400, "You can only review approved bookings");
  }

  // Check if user already reviewed this booking
  const existingReview = await Review.findOne({
    user: req.user._id,
    booking: bookingId,
  });
  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this booking");
  }

  // Create review
  const review = await Review.create({
    user: req.user._id,
    car: carId,
    booking: bookingId,
    rating: parseInt(rating),
    comment: comment || "",
  });

  // Mark booking as reviewed
  await Booking.findByIdAndUpdate(bookingId, { isReviewed: true });

  // Update car's average rating
  await Review.calculateAverageRating(car._id);

  // Populate user info for response
  await review.populate("user", "name");

  res.status(201).json({
    success: true,
    data: review,
    message: "تم إضافة التقييم بنجاح",
  });
});

/**
 * @desc    Get all reviews for a car
 * @route   GET /api/reviews/car/:carId
 * @access  Public
 */
const getCarReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
 
  // Check if car exists
  const car = await Car.findById(req.params.carId);
  if (!car) {
    throw new ApiError(404, "Car not found");
  }

  // Pagination with max cap protection
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  // Get reviews
  const [reviews, total] = await Promise.all([
    Review.find({ car: req.params.carId })
      .populate("user", "name") // Only name, not email for privacy
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments({ car: req.params.carId }),
  ]);

  const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        limit: limitNum,
      },
    },
  });
});

/**
 * @desc    Get current user's reviews
 * @route   GET /api/reviews/user
 * @access  Private
 */
const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  // Pagination with max cap protection
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  // Get user's reviews
  const [reviews, total] = await Promise.all([
    Review.find({ user: req.user._id })
      .populate("car", "name image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments({ user: req.user._id }),
  ]);

  // Add full image URLs
  const reviewsWithUrls = reviews.map((review) => ({
    ...review,
    car: review.car
      ? {
          ...review.car,
          image: getFullImageUrl(req, review.car.image),
        }
      : null,
  }));

  const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

  res.status(200).json({
    success: true,
    data: {
      reviews: reviewsWithUrls,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        limit: limitNum,
      },
    },
  });
});

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private/Admin
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Store car ID before deletion
  const carId = review.car;

  // Delete review
  await review.deleteOne();

  // Recalculate car's average rating
  await Review.calculateAverageRating(carId);

  res.status(200).json({
    success: true,
    message: "تم حذف التقييم بنجاح",
  });
});

/**
 * @desc    Get recent reviews globally for home page
 * @route   GET /api/reviews/recent
 * @access  Public
 */
const getRecentReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("user", "name image")
    .populate("car", "name")
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  res.status(200).json({
    success: true,
    data: reviews,
  });
});

/**
 * @desc    Get all reviews for admin
 * @route   GET /api/reviews/admin/all
 * @access  Private/Admin
 */
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find()
      .populate("user", "name email")
      .populate("car", "name image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(),
  ]);

  const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        limit: limitNum,
      },
    },
  });
});

module.exports = {
  createReview,
  getCarReviews,
  getUserReviews,
  deleteReview,
  getRecentReviews,
  getAllReviews,
};
