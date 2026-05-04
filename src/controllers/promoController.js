const asyncHandler = require("express-async-handler");
const Promo = require("../models/Promo");
const ApiError = require("../utils/ApiError");

/**
 * @desc    Get all active promos (Public)
 * @route   GET /api/promos
 * @access  Public
 */
const getActivePromos = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const promos = await Promo.find({ 
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  })
    .sort({ priority: 1, createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: promos.length,
    data: promos,
  });
});

/**
 * @desc    Get all promos (Admin)
 * @route   GET /api/promos/admin
 * @access  Private/Admin
 */
const getAllPromos = asyncHandler(async (req, res) => {
  const promos = await Promo.find()
    .sort({ priority: 1, createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: promos.length,
    data: promos,
  });
});

/**
 * @desc    Create new promo
 * @route   POST /api/promos
 * @access  Private/Admin
 */
const createPromo = asyncHandler(async (req, res) => {
  const { title, subtitle, imageUrl, linkUrl, layoutType, isActive, priority, expiresAt } = req.body;

  // Validation
  if (!title || title.trim().length < 2) {
    throw new ApiError(400, "Title must be at least 2 characters");
  }
  if (title.length > 60) {
    throw new ApiError(400, "Title cannot exceed 60 characters");
  }
  if (!subtitle || subtitle.trim().length < 2) {
    throw new ApiError(400, "Subtitle must be at least 2 characters");
  }
  if (subtitle.length > 150) {
    throw new ApiError(400, "Subtitle cannot exceed 150 characters");
  }
  if (!imageUrl) {
    throw new ApiError(400, "Image URL is required");
  }
  // Validate URL format if provided
  if (linkUrl) {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    // We allow internal links like /cars or tel: so we bypass strict regex if it starts with / or tel:
    if (!linkUrl.startsWith('/') && !linkUrl.startsWith('tel:') && !urlPattern.test(linkUrl)) {
      throw new ApiError(400, "Please provide a valid link URL");
    }
  }

  // Validate layout type
  const validLayouts = ["image-left", "image-right", "full-bg"];
  if (layoutType && !validLayouts.includes(layoutType)) {
    throw new ApiError(400, "Invalid layout type");
  }

  // Validate priority
  if (priority !== undefined && (typeof priority !== 'number' || priority < 0)) {
    throw new ApiError(400, "Priority must be a positive number");
  }

  // Validate expiresAt if provided
  if (expiresAt && new Date(expiresAt) < new Date()) {
    throw new ApiError(400, "Expiry date must be in the future");
  }

  const promo = await Promo.create({
    title: title.trim(),
    subtitle: subtitle.trim(),
    imageUrl,
    linkUrl,
    layoutType: layoutType || "image-right",
    isActive: isActive !== false,
    priority: priority || 0,
    expiresAt: expiresAt || null,
  });

  res.status(201).json({
    success: true,
    data: promo,
    message: "Promo created successfully",
  });
});

/**
 * @desc    Update promo
 * @route   PUT /api/promos/:id
 * @access  Private/Admin
 */
const updatePromo = asyncHandler(async (req, res) => {
  const { title, subtitle, imageUrl, linkUrl, layoutType, isActive, priority, expiresAt } = req.body;
  
  let promo = await Promo.findById(req.params.id);

  if (!promo) {
    throw new ApiError(404, "Promo not found");
  }

  // Build update object with validation
  const updateData = {};

  if (title !== undefined) {
    if (title.trim().length < 2) {
      throw new ApiError(400, "Title must be at least 2 characters");
    }
    if (title.length > 60) {
      throw new ApiError(400, "Title cannot exceed 60 characters");
    }
    updateData.title = title.trim();
  }

  if (subtitle !== undefined) {
    if (subtitle.trim().length < 2) {
      throw new ApiError(400, "Subtitle must be at least 2 characters");
    }
    if (subtitle.length > 150) {
      throw new ApiError(400, "Subtitle cannot exceed 150 characters");
    }
    updateData.subtitle = subtitle.trim();
  }

  if (imageUrl !== undefined) {
    if (!imageUrl) {
      throw new ApiError(400, "Image URL is required");
    }
    updateData.imageUrl = imageUrl;
  }

  if (linkUrl !== undefined) {
    if (linkUrl) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
      if (!linkUrl.startsWith('/') && !linkUrl.startsWith('tel:') && !urlPattern.test(linkUrl)) {
        throw new ApiError(400, "Please provide a valid link URL");
      }
    }
    updateData.linkUrl = linkUrl;
  }

  if (layoutType !== undefined) {
    const validLayouts = ["image-left", "image-right", "full-bg"];
    if (!validLayouts.includes(layoutType)) {
      throw new ApiError(400, "Invalid layout type");
    }
    updateData.layoutType = layoutType;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive === true;
  }

  if (priority !== undefined) {
    if (typeof priority !== 'number' || priority < 0) {
      throw new ApiError(400, "Priority must be a positive number");
    }
    updateData.priority = priority;
  }

  if (expiresAt !== undefined) {
    if (expiresAt && new Date(expiresAt) < new Date()) {
      throw new ApiError(400, "Expiry date must be in the future");
    }
    updateData.expiresAt = expiresAt || null;
  }

  promo = await Promo.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: promo,
    message: "Promo updated successfully",
  });
});

/**
 * @desc    Delete promo
 * @route   DELETE /api/promos/:id
 * @access  Private/Admin
 */
const deletePromo = asyncHandler(async (req, res) => {
  const promo = await Promo.findById(req.params.id);

  if (!promo) {
    throw new ApiError(404, "Promo not found");
  }

  await promo.deleteOne();

  res.status(200).json({
    success: true,
    message: "Promo deleted successfully",
  });
});

module.exports = {
  getActivePromos,
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
};