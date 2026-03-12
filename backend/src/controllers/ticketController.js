const pool = require("../config/db");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const { classifyTicket, getReplyByTopic } = require("../services/aiService");
const { enqueueAutoReply } = require("../services/queueService");
const { demoTicketSeed } = require("../services/demoTicketSeed");
const {
  createNotification,
  createNotificationsForUsers,
  getOrgUsersByRoles
} = require("../services/notificationService");

const USER_EDITABLE_FIELDS = new Set(["manualReply", "message", "isRead"]);

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

const getMonthlyTicketCount = async (orgId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM tickets
     WHERE org_id = $1
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`,
    [orgId]
  );
  return rows[0].count;
};

const maybeSendPlanLimitNotifications = async ({ orgId, plan, maxTickets, count }) => {
  if (maxTickets === null || maxTickets === undefined) {
    return;
  }

  const ownerIds = await getOrgUsersByRoles(orgId, ["org_owner"]);
  if (!ownerIds.length) {
    return;
  }

  const warningThreshold = Math.ceil(maxTickets * 0.8);
  if (count >= warningThreshold) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE org_id = $1
         AND type = 'plan_limit_warning'
         AND DATE_TRUNC('day', created_at) = DATE_TRUNC('day', NOW())`,
      [orgId]
    );

    if (rows[0].count === 0) {
      await createNotificationsForUsers(ownerIds, {
        orgId,
        type: "plan_limit_warning",
        title: "Approaching ticket limit",
        body: `You have used ${count}/${maxTickets} tickets this month.`,
        link: "/admin/billing"
      });
    }
  }

  if (count === maxTickets) {
    await createNotificationsForUsers(ownerIds, {
      orgId,
      type: "plan_limit_reached",
      title: "Ticket limit reached",
      body: `Your org has reached the ${plan} plan limit of ${maxTickets} tickets this month.`,
      link: "/admin/billing"
    });
  }
};

const validateAssignedUser = async (orgId, assignedTo) => {
  if (assignedTo === null || assignedTo === undefined) {
    return null;
  }

  const { rows } = await pool.query(
    `SELECT id
     FROM users
     WHERE id = $1
       AND org_id = $2
       AND role IN ('org_admin', 'user')
       AND active = true`,
    [assignedTo, orgId]
  );

  if (!rows[0]) {
    throw new ApiError(400, "Assigned user not found in your organisation");
  }

  return assignedTo;
};

const getCurrentOrgUserProfile = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, o.name AS "company"
     FROM users u
     JOIN organisations o ON o.id = u.org_id
     WHERE u.id = $1`,
    [userId]
  );

  return rows[0] || null;
};

const getTickets = async (req, res) => {
  const { status } = req.query;
  const values = [req.orgId];
  const conditions = ["org_id = $1"];

  if (req.user.role === "user") {
    values.push(req.user.id);
    conditions.push(`submitted_by = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const [ticketsResult, monthlyCount] = await Promise.all([
    pool.query(
      `SELECT id, subject, requester_name AS "requesterName", requester_email AS "requesterEmail",
              company, status, priority, topic, is_read AS "isRead", is_demo AS "isDemo",
              submitted_by AS "submittedBy", assigned_to AS "assignedTo",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tickets
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`,
      values
    ),
    getMonthlyTicketCount(req.orgId)
  ]);

  return res.json({
    tickets: ticketsResult.rows,
    meta: {
      plan: req.plan,
      monthlyUsage: {
        tickets: monthlyCount,
        limit: req.planLimits?.maxTickets ?? null
      }
    }
  });
};

