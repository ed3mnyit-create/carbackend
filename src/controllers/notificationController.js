const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  let filter = {};

  if (req.user.role === "admin") {
    filter = { forAdmin: true };
  } else {
    filter = { user: req.user._id };
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });
  const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
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
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // Ensure user owns this notification or is admin handling admin notifications
  if (req.user.role !== "admin" && notification.user?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification,
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/mark-all-read
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === "admin") {
    filter = { forAdmin: true, isRead: false };
  } else {
    filter = { user: req.user._id, isRead: false };
  }

  await Notification.updateMany(filter, { isRead: true });

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

/**
 * @desc    Create notification (Admin can broadcast to users)
 * @route   POST /api/notifications
 * @access  Private/Admin
 */
const createNotification = asyncHandler(async (req, res) => {
  const { userId, userIds, title, message, type } = req.body;

  if (!title || !message) {
    throw new ApiError(400, "Title and message are required");
  }

  // Validate type enum
  const validTypes = ["booking_new", "booking_approved", "booking_rejected", "system", "broadcast"];
  if (type && !validTypes.includes(type)) {
    throw new ApiError(400, "Invalid notification type");
  }

  const notifications = [];

  // Single user
  if (userId) {
    const notification = await Notification.create({
      user: userId,
      forAdmin: false,
      title,
      message,
      type: type || "broadcast",
    });
    notifications.push(notification);
  }
  // Multiple users
  else if (userIds && Array.isArray(userIds)) {
    const bulkNotifications = userIds.map((uid) => ({
      user: uid,
      forAdmin: false,
      title,
      message,
      type: type || "broadcast",
    }));
    await Notification.insertMany(bulkNotifications);
    notifications.push(...bulkNotifications);
  }
  // Broadcast to all users
  else {
    // Get all active user IDs
    const User = require("../models/User");
    const users = await User.find({ role: "user", isActive: true }).select("_id").lean();
    
    const bulkNotifications = users.map((u) => ({
      user: u._id,
      forAdmin: false,
      title,
      message,
      type: type || "broadcast",
    }));
    
    if (bulkNotifications.length > 0) {
      await Notification.insertMany(bulkNotifications);
    }
    notifications.push(...bulkNotifications);
  }

  res.status(201).json({
    success: true,
    message: `Notification sent to ${notifications.length} user(s)`,
    data: { count: notifications.length },
  });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // ONLY admins can delete notifications
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to delete notifications");
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: "Notification deleted",
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
};
