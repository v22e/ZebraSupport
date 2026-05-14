const app = require("./app");
const env = require("./config/env");
const pool = require("./config/db");
const { connection } = require("./config/redis");
const { runRuntimeMigrations } = require("./config/migrate");
const { startQueueWorker } = require("./services/queueService");

let worker;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDatabase = async () => {
  let attempt = 1;
  while (true) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (error) {
      console.log(`Database not ready (attempt ${attempt}). Retrying...`);
      await delay(2000);
      attempt += 1;
    }
  }
};

const startServer = async () => {
  try {
    await waitForDatabase();
    await runRuntimeMigrations();
    worker = startQueueWorker();

    app.listen(env.port, () => {
      console.log(`ZebraSupport backend listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
};

const shutdown = async () => {
  try {
    if (worker) {
      await worker.close();
    }
    await pool.end();
    await connection.quit();
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
