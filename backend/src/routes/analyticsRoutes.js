const express = require("express");
const authMiddleware = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const {
  getAnalyticsSummary,
  getTicketVolume,
  getHealthScore
} = require("../controllers/analyticsController");

const router = express.Router();

router.use(authMiddleware);
router.get("/summary", asyncHandler(getAnalyticsSummary));
router.get("/volume", asyncHandler(getTicketVolume));
router.get("/health-score", asyncHandler(getHealthScore));

module.exports = router;