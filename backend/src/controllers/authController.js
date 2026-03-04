const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const {
  signAccessToken,
  signRefreshToken,
  accessCookieName,
  refreshCookieName,
  accessCookieOptions,
  refreshCookieOptions
} = require("../services/tokenService");

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(accessCookieName, accessToken, accessCookieOptions);
  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie(accessCookieName, { path: "/" });
  res.clearCookie(refreshCookieName, { path: "/" });
};

const register = async (req, res) => {
  const { name, company, email, password } = req.body;

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
  if (existing.rows.length) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await pool.query(
    `INSERT INTO users (name, company, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, company, email`,
    [name, company, email.toLowerCase(), passwordHash]
  );

  const user = created.rows[0];
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

  setAuthCookies(res, accessToken, refreshToken);

  return res.status(201).json({ user });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    "SELECT id, name, company, email, password_hash FROM users WHERE email = $1",
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

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

  setAuthCookies(res, accessToken, refreshToken);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      company: user.company,
      email: user.email
    }
  });
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
    "SELECT id, name, company, email, created_at FROM users WHERE id = $1",
    [req.user.id]
  );

  const user = rows[0];
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.json({ user });
};

module.exports = {
  register,
  login,
  logout,
  me
};