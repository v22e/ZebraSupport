const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
};

const required = [
  ["databaseUrl", "DATABASE_URL"],
  ["redisUrl", "REDIS_URL"],
  ["accessSecret", "JWT_ACCESS_SECRET"],
  ["refreshSecret", "JWT_REFRESH_SECRET"]
];

for (const [key, envVarName] of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${envVarName}`);
  }
}

module.exports = env;