const getTicketById = async (req, res) => {
  const ticketId = Number(req.params.id);

  const { rows } = await pool.query(
    `SELECT id, subject, description, requester_name AS "requesterName", requester_email AS "requesterEmail",
            company, status, priority, topic, ai_reply AS "aiReply", manual_reply AS "manualReply",
            is_read AS "isRead", is_demo AS "isDemo", submitted_by AS "submittedBy", assigned_to AS "assignedTo",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM tickets
     WHERE id = $1 AND org_id = $2`,
    [ticketId, req.orgId]
  );

  const ticket = rows[0];
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  if (req.user.role === "user" && ticket.submittedBy !== req.user.id) {
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
    status = "Open",
    assignedTo
  } = req.body;

  const currentMonthlyCount = await getMonthlyTicketCount(req.orgId);
  const maxTickets = req.planLimits?.maxTickets;

  if (maxTickets !== null && maxTickets !== undefined && currentMonthlyCount >= maxTickets) {
    throw new ApiError(403, "Monthly ticket limit reached.", {
      limit: maxTickets,
      current: currentMonthlyCount,
      upgrade: true,
      plan: req.plan
    });
  }

  if (req.user.role === "user" && status !== "Open") {
    throw new ApiError(403, "Users can only create open tickets.");
  }

  const triagedPriority = priority || computePriority(subject, description);
  const { topic } = classifyTicket({ subject, description });

  let finalAssignedTo = null;
  let finalRequesterName = requesterName;
  let finalRequesterEmail = requesterEmail;
  let finalCompany = company;

  if (req.user.role === "user") {
    const profile = await getCurrentOrgUserProfile(req.user.id);
    if (!profile) {
      throw new ApiError(404, "User profile not found");
    }

    finalRequesterName = profile.name;
    finalRequesterEmail = profile.email;
    finalCompany = profile.company;
  } else {
    finalAssignedTo = await validateAssignedUser(req.orgId, assignedTo);

    if (!finalRequesterName || !finalRequesterEmail || !finalCompany) {
      throw new ApiError(400, "Requester name, requester email, and company are required");
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO tickets (
      org_id, submitted_by, subject, description, requester_name, requester_email, company,
      status, priority, topic, assigned_to, is_demo
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)
     RETURNING id, subject, description, requester_name AS "requesterName", requester_email AS "requesterEmail",
               company, status, priority, topic, ai_reply AS "aiReply", manual_reply AS "manualReply",
               is_read AS "isRead", is_demo AS "isDemo", submitted_by AS "submittedBy", assigned_to AS "assignedTo",
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      req.orgId,
      req.user.id,
      subject,
      description,
      finalRequesterName,
      String(finalRequesterEmail).toLowerCase(),
      finalCompany,
      status,
      triagedPriority,
      topic,
      finalAssignedTo
    ]
  );

  const ticket = rows[0];

  if (status === "Open" && topic) {
    await enqueueAutoReply({ ticketId: ticket.id, topic, orgId: req.orgId });
  }

  if (finalAssignedTo) {
    await createNotification({
      userId: finalAssignedTo,
      orgId: req.orgId,
      type: "ticket_assigned",
      title: `Ticket #${ticket.id} assigned to you`,
      body: `You have been assigned: ${ticket.subject}`,
      link: `/dashboard/tickets/${ticket.id}`
    });
  }

  const adminAndOwnerIds = await getOrgUsersByRoles(req.orgId, ["org_owner", "org_admin"]);
  await createNotificationsForUsers(adminAndOwnerIds, {
    orgId: req.orgId,
    type: "ticket_created",
    title: `New ticket #${ticket.id}`,
    body: `${ticket.requesterName} submitted: ${ticket.subject}`,
    link: `/admin/tickets/${ticket.id}`
  });

  await maybeSendPlanLimitNotifications({
    orgId: req.orgId,
    plan: req.plan,
    maxTickets,
    count: currentMonthlyCount + 1
  });

  return res.status(201).json({ ticket });
};

