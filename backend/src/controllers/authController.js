const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const { getOrganisationPlan } = require("../services/planService");
const {
  createNotificationsForUsers,
  ensureNotificationPreferences,
  getSuperadminIds
} = require("../services/notificationService");
const {
  signAccessToken,
  signRefreshToken,
  accessCookieName,
  refreshCookieName,
  accessCookieOptions,
  refreshCookieOptions
} = require("../services/tokenService");

const SUSPENDED_MESSAGE = "Your organisation has been suspended. Contact support@zebrasupport.io";

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(accessCookieName, accessToken, accessCookieOptions);
  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie(accessCookieName, { path: "/" });
  res.clearCookie(refreshCookieName, { path: "/" });
};

const toResponseUser = (user, options = {}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  orgId: options.orgId ?? user.org_id ?? null,
  company: options.company ?? user.org_name ?? null,
  plan: options.plan ?? user.plan ?? null,
  orgStatus: options.orgStatus ?? user.org_status ?? null
});

const resolveInviteOrganisation = async (client, inviteToken) => {
  const match = /^org:(\d+)$/.exec(inviteToken || "");
  if (!match) {
    throw new ApiError(400, "Invalid invite token");
  }

  const orgId = Number(match[1]);
  const { rows } = await client.query(
    "SELECT id, name, plan, status FROM organisations WHERE id = $1",
    [orgId]
  );

  const organisation = rows[0];
  if (!organisation) {
    throw new ApiError(404, "Invite organisation not found");
  }
  if (organisation.status === "suspended") {
    throw new ApiError(403, SUSPENDED_MESSAGE);
  }

  return organisation;
};

const register = async (req, res) => {
  const { name, company, email, password, inviteToken } = req.body;

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
  if (existing.rows.length) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const client = await pool.connect();
  let user;

  try {
    await client.query("BEGIN");
    let organisation;

    if (inviteToken) {
      organisation = await resolveInviteOrganisation(client, inviteToken);
      const planData = await getOrganisationPlan(organisation.id);
      const { rows: userCountRows } = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE org_id = $1 AND active = true`,
        [organisation.id]
      );
      const currentUsers = userCountRows[0].count;
      if (planData?.maxUsers !== null && currentUsers >= planData.maxUsers) {
        throw new ApiError(403, "User limit reached for your plan.", {
          limit: planData.maxUsers,
          current: currentUsers,
          upgrade: true,
          plan: planData.plan
        });
      }
    } else {
      const orgResult = await client.query(
        `INSERT INTO organisations (name, plan, status)
         VALUES ($1, 'free', 'active')
         RETURNING id, name, plan, status`,
        [company]
      );
      organisation = orgResult.rows[0];
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await client.query(
      `INSERT INTO users (name, email, password_hash, org_id, role, active)
       VALUES ($1, $2, $3, $4, 'user', true)
       RETURNING id, name, email, org_id, role, active`,
      [name, email.toLowerCase(), passwordHash, organisation.id]
    );

    user = {
      ...created.rows[0],
      org_name: organisation.name,
      plan: organisation.plan,
      org_status: organisation.status
    };

    if (!inviteToken) {
      const promoted = await client.query(
        `UPDATE users
         SET role = 'org_owner'
         WHERE id = $1
         RETURNING id, name, email, org_id, role, active`,
        [user.id]
      );

      user = {
        ...promoted.rows[0],
        org_name: organisation.name,
        plan: organisation.plan,
        org_status: organisation.status
      };
    }

    await ensureNotificationPreferences(user.id, client);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

  setAuthCookies(res, accessToken, refreshToken);
  if (!inviteToken) {
    const superadminIds = await getSuperadminIds();
    await createNotificationsForUsers(superadminIds, {
      orgId: null,
      type: "new_org_registered",
      title: "New organisation registered",
      body: `${user.org_name} signed up. Owner: ${user.email}`,
      link: "/platform/organisations"
    });
  }

  return res.status(201).json({ user: toResponseUser(user) });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.active, u.org_id,
            o.name AS org_name, o.plan, o.status AS org_status
     FROM users u
     LEFT JOIN organisations o ON o.id = u.org_id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  const user = rows[0];
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.active) {
    throw new ApiError(403, "User account is deactivated");
  }

  if (user.role !== "superadmin" && user.org_status === "suspended") {
    throw new ApiError(403, SUSPENDED_MESSAGE);
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

  setAuthCookies(res, accessToken, refreshToken);

  return res.json({ user: toResponseUser(user) });
};

const logout = async (req, res) => {
  const userId = req.user?.id;
  if (userId) {
    await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [userId]);
  }

  clearAuthCookies(res);

  return res.status(204).send();
};

const me = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.active, u.org_id,
            o.name AS org_name, o.plan, o.status AS org_status
     FROM users u
     LEFT JOIN organisations o ON o.id = u.org_id
     WHERE u.id = $1`,
    [req.user.id]
  );

  const user = rows[0];
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.active) {
    throw new ApiError(403, "User account is deactivated");
  }

  if (user.role !== "superadmin" && user.org_status === "suspended") {
    throw new ApiError(403, SUSPENDED_MESSAGE);
  }

  return res.json({
    user: toResponseUser(user)
  });
};

module.exports = {
  register,
  login,
  logout,
  me
};

