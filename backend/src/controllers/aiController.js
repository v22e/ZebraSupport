const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ticketSelect = `SELECT id, subject, description, requester_name AS "requesterName", requester_email AS "requesterEmail",
       company, status, priority, topic, ai_reply AS "aiReply", manual_reply AS "manualReply",
       is_read AS "isRead", is_demo AS "isDemo", submitted_by AS "submittedBy", assigned_to AS "assignedTo",
       created_at AS "createdAt", updated_at AS "updatedAt"
FROM tickets`;

const normalizeRole = (role) => (role === "user" ? "user" : "model");

const asksForLatestTicket = (message = "") =>
  /\b(latest|most recent|newest|last)\b.*\bticket\b/i.test(message) ||
  /\bticket\b.*\b(latest|most recent|newest|last)\b/i.test(message);

const formatTicketContext = (label, ticket) => {
  if (!ticket) return "";

  return `${label}\nTicket #${ticket.id}\nSubject: ${ticket.subject}\nDescription: ${ticket.description}\nRequester: ${ticket.requesterName} <${ticket.requesterEmail}>\nCompany: ${ticket.company || "Unknown"}\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nTopic: ${ticket.topic || "Uncategorized"}\nAI auto-reply: ${ticket.aiReply || "None"}\nManual/admin reply: ${ticket.manualReply || "None"}\nCreated: ${ticket.createdAt}\nUpdated: ${ticket.updatedAt}`;
};

const getTicketByIdForUser = async ({ ticketId, user }) => {
  if (!user?.orgId || !ticketId) return null;

  const values = [Number(ticketId), user.orgId];
  const conditions = ["id = $1", "org_id = $2"];

  if (user.role === "user") {
    values.push(user.id);
    conditions.push(`submitted_by = $${values.length}`);
  }

  const { rows } = await pool.query(`${ticketSelect} WHERE ${conditions.join(" AND ")}`, values);
  return rows[0] || null;
};

const getLatestTicketForUser = async (user) => {
  if (!user?.orgId) return null;

  const values = [user.orgId];
  const conditions = ["org_id = $1"];

  if (user.role === "user") {
    values.push(user.id);
    conditions.push(`submitted_by = $${values.length}`);
  }

  const { rows } = await pool.query(
    `${ticketSelect} WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT 1`,
    values
  );
  return rows[0] || null;
};

const buildContextInstruction = async ({ context = {}, lastMessage, user }) => {
  const contextBlocks = [];

  if (context?.ticketId) {
    const ticket = await getTicketByIdForUser({ ticketId: context.ticketId, user });
    if (ticket) {
      contextBlocks.push(formatTicketContext("Current ticket context:", ticket));
    }
  }

  if (asksForLatestTicket(lastMessage?.content)) {
    const latestTicket = await getLatestTicketForUser(user);
    if (latestTicket && String(latestTicket.id) !== String(context?.ticketId)) {
      contextBlocks.push(formatTicketContext("Most recent ticket context:", latestTicket));
    }
  }

  if (!contextBlocks.length) return "";

  return `\n\nUse this live, org-scoped ZebraSupport data when relevant. Do not claim you looked it up elsewhere. If the user asks about \"this ticket\", prefer the current ticket context.\n\n${contextBlocks.join("\n\n")}`;
};

const chat = asyncHandler(async (req, res) => {
  const { messages, context } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "messages array is required");
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage?.content || typeof lastMessage.content !== "string") {
    throw new ApiError(400, "last message content is required");
  }

  const contextInstruction = await buildContextInstruction({
    context,
    lastMessage,
    user: req.user
  });

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction:
      "You are a helpful support assistant for ZebraSupport, a B2B AI-powered customer support ticket platform. Help users with questions about using the platform: managing tickets, understanding analytics, inviting team members, adjusting notification settings, CSV exports, subscription plans, and general IT support questions. When ticket context is provided, answer specific questions about that ticket, summarize it, draft practical replies, and suggest next steps. Be concise, friendly, and practical. Do not mention being an AI unless directly asked." +
      contextInstruction
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: normalizeRole(m.role),
    parts: [{ text: m.content }]
  }));

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(lastMessage.content);

  res.json({ reply: result.response.text() });
});

const classifyCopilotKind = (mode, message = "") => {
  if (mode === "customer_reply" || /\b(draft|write|reply|respond|ask customer|customer-facing)\b/i.test(message)) {
    return "customer_draft";
  }

  return "internal_guidance";
};

const ticketCopilot = asyncHandler(async (req, res) => {
  const { ticketId, messages, mode = "internal" } = req.body;

  if (!ticketId) {
    throw new ApiError(400, "ticketId is required");
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "messages array is required");
  }

  const ticket = await getTicketByIdForUser({ ticketId, user: req.user });
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage?.content || typeof lastMessage.content !== "string") {
    throw new ApiError(400, "last message content is required");
  }

  const kind = classifyCopilotKind(mode, lastMessage.content);
  const isCustomerDraft = kind === "customer_draft";
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction: `You are Ticket Copilot for ZebraSupport agents handling support tickets.
Use only the provided ticket context and the chat conversation.
${formatTicketContext("Ticket context:", ticket)}

If producing internal guidance, be direct, practical, and structured for a support agent.
If producing a customer draft, write only the customer-facing response. Do not include labels, analysis, markdown headings, internal notes, or mention being an AI.
Keep answers concise and action-oriented.`
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: normalizeRole(m.role),
    parts: [{ text: m.content }]
  }));

  const prompt = isCustomerDraft
    ? `${lastMessage.content}\n\nReturn a polished customer-facing reply that can be pasted directly into the manual reply box.`
    : lastMessage.content;

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(prompt);
  const reply = result.response.text().trim();

  res.json({
    reply,
    kind,
    canApplyToReply: isCustomerDraft
  });
});

module.exports = { chat, ticketCopilot };