const updateTicket = async (req, res) => {
  const ticketId = Number(req.params.id);
  const { rows: existingRows } = await pool.query(
    `SELECT id, org_id, submitted_by, assigned_to, status, subject, requester_email, manual_reply
     FROM tickets
     WHERE id = $1 AND org_id = $2`,
    [ticketId, req.orgId]
  );

  const existingTicket = existingRows[0];
  if (!existingTicket) {
    throw new ApiError(404, "Ticket not found");
  }

  if (req.user.role === "user" && existingTicket.submitted_by !== req.user.id) {
    throw new ApiError(404, "Ticket not found");
  }

  if (req.user.role === "user") {
    const invalid = Object.keys(req.body).find((key) => !USER_EDITABLE_FIELDS.has(key));
    if (invalid) {
      throw new ApiError(403, "You do not have permission to update this field.");
    }
  }

  const fieldMap = {
    subject: "subject",
    description: "description",
    status: "status",
    priority: "priority",
    manualReply: "manual_reply",
    message: "manual_reply",
    isRead: "is_read",
    assignedTo: "assigned_to"
  };

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(req.body)) {
    const dbField = fieldMap[key];
    if (!dbField) continue;

    if (req.user.role === "user" && ["status", "priority", "assignedTo"].includes(key)) {
      throw new ApiError(403, "You do not have permission to update this field.");
    }

    if (key === "assignedTo") {
      await validateAssignedUser(req.orgId, value);
    }

    values.push(value);
    updates.push(`${dbField} = $${values.length}`);
  }

  if (!updates.length) {
    throw new ApiError(400, "No valid fields provided");
  }

  values.push(ticketId, req.orgId);

  const { rows } = await pool.query(
    `UPDATE tickets
     SET ${updates.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND org_id = $${values.length}
     RETURNING id, subject, description, requester_name AS "requesterName", requester_email AS "requesterEmail",
               company, status, priority, topic, ai_reply AS "aiReply", manual_reply AS "manualReply",
               is_read AS "isRead", is_demo AS "isDemo", submitted_by AS "submittedBy", assigned_to AS "assignedTo",
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    values
  );

  const ticket = rows[0];
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  const statusChanged = req.body.status && req.body.status !== existingTicket.status;
  const manualReplyAdded =
    (typeof req.body.manualReply === "string" && req.body.manualReply.trim() && req.body.manualReply !== existingTicket.manual_reply) ||
    (typeof req.body.message === "string" && req.body.message.trim() && req.body.message !== existingTicket.manual_reply);

  if (statusChanged && ticket.status === "Escalated") {
    const adminAndOwnerIds = await getOrgUsersByRoles(req.orgId, ["org_owner", "org_admin"]);
    await createNotificationsForUsers(adminAndOwnerIds, {
      orgId: req.orgId,
      type: "ticket_escalated",
      title: `Ticket #${ticket.id} escalated`,
      body: `${ticket.subject} has been marked as escalated.`,
      link: `/admin/tickets/${ticket.id}`
    });
  }

  if (statusChanged && ticket.status === "Closed") {
    const closeRecipient = ticket.assignedTo || ticket.submittedBy || null;
    if (closeRecipient) {
      await createNotification({
        userId: closeRecipient,
        orgId: req.orgId,
        type: "ticket_closed",
        title: `Ticket #${ticket.id} closed`,
        body: `${ticket.subject} has been closed.`,
        link: `/dashboard/tickets/${ticket.id}`
      });
    }
  }

  if (manualReplyAdded) {
    if (req.user.role !== "user") {
      const { rows: requesterRows } = await pool.query(
        `SELECT id
         FROM users
         WHERE org_id = $1 AND email = $2
         LIMIT 1`,
        [req.orgId, existingTicket.requester_email]
      );

      if (requesterRows[0]?.id) {
        await createNotification({
          userId: requesterRows[0].id,
          orgId: req.orgId,
          type: "ticket_replied",
          title: `Your ticket #${ticket.id} has a new reply`,
          body: `A support team member replied to: ${ticket.subject}`,
          link: `/dashboard/tickets/${ticket.id}`
        });
      }
    }

    const adminAndOwnerIds = await getOrgUsersByRoles(req.orgId, ["org_owner", "org_admin"], {
      excludeUserId: req.user.id
    });

    await createNotificationsForUsers(adminAndOwnerIds, {
      orgId: req.orgId,
      type: "ticket_replied",
      title: `Ticket #${ticket.id} updated`,
      body: `${req.user.email} replied to: ${ticket.subject}`,
      link: `/admin/tickets/${ticket.id}`
    });
  }

  if (req.body.assignedTo && req.body.assignedTo !== existingTicket.assigned_to) {
    await createNotification({
      userId: req.body.assignedTo,
      orgId: req.orgId,
      type: "ticket_assigned",
      title: `Ticket #${ticket.id} assigned to you`,
      body: `You have been assigned: ${ticket.subject}`,
      link: `/dashboard/tickets/${ticket.id}`
    });
  }

  return res.json({ ticket });
};

const assignTicket = async (req, res) => {
  const ticketId = Number(req.params.id);
  const { assignedTo } = req.body;
  const validAssignedTo = await validateAssignedUser(req.orgId, assignedTo);

  const { rows } = await pool.query(
    `UPDATE tickets
     SET assigned_to = $1, updated_at = NOW()
     WHERE id = $2 AND org_id = $3
     RETURNING id, subject, assigned_to AS "assignedTo"`,
    [validAssignedTo, ticketId, req.orgId]
  );

  if (!rows[0]) {
    throw new ApiError(404, "Ticket not found");
  }

  await createNotification({
    userId: validAssignedTo,
    orgId: req.orgId,
    type: "ticket_assigned",
    title: `Ticket #${rows[0].id} assigned to you`,
    body: `You have been assigned: ${rows[0].subject}`,
    link: `/dashboard/tickets/${rows[0].id}`
  });

  return res.json({ ticket: rows[0] });
};

