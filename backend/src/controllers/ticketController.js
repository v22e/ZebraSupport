const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const { classifyTicket } = require("../services/aiService");
const { enqueueAutoReply } = require("../services/queueService");

const computePriority = (subject, description) => {
  const text = `${subject} ${description}`.toLowerCase();
  if (["outage", "down", "urgent", "breach", "cannot access"].some((key) => text.includes(key))) {
    return "High";
  }
  if (["error", "failed", "broken"].some((key) => text.includes(key))) {
    return "Medium";
  }
  return "Low";
};

const getTickets = async (req, res) => {
  const status = req.query.status;
  const values = [];
  let whereClause = "";

  if (status) {
    values.push(status);
    whereClause = "WHERE status = $1";
  }

  const query = `
    SELECT id, subject, requester_name AS "requesterName", requester_email AS "requesterEmail",
           company, status, priority, topic, is_read AS "isRead", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM tickets
    ${whereClause}
    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query, values);
  return res.json({ tickets: rows });
};

const getTicketById = async (req, res) => {
  const ticketId = Number(req.params.id);
  const { rows } = await pool.query(
    `SELECT id, subject, description, requester_name AS "requesterName", requester_email AS "requesterEmail",
            company, status, priority, topic, ai_reply AS "aiReply", manual_reply AS "manualReply",
            is_read AS "isRead", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM tickets
     WHERE id = $1`,
    [ticketId]
  );

  const ticket = rows[0];
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  return res.json({ ticket });
};

const createTicket = async (req, res) => {
  const {
    subject,
    description,
    requesterName,
    requesterEmail,
    company,
    priority,
    status = "Open"
  } = req.body;

  const triagedPriority = priority || computePriority(subject, description);
  const { topic } = classifyTicket({ subject, description });

  const { rows } = await pool.query(
    `INSERT INTO tickets (subject, description, requester_name, requester_email, company, status, priority, topic)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, subject, description, requester_name AS "requesterName", requester_email AS "requesterEmail",
               company, status, priority, topic, ai_reply AS "aiReply", manual_reply AS "manualReply",
               is_read AS "isRead", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [subject, description, requesterName, requesterEmail.toLowerCase(), company, status, triagedPriority, topic]
  );

  const ticket = rows[0];

  if (status === "Open" && topic) {
    await enqueueAutoReply({ ticketId: ticket.id, topic });
  }

  return res.status(201).json({ ticket });
};

const updateTicket = async (req, res) => {
  const ticketId = Number(req.params.id);
  const fieldMap = {
    subject: "subject",
    description: "description",
    status: "status",
    priority: "priority",
    manualReply: "manual_reply",
    isRead: "is_read"
  };

  const updates = [];
  const values = [];

  Object.entries(req.body).forEach(([key, value]) => {
    if (fieldMap[key] !== undefined) {
      values.push(value);
      updates.push(`${fieldMap[key]} = $${values.length}`);
    }
  });

  if (!updates.length) {
    throw new ApiError(400, "No valid fields provided");
  }

  values.push(ticketId);

  const { rows } = await pool.query(
    `UPDATE tickets
     SET ${updates.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, subject, description, requester_name AS "requesterName", requester_email AS "requesterEmail",
               company, status, priority, topic, ai_reply AS "aiReply", manual_reply AS "manualReply",
               is_read AS "isRead", created_at AS "createdAt", updated_at AS "updatedAt"`,
    values
  );

  const ticket = rows[0];
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  return res.json({ ticket });
};

const deleteTicket = async (req, res) => {
  const ticketId = Number(req.params.id);
  const { rowCount } = await pool.query("DELETE FROM tickets WHERE id = $1", [ticketId]);

  if (!rowCount) {
    throw new ApiError(404, "Ticket not found");
  }

  return res.status(204).send();
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
};