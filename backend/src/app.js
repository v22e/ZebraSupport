const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./config/env");
const pool = require("./config/db");
const { connection } = require("./config/redis");
const { apiLimiter, loginLimiter } = require("./middleware/rateLimiters");
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");
const platformRoutes = require("./routes/platformRoutes");
const demoRequestRoutes = require("./routes/demoRequestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const billingRoutes = require("./routes/billingRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", async (_req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = Number(process.uptime().toFixed(2));

  let database = "ok";
  let redis = "ok";

  try {
    await pool.query("SELECT 1");
  } catch (_error) {
    database = "error";
  }

  try {
    await connection.ping();
  } catch (_error) {
    redis = "error";
  }

  const status = database === "ok" && redis === "ok" ? "ok" : "degraded";
  const statusCode = status === "ok" ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp,
    uptime,
    services: {
      database,
      redis
    }
  });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/demo-requests", demoRequestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/billing", billingRoutes);

app.use(errorHandler);

module.exports = app;
