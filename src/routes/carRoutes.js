const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
} = require("../controllers/carController");
const { isAuth, isAdmin } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/**
 * @route   GET /api/cars
 * @desc    Get all cars with filters and pagination
 * @access  Public
 */
router.get(
  "/",
  [
    query("region")
      .optional()
      .isIn(["eastern", "jeddah", "riyadh"])
      .withMessage("Invalid region"),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Min price must be a positive number"),
    query("available")
      .optional()
      .isBoolean()
      .withMessage("Available must be a boolean"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Max price must be a positive number"),
    query("year")
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage("Invalid year"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  validateRequest,
  getCars,
);

/**
 * @route   GET /api/cars/:id
 * @desc    Get single car by ID
 * @access  Public
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid car ID")],
  validateRequest,
  getCar,
);

/**
 * @route   POST /api/cars
 * @desc    Create new car
 * @access  Private/Admin
 */
router.post(
  "/",
  isAuth,
  isAdmin,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Car name is required")
      .isLength({ min: 2 })
      .withMessage("Car name must be at least 2 characters"),
    body("year")
      .notEmpty()
      .withMessage("Year is required")
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage(
        `Year must be between 2000 and ${new Date().getFullYear() + 1}`,
      ),
    body("region")
      .notEmpty()
      .withMessage("Region is required")
      .isIn(["eastern", "jeddah", "riyadh"])
      .withMessage("Region must be eastern, jeddah, or riyadh"),
    body("pricePerDay")
      .notEmpty()
      .withMessage("Price per day is required")
      .isFloat({ min: 1 })
      .withMessage("Price must be at least 1 SAR"),
    body("priceWeekly")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Weekly price must be at least 1 SAR"),
    body("priceHalfMonth")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Half-month price must be at least 1 SAR"),
    body("priceMonthly")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Monthly price must be at least 1 SAR"),
    body("seats")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Seats must be at least 1"),
    body("fuelType")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Fuel type must be at least 2 characters"),
    body("imageUrl")
      .notEmpty()
      .withMessage("Image URL is required")
      .isURL()
      .withMessage("Please provide a valid image URL"),
  ],
  validateRequest,
  createCar,
);

/**
 * @route   PUT /api/cars/:id
 * @desc    Update car
 * @access  Private/Admin
 */
router.put(
  "/:id",
  isAuth,
  isAdmin,
  [
    param("id").isMongoId().withMessage("Invalid car ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Car name must be at least 2 characters"),
    body("year")
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage(
        `Year must be between 2000 and ${new Date().getFullYear() + 1}`,
      ),
    body("region")
      .optional()
      .isIn(["eastern", "jeddah", "riyadh"])
      .withMessage("Region must be eastern, jeddah, or riyadh"),
    body("pricePerDay")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Price must be at least 1 SAR"),
    body("priceWeekly")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Weekly price must be at least 1 SAR"),
    body("priceHalfMonth")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Half-month price must be at least 1 SAR"),
    body("priceMonthly")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Monthly price must be at least 1 SAR"),
    body("seats")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Seats must be at least 1"),
    body("fuelType")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Fuel type must be at least 2 characters"),
    body("available")
      .optional()
      .isBoolean()
      .withMessage("Available must be a boolean"),
    body("imageUrl")
      .optional()
      .isURL()
      .withMessage("Please provide a valid image URL"),
  ],
  validateRequest,
  updateCar,
);

/**
 * @route   DELETE /api/cars/:id
 * @desc    Delete car
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  isAuth,
  isAdmin,
  [param("id").isMongoId().withMessage("Invalid car ID")],
  validateRequest,
  deleteCar,
);

module.exports = router;
