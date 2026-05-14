const { GoogleGenerativeAI } = require("@google/generative-ai");

const TOPICS = [
  "Password Reset",
  "Billing Query",
  "Account Access",
  "API Integration",
  "SLA & Priority",
  "General Enquiry"
];

const faqMap = TOPICS.map((topic) => ({ topic }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const classifyTicket = async ({ subject = "", description = "" }) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction:
        "You are a support ticket classifier. Return ONLY valid JSON with no markdown, no code blocks, and no explanation whatsoever."
    });

    const result = await model.generateContent(
      `Classify this support ticket and return JSON in exactly this shape: { "topic": "...", "priority": "low|medium|high" }

Valid topics: Password Reset, Billing Query, Account Access, API Integration, SLA & Priority, General Enquiry

Subject: ${subject}
Description: ${description}`
    );

    const text = result.response.text().trim();
    const parsed = JSON.parse(text);

    const validTopic = TOPICS.includes(parsed.topic) ? parsed.topic : "General Enquiry";
    const validPriority = ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "low";

    console.log("[AI] classifyTicket →", { topic: validTopic, priority: validPriority });
    return { topic: validTopic, priority: validPriority };
  } catch (err) {
    console.error("[AI] classifyTicket failed, using fallback:", err.message);
    return { topic: "General Enquiry", priority: "low" };
  }
};

const generateAutoReply = async (subject = "", description = "", topic = "") => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction:
        "You are a support agent for ZebraSupport, a B2B AI-powered ticket platform. Write concise, professional replies that sound like a real human support agent. Do not mention being an AI. Do not use generic filler phrases. Address the specific issue directly."
    });

    const result = await model.generateContent(
      `Write a 2–4 sentence reply to this support ticket. Address the specific issue described.

Topic: ${topic}
Subject: ${subject}
Description: ${description}`
    );

    const reply = result.response.text().trim();
    console.log("[AI] generateAutoReply →", reply);
    return reply || "Thank you for reaching out. A member of our support team will review your request and respond shortly.";
  } catch (err) {
    console.error("[AI] generateAutoReply failed, using fallback:", err.message);
    return "Thank you for reaching out. A member of our support team will review your request and respond shortly.";
  }
};

const getReplyByTopic = async (topic) => {
  return generateAutoReply("", "", topic);
};

module.exports = { classifyTicket, generateAutoReply, getReplyByTopic, faqMap, TOPICS };
