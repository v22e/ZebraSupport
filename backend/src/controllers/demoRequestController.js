const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const { createNotificationsForUsers, getSuperadminIds } = require("../services/notificationService");

const createDemoRequest = async (req, res) => {
  const {
    name,
    email,
    company = null,
    phone = null,
    message = null,
    interestedPlan = null,
    orgId = null
  } = req.body;

  await pool.query(
    `INSERT INTO demo_requests (name, email, company, phone, message, interested_plan, org_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')`,
    [name, email.toLowerCase(), company, phone, message, interestedPlan, orgId]
  );

  console.log(`New demo request from ${name} at ${email} for ${interestedPlan || "unspecified"} plan`);

  const superadminIds = await getSuperadminIds();
  await createNotificationsForUsers(superadminIds, {
    orgId: null,
    type: "demo_request_received",
    title: "New demo request",
    body: `${name} from ${company || "Unknown Company"} interested in ${interestedPlan || "unspecified"} plan`,
    link: "/platform/demo-requests"
  });

  return res.status(201).json({ message: "Demo request received." });
};

const listDemoRequests = async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, company, phone, message,
            interested_plan AS "interestedPlan", org_id AS "orgId",
            status, created_at AS "createdAt"
     FROM demo_requests
     ORDER BY created_at DESC`
  );

  return res.json({ demoRequests: rows });
};

const updateDemoRequestStatus = async (req, res) => {
  const requestId = Number(req.params.id);
  const { status } = req.body;

  const { rows } = await pool.query(
    `UPDATE demo_requests
     SET status = $1
     WHERE id = $2
     RETURNING id, name, email, company, phone, message,
               interested_plan AS "interestedPlan", org_id AS "orgId",
               status, created_at AS "createdAt"`,
    [status, requestId]
  );

  if (!rows[0]) {
    throw new ApiError(404, "Demo request not found");
  }

  return res.json({ demoRequest: rows[0] });
};

module.exports = {
  createDemoRequest,
  listDemoRequests,
  updateDemoRequestStatus
};
