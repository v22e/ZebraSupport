const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const {
  listNotificationsSchema,
  notificationIdParamSchema,
  notificationPreferenceSchema
} = require("../validators/notificationSchemas");
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
  updateNotificationPreference
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", validate(listNotificationsSchema), asyncHandler(listNotifications));
router.get("/unread-count", asyncHandler(getUnreadCount));
router.patch("/read-all", asyncHandler(markAllNotificationsRead));
router.patch("/preferences", validate(notificationPreferenceSchema), asyncHandler(updateNotificationPreference));
router.patch("/:id/read", validate(notificationIdParamSchema), asyncHandler(markNotificationRead));
router.delete("/:id", validate(notificationIdParamSchema), asyncHandler(deleteNotification));

module.exports = router;
