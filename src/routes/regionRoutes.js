const express = require("express");

const router = express.Router();

/**
 * Static regions data
 * These are the available regions for car rental
 */
const regions = [
  { id: "eastern", name: "المنطقة الشرقية" },
  { id: "jeddah", name: "جدة" },
  { id: "riyadh", name: "الرياض" },
];

/**
 * @route   GET /api/regions
 * @desc    Get all available regions
 * @access  Public
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: regions,
  });
});

module.exports = router;