const exportTicketsCsv = async (req, res) => {
  if (!req.planLimits?.csvExport) {
    throw new ApiError(403, "CSV export is available on the Pro plan.", {
      upgrade: true,
      plan: req.plan
    });
  }

  const { rows } = await pool.query(
    `SELECT id, subject, requester_name, requester_email, company, status, priority, created_at
     FROM tickets
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [req.orgId]
  );

  const header = ["ID", "Subject", "Requester", "Requester Email", "Company", "Status", "Priority", "Created At"];
  const lines = rows.map((row) =>
    [
      row.id,
      row.subject,
      row.requester_name,
      row.requester_email,
      row.company,
      row.status,
      row.priority,
      new Date(row.created_at).toISOString()
    ]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=\"tickets-org-${req.orgId}.csv\"`);
  return res.status(200).send(csv);
};

const deleteTicket = async (req, res) => {
  if (env.demoMode) {
    throw new ApiError(403, "Delete is disabled in demo mode");
  }

  const ticketId = Number(req.params.id);
  const { rowCount } = await pool.query("DELETE FROM tickets WHERE id = $1 AND org_id = $2", [ticketId, req.orgId]);

  if (!rowCount) {
    throw new ApiError(404, "Ticket not found");
  }

  return res.status(204).send();
};

const resetAllTickets = async (req, res) => {
  await pool.query("DELETE FROM tickets WHERE org_id = $1", [req.orgId]);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM tickets");
  if (rows[0].total === 0) {
    await pool.query("ALTER SEQUENCE tickets_id_seq RESTART WITH 1");
  }

  return res.status(200).json({ message: "All tickets have been reset." });
};

const loadDemoTickets = async (req, res) => {
  const { rows: existingRows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM tickets WHERE org_id = $1 AND is_demo = true",
    [req.orgId]
  );

  if (existingRows[0].count > 0) {
    return res.json({ message: "Demo tickets already loaded.", count: existingRows[0].count });
  }

  const { rows: assigneeRows } = await pool.query(
    `SELECT id
     FROM users
     WHERE org_id = $1 AND active = true AND role IN ('org_admin', 'user')
     ORDER BY CASE role WHEN 'org_admin' THEN 1 ELSE 2 END, id ASC
     LIMIT 1`,
    [req.orgId]
  );

  const defaultAssignee = assigneeRows[0]?.id || null;

  const client = await pool.connect();
  let inserted = 0;

  try {
    await client.query("BEGIN");

    for (let index = 0; index < demoTicketSeed.length; index += 1) {
      const item = demoTicketSeed[index];
      const aiReply = item.status === "Auto-Replied" && item.topic ? getReplyByTopic(item.topic) : null;
      const isRead = item.status !== "Open";

      // eslint-disable-next-line no-await-in-loop
      await client.query(
        `INSERT INTO tickets (
          org_id, submitted_by, assigned_to, subject, description, requester_name, requester_email, company,
          status, priority, topic, ai_reply, manual_reply, is_read, is_demo, created_at, updated_at
        )
         VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, NULL, $13, true,
          NOW() - (($14 + 1) * INTERVAL '2 hours'), NOW() - (($14 + 1) * INTERVAL '2 hours')
         )`,
        [
          req.orgId,
          req.user.id,
          defaultAssignee,
          item.subject,
          item.description,
          item.requesterName,
          item.requesterEmail,
          item.company,
          item.status,
          item.priority,
          item.topic,
          aiReply,
          isRead,
          index
        ]
      );

      inserted += 1;
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.status(201).json({ message: "Demo tickets loaded.", count: inserted });
};

const removeDemoTickets = async (req, res) => {
  const { rowCount } = await pool.query(
    "DELETE FROM tickets WHERE is_demo = true AND org_id = $1",
    [req.orgId]
  );

  return res.json({ message: "Demo tickets removed.", count: rowCount });
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  assignTicket,
  exportTicketsCsv,
  deleteTicket,
  resetAllTickets,
  loadDemoTickets,
  removeDemoTickets
};
