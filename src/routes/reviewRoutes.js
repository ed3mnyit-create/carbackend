const express = require("express");
const { body, param, query } = require("express-validator");
const {
  createReview,
  getCarReviews,
  getUserReviews,
  deleteReview,
  getRecentReviews,
  getAllReviews,
} = require("../controllers/reviewController");
const { isAuth, isAdmin } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/**
 * @route   GET /api/reviews/car/:carId
 * @desc    Get all reviews for a car
 * @access  Public
 */
router.get(
  "/car/:carId",
  [
    param("carId").isMongoId().withMessage("Invalid car ID"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  validateRequest,
  getCarReviews,
);

/**
 * @route   POST /api/reviews
 * @desc    Create new review
 * @access  Private
 */
router.post(
  "/",
  isAuth,
  [
    body("carId")
      .notEmpty()
      .withMessage("Car ID is required")
      .isMongoId()
      .withMessage("Invalid car ID"),
    body("bookingId")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isMongoId()
      .withMessage("Invalid booking ID"),
    body("rating")
      .notEmpty()
      .withMessage("Rating is required")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Comment cannot exceed 500 characters"),
  ],
  validateRequest,
  createReview,
);

/**
 * @route   GET /api/reviews/user
 * @desc    Get current user's reviews
 * @access  Private
 */
router.get(
  "/user",
  isAuth,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  validateRequest,
  getUserReviews,
);

/**
 * @route   GET /api/reviews/recent
 * @desc    Get recent reviews for home page
 * @access  Public
 */
router.get("/recent", getRecentReviews);

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews for admin
 * @access  Private/Admin
 */
router.get("/admin/all", isAuth, isAdmin, getAllReviews);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  isAuth,
  isAdmin,
  [param("id").isMongoId().withMessage("Invalid review ID")],
  validateRequest,
  deleteReview,
);

module.exports = router;
