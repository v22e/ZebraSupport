const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/auth");
const orgScope = require("../middleware/orgScope");
const planLimits = require("../middleware/planLimits");
const { getCurrentBilling } = require("../controllers/billingController");

const router = express.Router();

router.use(authMiddleware);
router.use(orgScope);
router.use(planLimits);

router.get("/current", asyncHandler(getCurrentBilling));

module.exports = router;
