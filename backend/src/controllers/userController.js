const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const { accessCookieName, refreshCookieName } = require("../services/tokenService");
const { getOrganisationPlan } = require("../services/planService");
const { createNotification, createNotificationsForUsers, getOrgUsersByRoles } = require("../services/notificationService");

const toUserResponse = (row) => ({
  id: row.id,
  orgId: row.orgId,
  name: row.name,
  email: row.email,
  role: row.role,
  active: row.active,
  createdAt: row.createdAt
});

const getUserById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const getScopedUserById = async (userId, orgId) => {
  const { rows } = await pool.query(
    `SELECT id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"
     FROM users
     WHERE id = $1 AND org_id = $2`,
    [userId, orgId]
  );
  return rows[0] || null;
};

const canOrgUserManageTarget = (actorRole, targetRole) => {
  if (targetRole === "superadmin" || targetRole === "org_owner") {
    return false;
  }

  if (actorRole === "org_owner") {
    return targetRole === "org_admin" || targetRole === "user";
  }

  if (actorRole === "org_admin") {
    return targetRole === "user";
  }

  return false;
};

const ensureRoleUpdatePermission = (actor, target, nextRole) => {
  if (actor.role === "superadmin") {
    return;
  }

  if (actor.role === "user") {
    throw new ApiError(403, "Users cannot change user roles.");
  }

  if (actor.orgId !== target.orgId) {
    throw new ApiError(404, "User not found");
  }

  if (target.role === "superadmin" || target.role === "org_owner") {
    throw new ApiError(403, "You do not have permission to change this role.");
  }

  if (actor.role === "org_owner") {
    if (!["user", "org_admin"].includes(target.role) || !["user", "org_admin"].includes(nextRole)) {
      throw new ApiError(403, "You do not have permission to change this role.");
    }
    return;
  }

  if (actor.role === "org_admin") {
    const canPromoteUser = target.role === "user" && nextRole === "org_admin";
    if (!canPromoteUser) {
      throw new ApiError(403, "You do not have permission to change this role.");
    }
    return;
  }

  throw new ApiError(403, "You do not have permission to change this role.");
};

const listUsers = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"
     FROM users
     WHERE org_id = $1 AND role <> 'superadmin'
     ORDER BY created_at ASC`,
    [req.orgId]
  );

  return res.json({ users: rows });
};

const inviteUser = async (req, res) => {
  const requestedRole = req.body.role || "user";
  const { email } = req.body;

  if (req.user.role === "org_admin" && requestedRole !== "user") {
    throw new ApiError(403, "Org admins can only invite users.");
  }

  if (req.user.role === "org_owner" && !["user", "org_admin"].includes(requestedRole)) {
    throw new ApiError(403, "You do not have permission to invite this role.");
  }

  const planData = await getOrganisationPlan(req.orgId);
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM users
     WHERE org_id = $1 AND active = true`,
    [req.orgId]
  );
  const currentUsers = rows[0].count;

  if (planData?.maxUsers !== null && currentUsers >= planData.maxUsers) {
    throw new ApiError(403, "User limit reached for your plan.", {
      limit: planData.maxUsers,
      current: currentUsers,
      upgrade: true,
      plan: planData.plan
    });
  }

  const inviteToken = `org:${req.orgId}`;

  console.log(
    `Invite stub: org=${req.orgId} email=${email} role=${requestedRole} invitedBy=${req.user.email} token=${inviteToken}`
  );

  const ownerIds = await getOrgUsersByRoles(req.orgId, ["org_owner"]);
  await createNotificationsForUsers(ownerIds, {
    orgId: req.orgId,
    type: "user_invited",
    title: "Invite sent",
    body: `An invite was sent to ${email}`,
    link: "/admin/settings"
  });

  return res.status(202).json({
    message: "Invite queued (stub)",
    invite: {
      email,
      role: requestedRole,
      inviteToken
    }
  });
};

