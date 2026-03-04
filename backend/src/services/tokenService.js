const jwt = require("jsonwebtoken");
const env = require("../config/env");

const parseDurationToMs = (duration) => {
  const match = /^([0-9]+)([smhd])$/.exec(duration);
  if (!match) return 15 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
};

const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  maxAge: maxAgeMs,
  path: "/"
});

const signAccessToken = (payload) => jwt.sign(payload, env.accessSecret, { expiresIn: env.accessExpiresIn });
const signRefreshToken = (payload) => jwt.sign(payload, env.refreshSecret, { expiresIn: env.refreshExpiresIn });

const verifyAccessToken = (token) => jwt.verify(token, env.accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.refreshSecret);

const accessCookieName = "zebra_access_token";
const refreshCookieName = "zebra_refresh_token";

const accessCookieOptions = getCookieOptions(parseDurationToMs(env.accessExpiresIn));
const refreshCookieOptions = getCookieOptions(parseDurationToMs(env.refreshExpiresIn));

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  accessCookieName,
  refreshCookieName,
  accessCookieOptions,
  refreshCookieOptions
};