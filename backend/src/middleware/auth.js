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

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const accessToken = req.cookies[accessCookieName] || bearerToken;

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      req.user = { id: payload.sub, email: payload.email };
      return next();
    }
  } catch (_error) {
    // Access token failed, fallback to refresh token.
  }

  try {
    const refreshToken = req.cookies[refreshCookieName];
    if (!refreshToken) {
      throw new ApiError(401, "Authentication required");
    }

    const payload = verifyRefreshToken(refreshToken);
    const { rows } = await pool.query("SELECT id, email, refresh_token FROM users WHERE id = $1", [payload.sub]);
    const user = rows[0];

    if (!user || user.refresh_token !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = signAccessToken({ sub: user.id, email: user.email });
    res.cookie(accessCookieName, newAccessToken, accessCookieOptions);
    req.user = { id: user.id, email: user.email };

    return next();
  } catch (error) {
    return next(error.statusCode ? error : new ApiError(401, "Authentication required"));
  }
};

module.exports = authMiddleware;