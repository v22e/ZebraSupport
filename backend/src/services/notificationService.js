const pool = require("../config/db");

const NOTIFICATION_TYPES = [
  "ticket_created",
  "ticket_replied",
  "ticket_escalated",
  "ticket_closed",
  "ticket_assigned",
  "ticket_auto_replied",
  "user_invited",
  "user_role_changed",
  "user_deactivated",
  "plan_limit_warning",
  "plan_limit_reached",
  "demo_request_received",
  "org_suspended",
  "new_org_registered"
];

const ensureNotificationPreferences = async (userId, client = pool) => {
  for (const type of NOTIFICATION_TYPES) {
    // eslint-disable-next-line no-await-in-loop
    await client.query(
      `INSERT INTO notification_preferences (user_id, type, enabled)
       VALUES ($1, $2, true)
       ON CONFLICT (user_id, type) DO NOTHING`,
      [userId, type]
    );
  }
};

const isNotificationEnabled = async (userId, type) => {
  const { rows } = await pool.query(
    "SELECT enabled FROM notification_preferences WHERE user_id = $1 AND type = $2",
    [userId, type]
  );
  if (!rows[0]) {
    return true;
  }
  return Boolean(rows[0].enabled);
};

const createNotification = async ({ userId, orgId = null, type, title, body = null, link = null }) => {
  if (!NOTIFICATION_TYPES.includes(type)) {
    return null;
  }

  const enabled = await isNotificationEnabled(userId, type);
  if (!enabled) {
    return null;
  }

  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, org_id, type, title, body, link, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, false)
     RETURNING id, user_id AS "userId", org_id AS "orgId", type, title, body, link, is_read AS "isRead", created_at AS "createdAt"`,
    [userId, orgId, type, title, body, link]
  );

  return rows[0];
};

const createNotificationsForUsers = async (userIds, payload) => {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
  for (const userId of uniqueIds) {
    // eslint-disable-next-line no-await-in-loop
    await createNotification({ ...payload, userId });
  }
};

const getOrgUsersByRoles = async (orgId, roles, options = {}) => {
  const values = [orgId, roles];
  const conditions = ["org_id = $1", "role = ANY($2)", "active = true"];

  if (options.excludeUserId) {
    values.push(options.excludeUserId);
    conditions.push(`id <> $${values.length}`);
  }

  const { rows } = await pool.query(
    `SELECT id
     FROM users
     WHERE ${conditions.join(" AND ")}`,
    values
  );

  return rows.map((row) => row.id);
};

const getSuperadminIds = async () => {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE role = 'superadmin' AND active = true"
  );
  return rows.map((row) => row.id);
};

module.exports = {
  NOTIFICATION_TYPES,
  ensureNotificationPreferences,
  createNotification,
  createNotificationsForUsers,
  getOrgUsersByRoles,
  getSuperadminIds
};
