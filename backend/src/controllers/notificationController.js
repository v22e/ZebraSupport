const pool = require("../config/db");
const ApiError = require("../utils/apiError");

const parseRelativeTime = (dateValue) => {
  const now = Date.now();
  const diffMs = now - new Date(dateValue).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
};

const listNotifications = async (req, res) => {
  const limit = Number(req.query.limit || 20);
  const offset = Number(req.query.offset || 0);
  const unreadFilter = req.query.unread;
  const typeFilter = req.query.type;

  const values = [req.user.id];
  const conditions = ["user_id = $1"];

  if (unreadFilter !== undefined) {
    const unread = String(unreadFilter).toLowerCase() === "true";
    values.push(!unread);
    conditions.push(`is_read = $${values.length}`);
  }

  if (typeFilter) {
    values.push(typeFilter);
    conditions.push(`type = $${values.length}`);
  }

  values.push(limit);
  values.push(offset);

  const [notificationsResult, unreadCountResult] = await Promise.all([
    pool.query(
      `SELECT id, user_id AS "userId", org_id AS "orgId", type, title, body, link,
              is_read AS "isRead", created_at AS "createdAt"
       FROM notifications
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    )
  ]);

  const notifications = notificationsResult.rows.map((item) => ({
    ...item,
    relativeTime: parseRelativeTime(item.createdAt)
  }));

  return res.json({
    notifications,
    unreadCount: unreadCountResult.rows[0].count
  });
};

const markNotificationRead = async (req, res) => {
  const notificationId = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING id, is_read AS "isRead"`,
    [notificationId, req.user.id]
  );

  if (!rows[0]) {
    throw new ApiError(404, "Notification not found");
  }

  return res.json({ notification: rows[0] });
};

const markAllNotificationsRead = async (req, res) => {
  await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1 AND is_read = false`,
    [req.user.id]
  );

  return res.json({ message: "All notifications marked as read." });
};

const deleteNotification = async (req, res) => {
  const notificationId = Number(req.params.id);
  const { rowCount } = await pool.query(
    "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
    [notificationId, req.user.id]
  );

  if (!rowCount) {
    throw new ApiError(404, "Notification not found");
  }

  return res.status(204).send();
};

const getUnreadCount = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [req.user.id]
  );

  return res.json({ count: rows[0].count });
};

const updateNotificationPreference = async (req, res) => {
  const { type, enabled } = req.body;

  await pool.query(
    `INSERT INTO notification_preferences (user_id, type, enabled)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, type)
     DO UPDATE SET enabled = EXCLUDED.enabled`,
    [req.user.id, type, enabled]
  );

  return res.json({ message: "Notification preferences saved." });
};

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
  updateNotificationPreference
};
