const express = require("express");
const authMiddleware = require("../middleware/auth");
const { chat, ticketCopilot } = require("../controllers/aiController");

const router = express.Router();

router.post("/chat", authMiddleware, chat);
router.post("/ticket-copilot", authMiddleware, ticketCopilot);

module.exports = router;
