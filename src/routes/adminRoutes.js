const express = require("express");
const { getStats } = require("../controllers/adminController");
const { isAuth, isAdmin } = require("../middleware/auth");

const router = express.Router();

// All routes require admin authentication
router.use(isAuth);
router.use(isAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private/Admin
 */
router.get("/stats", getStats);

module.exports = router;
