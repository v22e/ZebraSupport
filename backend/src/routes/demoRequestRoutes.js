const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { demoRequestSchema } = require("../validators/demoRequestSchemas");
const { createDemoRequest } = require("../controllers/demoRequestController");

const router = express.Router();

router.post("/", validate(demoRequestSchema), asyncHandler(createDemoRequest));

module.exports = router;
