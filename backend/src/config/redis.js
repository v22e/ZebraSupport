const IORedis = require("ioredis");
const env = require("./env");

const connection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

connection.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

module.exports = { connection };