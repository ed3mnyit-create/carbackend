const express = require("express");
const { body, param, query } = require("express-validator");
const {
  createBooking,
  getBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  deleteBooking,
} = require("../controllers/bookingController");
const { isAuth, isAdmin } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// All routes require authentication
router.use(isAuth);

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post(
  "/",
  [
    body("carId")
      .notEmpty()
      .withMessage("Car ID is required")
      .isMongoId()
      .withMessage("Invalid car ID"),
    body("phoneNumber")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[\d\s\+\-\(\)]+$/)
      .withMessage("Please provide a valid phone number")
      .isLength({ min: 8 })
      .withMessage("Phone number is too short"),
    body("kmPerDay")
      .notEmpty()
      .withMessage("Kilometers per day is required")
      .isInt({ min: 1 })
      .withMessage("Kilometers per day must be at least 1"),
    body("numberOfDays")
      .notEmpty()
      .withMessage("Number of days is required")
      .isFloat({ min: 0.1 })
      .withMessage("Number of days must be at least 0.1"),
    body("idCardImageUrl")
      .notEmpty()
      .withMessage("ID Card Image URL is required")
      .isURL()
      .withMessage("Please provide a valid ID Card Image URL"),
    body("licenseImageUrl")
      .notEmpty()
      .withMessage("License Image URL is required")
      .isURL()
      .withMessage("Please provide a valid License Image URL"),
    body("startDate")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .withMessage("Please provide a valid start date"),
    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("Please provide a valid end date"),
  ],
  validateRequest,
  createBooking,
);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (user gets their own, admin gets all)
 * @access  Private
 */
router.get(
  "/",
  [
    query("status")
      .optional()
      .isIn(["pending", "approved", "rejected"])
      .withMessage("Status must be pending, approved, or rejected"),
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
  getBookings,
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking
 * @access  Private
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid booking ID")],
  validateRequest,
  getBooking,
);

/**
 * @route   PATCH /api/bookings/:id/approve
 * @desc    Approve booking
 * @access  Private/Admin
 */
router.patch(
  "/:id/approve",
  isAdmin,
  [param("id").isMongoId().withMessage("Invalid booking ID")],
  validateRequest,
  approveBooking,
);

/**
 * @route   PATCH /api/bookings/:id/reject
 * @desc    Reject booking
 * @access  Private/Admin
 */
router.patch(
  "/:id/reject",
  isAdmin,
  [param("id").isMongoId().withMessage("Invalid booking ID")],
  validateRequest,
  rejectBooking,
);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete booking
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  isAdmin,
  [param("id").isMongoId().withMessage("Invalid booking ID")],
  validateRequest,
  deleteBooking,
);

module.exports = router;
