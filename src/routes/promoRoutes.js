const express = require("express");
const { body, param } = require("express-validator");
const {
  getActivePromos,
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
} = require("../controllers/promoController");
const { isAuth, isAdmin } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// Public routes
router.get("/", getActivePromos);

// Admin routes (requires authentication and admin role)
router.use(isAuth);
router.use(isAdmin);

router.get("/admin", getAllPromos);

router.post("/",
  [
    body("title").trim().isLength({ min: 2, max: 60 }).withMessage("Title must be 2-60 characters"),
    body("subtitle").trim().isLength({ min: 2, max: 150 }).withMessage("Subtitle must be 2-150 characters"),
    body("imageUrl").notEmpty().withMessage("Image URL is required"),
    body("linkUrl").optional({ checkFalsy: true }).isString(),
    body("layoutType").optional().isIn(["image-left", "image-right", "full-bg"]),
    body("priority").optional().isNumeric(),
    body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  ],
  validateRequest,
  createPromo
);

router.route("/:id")
  .put(
    [
      param("id").isMongoId().withMessage("Invalid promo ID"),
      body("title").optional().trim().isLength({ min: 2, max: 60 }).withMessage("Title must be 2-60 characters"),
      body("subtitle").optional().trim().isLength({ min: 2, max: 150 }).withMessage("Subtitle must be 2-150 characters"),
      body("layoutType").optional().isIn(["image-left", "image-right", "full-bg"]).withMessage("Invalid layout type"),
      body("priority").optional({ nullable: true }).isNumeric().withMessage("Priority must be a number"),
      body("expiresAt").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid expiry date form"),
    ],
    validateRequest,
    updatePromo
  )
  .delete(
    [param("id").isMongoId().withMessage("Invalid promo ID")],
    validateRequest,
    deletePromo
  );

module.exports = router;