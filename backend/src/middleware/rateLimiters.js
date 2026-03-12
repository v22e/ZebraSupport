const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { connection } = require("../config/redis");

const createStore = (prefix) =>
  new RedisStore({
    prefix,
    sendCommand: (...args) => connection.call(...args)
  });

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:api:"),
  handler: (_req, res) => {
    res.status(429).json({ error: "Rate limit exceeded. Please slow down." });
  }
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:login:"),
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many login attempts. Please try again in 1 minute." });
  }
});

module.exports = {
  apiLimiter,
  loginLimiter
};
