const express = require("express");

const {
  getUsers,
  getProfile,
  updateProfile,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { isAuth, isAdmin } = require("../middleware/auth");
const { param, body, query } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// All routes require authentication
router.use(isAuth);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get(
  "/",
  isAdmin,
  [
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
  getUsers,
);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/profile",
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("phoneNumber")
      .optional()
      .trim()
      // Accept Saudi (05x) and Egyptian (01x) formats
      .matches(/^(\+966|0)?5\d{8}$|^(\+20|0)?1[0125]\d{8}$/)
      .withMessage("Please provide a valid Saudi or Egyptian phone number"),
  ],
  validateRequest,
  updateProfile,
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update any user (Admin only)
 * @access  Private/Admin
 */
router.put(
  "/:id",
  isAdmin,
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("role")
      .optional()
      .isIn(["user", "admin"])
      .withMessage("Invalid role"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  validateRequest,
  updateUser,
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user (Admin only)
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  isAdmin,
  [param("id").isMongoId().withMessage("Invalid user ID")],
  validateRequest,
  deleteUser,
);

module.exports = router;
