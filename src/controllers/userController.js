const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive } = req.query;

  const pageNum = parseInt(page) || 1;
  // Admins can fetch up to 5000 records
  const maxLimit = req.user.role === "admin" ? 5000 : 50;
  const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), maxLimit);
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  } else if (req.user.role !== "admin") {
    // Non-admins (if they could access this) would only see active users
    filter.isActive = true;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("_id name email role isActive phoneNumber createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

  res.status(200).json({
    success: true,
    data: {
      users,
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
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber } = req.body;

  // Find user
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if email is being changed and if it's already taken
  if (email && email.toLowerCase() !== user.email) {
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      throw new ApiError(400, "Email already in use");
    }
  }

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

  // Save updated user
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    message: "تم تحديث البيانات الشخصية بنجاح",
  });
});

/**
 * @desc    Update any user (Admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phoneNumber, isActive } = req.body;

  // Prevent admin from modifying their own role or status
  if (req.params.id === req.user._id.toString()) {
    if (role && role !== req.user.role) {
      throw new ApiError(400, "لا يمكنك تغيير صلاحيات حسابك بنفسك");
    }
    if (isActive === false) {
      throw new ApiError(400, "لا يمكنك تعطيل حسابك بنفسك");
    }
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if email is being changed and if it's already taken
  if (email && email.toLowerCase() !== user.email) {
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      throw new ApiError(400, "Email already in use");
    }
  }

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (role) user.role = role;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: "تم تحديث بيانات المستخدم بنجاح",
  });
});

/**
 * @desc    Soft delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  // Prevent admin from deleting their own account
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "لا يمكنك تعطيل حسابك بنفسك");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Perform soft delete
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "تم تعطيل حساب المستخدم بنجاح (حذف ناعم)",
  });
});

module.exports = {
  getUsers,
  getProfile,
  updateProfile,
  updateUser,
  deleteUser,
};
