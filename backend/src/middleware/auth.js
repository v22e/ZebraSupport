const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const {
  accessCookieName,
  refreshCookieName,
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  accessCookieOptions
} = require("../services/tokenService");

const SUSPENDED_MESSAGE = "Your organisation has been suspended. Contact support@zebrasupport.io";

const mapUserContext = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  active: user.active,
  orgId: user.org_id || null,
  orgStatus: user.org_status || null
});

const getUserById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.role, u.active, u.org_id, u.refresh_token,
            o.status AS org_status
     FROM users u
     LEFT JOIN organisations o ON o.id = u.org_id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0];
};

const assertUserAccess = (user) => {
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }
  if (!user.active) {
    throw new ApiError(401, "User account is deactivated");
  }
  if (user.role !== "superadmin" && user.org_status === "suspended") {
    throw new ApiError(403, SUSPENDED_MESSAGE);
  }
};

const authMiddleware = async (req, res, next) => {
  const fail = (message = "Authentication required") => next(new ApiError(401, message));

  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const accessToken = req.cookies[accessCookieName] || bearerToken;

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      const user = await getUserById(payload.sub);
      assertUserAccess(user);
      req.user = mapUserContext(user);
      return next();
    }
  } catch (_error) {
    // Fallback to refresh token.
  }

  try {
    const refreshToken = req.cookies[refreshCookieName];
    if (!refreshToken) {
      return fail();
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await getUserById(payload.sub);

    if (!user || user.refresh_token !== refreshToken) {
      return fail("Invalid refresh token");
    }

    assertUserAccess(user);

    const newAccessToken = signAccessToken({ sub: user.id, email: user.email });
    res.cookie(accessCookieName, newAccessToken, accessCookieOptions);
    req.user = mapUserContext(user);

    return next();
  } catch (error) {
    return next(error.statusCode ? error : new ApiError(401, "Authentication required"));
  }
};

module.exports = authMiddleware;
