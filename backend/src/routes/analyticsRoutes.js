const express = require("express");
const authMiddleware = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const orgScope = require("../middleware/orgScope");
const planLimits = require("../middleware/planLimits");
const asyncHandler = require("../utils/asyncHandler");
const {
  getAnalyticsSummary,
  getTicketVolume,
  getHealthScore
} = require("../controllers/analyticsController");

const router = express.Router();

router.use(authMiddleware);
router.use(orgScope);
router.use(planLimits);
router.use(requireRoles("org_owner", "org_admin"));
router.get("/summary", asyncHandler(getAnalyticsSummary));
router.get("/volume", asyncHandler(getTicketVolume));
router.get("/health-score", asyncHandler(getHealthScore));

module.exports = router;
