const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const { registerSchema, loginSchema } = require("../validators/authSchemas");
const { register, login, logout, me } = require("../controllers/authController");

const router = express.Router();

router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/logout", authMiddleware, asyncHandler(logout));
router.get("/me", authMiddleware, asyncHandler(me));

module.exports = router;