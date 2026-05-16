const { GoogleGenerativeAI } = require("@google/generative-ai");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "messages array is required");
  }

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction:
      "You are a helpful support assistant for ZebraSupport, a B2B AI-powered customer support ticket platform. Help users with questions about using the platform: managing tickets, understanding analytics, inviting team members, adjusting notification settings, CSV exports, subscription plans, and general IT support questions. Be concise, friendly, and practical. Do not mention being an AI unless directly asked."
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }]
  }));

  const lastMessage = messages[messages.length - 1];
  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(lastMessage.content);

  res.json({ reply: result.response.text() });
});

module.exports = { chat };
