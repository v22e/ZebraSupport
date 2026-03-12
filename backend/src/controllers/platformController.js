const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const { createNotificationsForUsers } = require("../services/notificationService");

const createOrganisation = async (req, res) => {
  const { name, plan = "free" } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO organisations (name, plan, status)
     VALUES ($1, $2, 'active')
     RETURNING id, name, plan, status, created_at AS "createdAt"`,
    [name, plan]
  );

  return res.status(201).json({ organisation: rows[0] });
};

const getPlatformSummary = async (_req, res) => {
  const [orgCount, userCount, ticketCount, healthRows, recentRows, demoRequests] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS total FROM organisations"),
    pool.query("SELECT COUNT(*)::int AS total FROM users WHERE role <> 'superadmin'"),
    pool.query("SELECT COUNT(*)::int AS total FROM tickets"),
    pool.query(
      `SELECT
         o.id,
         COALESCE(
           ROUND(
             (
               COUNT(t.*) FILTER (WHERE t.status IN ('Auto-Replied', 'Closed'))::numeric
               / NULLIF(COUNT(t.*), 0)::numeric
             ) * 100
           , 0)
         , 0) AS health_score
       FROM organisations o
       LEFT JOIN tickets t ON t.org_id = o.id
       GROUP BY o.id`
    ),
    pool.query(
      `SELECT
         o.id,
         o.name,
         o.plan,
         o.status,
         o.created_at AS "createdAt",
         owner.email AS "ownerEmail",
         COUNT(DISTINCT u.id)::int AS "userCount",
         COUNT(DISTINCT t.id)::int AS "ticketCount"
       FROM organisations o
       LEFT JOIN users owner
         ON owner.org_id = o.id AND owner.role = 'org_owner'
       LEFT JOIN users u
         ON u.org_id = o.id AND u.role <> 'superadmin'
       LEFT JOIN tickets t
         ON t.org_id = o.id
       GROUP BY o.id, owner.email
       ORDER BY o.created_at DESC
       LIMIT 10`
    ),
    pool.query("SELECT COUNT(*)::int AS count FROM demo_requests WHERE status = 'new'")
  ]);

  const healthScores = healthRows.rows.map((row) => Number(row.health_score));
  const platformHealthScore = healthScores.length
    ? Number((healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length).toFixed(0))
    : 0;

  return res.json({
    totals: {
      organisations: orgCount.rows[0].total,
      users: userCount.rows[0].total,
      tickets: ticketCount.rows[0].total,
      platformHealthScore,
      newDemoRequests: demoRequests.rows[0].count
    },
    recentOrganisations: recentRows.rows,
    billing: {
      monthlyRecurringRevenue: 0,
      note: "Billing aggregation is stubbed for now."
    }
  });
};

const updateOrganisationPlan = async (req, res) => {
  const orgId = Number(req.params.id);
  const { plan } = req.body;

  const { rows: currentRows } = await pool.query(
    "SELECT id, name, plan FROM organisations WHERE id = $1",
    [orgId]
  );
  const current = currentRows[0];
  if (!current) {
    throw new ApiError(404, "Organisation not found");
  }

  const { rows } = await pool.query(
    `UPDATE organisations
     SET plan = $1, plan_updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, plan, status, created_at AS "createdAt", plan_updated_at AS "planUpdatedAt"`,
    [plan, orgId]
  );

  console.log(`Plan changed from ${current.plan} to ${plan} by superadmin`);
  return res.json({ organisation: rows[0] });
};

const listOrganisations = async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT
       o.id,
       o.name,
       o.plan,
       o.status,
       o.created_at AS "createdAt",
       owner.email AS "ownerEmail",
       COUNT(DISTINCT u.id)::int AS "userCount",
       COUNT(DISTINCT t.id)::int AS "ticketCount"
     FROM organisations o
     LEFT JOIN users owner
       ON owner.org_id = o.id AND owner.role = 'org_owner'
     LEFT JOIN users u
       ON u.org_id = o.id AND u.role <> 'superadmin'
     LEFT JOIN tickets t
       ON t.org_id = o.id
     GROUP BY o.id, owner.email
     ORDER BY o.created_at DESC`
  );

  return res.json({ organisations: rows });
};

const getOrganisationById = async (req, res) => {
  const orgId = Number(req.params.id);

  const [orgResult, usersResult, ticketsResult] = await Promise.all([
    pool.query(
      `SELECT id, name, plan, status, created_at AS "createdAt"
       FROM organisations
       WHERE id = $1`,
      [orgId]
    ),
    pool.query(
      `SELECT id, org_id AS "orgId", name, email, role, active, created_at AS "createdAt"
       FROM users
       WHERE org_id = $1
       ORDER BY created_at ASC`,
      [orgId]
    ),
    pool.query(
      `SELECT id, subject, requester_name AS "requesterName", company, status, priority,
              is_demo AS "isDemo", created_at AS "createdAt"
       FROM tickets
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [orgId]
    )
  ]);

  const organisation = orgResult.rows[0];
  if (!organisation) {
    throw new ApiError(404, "Organisation not found");
  }

  return res.json({
    organisation,
    users: usersResult.rows,
    tickets: ticketsResult.rows
  });
};

const suspendOrganisation = async (req, res) => {
  const orgId = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE organisations
     SET status = 'suspended'
     WHERE id = $1
     RETURNING id, name, plan, status, created_at AS "createdAt"`,
    [orgId]
  );

  if (!rows[0]) {
    throw new ApiError(404, "Organisation not found");
  }

  await pool.query("UPDATE users SET refresh_token = NULL WHERE org_id = $1", [orgId]);
  const { rows: users } = await pool.query(
    "SELECT id FROM users WHERE org_id = $1 AND active = true",
    [orgId]
  );

  await createNotificationsForUsers(users.map((item) => item.id), {
    orgId,
    type: "org_suspended",
    title: "Your organisation has been suspended",
    body: "Access has been suspended. Contact support@zebrasupport.io",
    link: null
  });

  return res.json({ organisation: rows[0], message: "Organisation suspended." });
};

const activateOrganisation = async (req, res) => {
  const orgId = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE organisations
     SET status = 'active'
     WHERE id = $1
     RETURNING id, name, plan, status, created_at AS "createdAt"`,
    [orgId]
  );

  if (!rows[0]) {
    throw new ApiError(404, "Organisation not found");
  }

  return res.json({ organisation: rows[0], message: "Organisation activated." });
};

const deleteOrganisation = async (req, res) => {
  const orgId = Number(req.params.id);
  const { rows } = await pool.query(
    `DELETE FROM organisations
     WHERE id = $1
     RETURNING id, name`,
    [orgId]
  );

  if (!rows[0]) {
    throw new ApiError(404, "Organisation not found");
  }

  return res.json({ message: "Organisation deleted.", organisation: rows[0] });
};

module.exports = {
  createOrganisation,
  getPlatformSummary,
  listOrganisations,
  getOrganisationById,
  updateOrganisationPlan,
  suspendOrganisation,
  activateOrganisation,
  deleteOrganisation
};
