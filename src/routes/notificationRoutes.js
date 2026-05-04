const express = require("express");
const router = express.Router();
const { isAuth, isAdmin } = require("../middleware/auth");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
} = require("../controllers/notificationController");

router.use(isAuth);

router.route("/").get(getNotifications).post(createNotification);
router.route("/mark-all-read").patch(markAllAsRead);
router.route("/:id/read").patch(markAsRead);
router.route("/:id").delete(deleteNotification);

module.exports = router;