const updateUserRole = async (req, res) => {
  const targetId = Number(req.params.id);
  const { role, orgId: providedOrgId } = req.body;

  if (targetId === req.user.id && req.user.role !== "superadmin") {
    throw new ApiError(403, "You cannot change your own role.");
  }

  const target = req.user.role === "superadmin"
    ? await getUserById(targetId)
    : await getScopedUserById(targetId, req.orgId);

  if (!target) {
    throw new ApiError(404, "User not found");
  }

  ensureRoleUpdatePermission(req.user, target, role);

  let updatedQuery = "";
  let values = [];

  if (req.user.role === "superadmin" && role === "superadmin") {
    updatedQuery = `UPDATE users
      SET role = $1, org_id = NULL
      WHERE id = $2
      RETURNING id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"`;
    values = [role, targetId];
  } else if (req.user.role === "superadmin" && providedOrgId) {
    updatedQuery = `UPDATE users
      SET role = $1, org_id = $2
      WHERE id = $3
      RETURNING id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"`;
    values = [role, providedOrgId, targetId];
  } else {
    updatedQuery = `UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"`;
    values = [role, targetId];
  }

  const { rows } = await pool.query(updatedQuery, values);
  const updated = rows[0];

  await createNotification({
    userId: targetId,
    orgId: updated.orgId,
    type: "user_role_changed",
    title: "Your role has been updated",
    body: `Your role has been changed to ${role} by ${req.user.email}.`,
    link: updated.role === "user" ? "/dashboard/profile" : req.user.role === "superadmin" ? "/platform/organisations" : "/admin/settings"
  });

  return res.json({ user: toUserResponse(updated) });
};

const deactivateUser = async (req, res) => {
  const targetId = Number(req.params.id);

  if (targetId === req.user.id) {
    throw new ApiError(403, "Use the self-deactivation endpoint instead.");
  }

  const target = req.user.role === "superadmin"
    ? await getUserById(targetId)
    : await getScopedUserById(targetId, req.orgId);

  if (!target) {
    throw new ApiError(404, "User not found");
  }

  if (req.user.role === "superadmin") {
    if (target.role === "superadmin") {
      throw new ApiError(403, "You do not have permission to deactivate this user.");
    }
  } else if (!canOrgUserManageTarget(req.user.role, target.role)) {
    throw new ApiError(403, "You do not have permission to deactivate this user.");
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET active = false, refresh_token = NULL
     WHERE id = $1
     RETURNING id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"`,
    [targetId]
  );

  const ownerIds = target.orgId ? await getOrgUsersByRoles(target.orgId, ["org_owner"]) : [];
  await createNotificationsForUsers(ownerIds, {
    orgId: target.orgId,
    type: "user_deactivated",
    title: "User deactivated",
    body: `${rows[0].name} (${rows[0].email}) has been deactivated.`,
    link: "/admin/settings"
  });

  return res.json({ user: toUserResponse(rows[0]) });
};

const activateUser = async (req, res) => {
  const targetId = Number(req.params.id);

  if (targetId === req.user.id && req.user.role !== "superadmin") {
    throw new ApiError(403, "Use your own account settings to manage your account.");
  }

  const target = req.user.role === "superadmin"
    ? await getUserById(targetId)
    : await getScopedUserById(targetId, req.orgId);

  if (!target) {
    throw new ApiError(404, "User not found");
  }

  if (req.user.role === "superadmin") {
    if (target.role === "superadmin" && target.id !== req.user.id) {
      throw new ApiError(403, "You do not have permission to activate this user.");
    }
  } else if (!canOrgUserManageTarget(req.user.role, target.role)) {
    throw new ApiError(403, "You do not have permission to activate this user.");
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET active = true
     WHERE id = $1
     RETURNING id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"`,
    [targetId]
  );

  return res.json({ user: toUserResponse(rows[0]) });
};

const updateCurrentUser = async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  const { rows: existingRows } = await pool.query(
    `SELECT id, org_id AS "orgId", name, email, role, active, password_hash, created_at AS "createdAt"
     FROM users
     WHERE id = $1`,
    [req.user.id]
  );

  const existing = existingRows[0];
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  let passwordHash = existing.password_hash;
  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword, existing.password_hash);
    if (!valid) {
      throw new ApiError(400, "Current password is incorrect");
    }
    passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET name = $1, password_hash = $2
     WHERE id = $3
     RETURNING id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"`,
    [name || existing.name, passwordHash, req.user.id]
  );

  return res.json({ user: toUserResponse(rows[0]) });
};

const deactivateCurrentUser = async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET active = false, refresh_token = NULL
     WHERE id = $1
     RETURNING id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"`,
    [req.user.id]
  );

  if (!rows[0]) {
    throw new ApiError(404, "User not found");
  }

  res.clearCookie(accessCookieName, { path: "/" });
  res.clearCookie(refreshCookieName, { path: "/" });

  return res.json({
    message: "Your account has been deactivated.",
    user: toUserResponse(rows[0])
  });
};

module.exports = {
  listUsers,
  inviteUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  updateCurrentUser,
  deactivateCurrentUser
};
