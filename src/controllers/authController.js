const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email: email.toLowerCase() });

  if (userExists) {
    throw new ApiError(400, "User with this email already exists");
  }

  // Create user (password will be hashed in pre-save middleware)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "user", // Always create as user, admin is assigned manually
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
    message: "تم إنشاء الحساب بنجاح",
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email, include password field
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if account is deactivated
  if (!user.isActive) {
    throw new ApiError(403, "هذا الحساب معطل. يرجى التواصل مع الإدارة.");
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
      token,
    },
    message: "تم تسجيل الدخول بنجاح",
  });
});

/**
 * @desc    Forgot password - send reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: "إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة تحتوي على رابط استعادة كلمة المرور",
    });
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();

  // Save user with reset token
  await user.save({ validateBeforeSave: false });

  // Create reset URL - CLIENT_URL must be set in environment variables
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    throw new ApiError(500, "CLIENT_URL environment variable is not configured");
  }
  const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}`;

  // Email message
  const message = `You are receiving this email because you (or someone else) has requested to reset your password.\n\nPlease use the following token to reset your password:\n\n${resetToken}\n\nOr visit this URL:\n${resetUrl}\n\nThis token will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

  // Try to send email
  const emailSent = await sendEmail({
    email: user.email,
    subject: "Password Reset Request",
    message,
  });

  // Response object
  const responseData = {
    success: true,
    message: "إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة تحتوي على رابط استعادة كلمة المرور",
  };

  // Only include token in development for testing purposes
  if (process.env.NODE_ENV === "development") {
    responseData.data = {
      resetToken,
      note: "Reset token returned for development/testing purposes",
    };
  }

  if (!emailSent) {
    responseData.message += ". يرجى التواصل مع الإدارة لاستعادة كلمة المرور.";
  }

  res.status(200).json(responseData);
});

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Hash the token to compare with stored hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // Save user (password will be hashed in pre-save middleware)
  await user.save();

  // Generate new token for auto-login
  const authToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "تم تغيير كلمة المرور بنجاح",
    data: {
      token: authToken,
    },
  });
});

/**
 * @desc    Change password for logged in user
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "تم تحديث كلمة المرور بنجاح",
    data: {
      token,
    },
  });
});

/**
 * @desc    Logout user
 * @route   GET /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "تم تسجيل الخروج بنجاح",
  });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
};
