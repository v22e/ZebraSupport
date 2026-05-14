const pool = require("../config/db");

const computeHealthFromTotals = (total, positive) => {
  if (!total) return 0;
  return Number(((positive / total) * 100).toFixed(0));
};

const getAnalyticsSummary = async (req, res) => {
  const orgId = req.orgId;
  const [countResult, unreadResult, topicsResult, statusResult, avgResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'Open')::int AS open,
         COUNT(*) FILTER (WHERE status = 'Auto-Replied')::int AS auto_resolved,
         COUNT(*) FILTER (WHERE status = 'Escalated')::int AS escalated,
         COUNT(*) FILTER (WHERE status = 'Closed')::int AS closed
       FROM tickets
       WHERE org_id = $1`,
      [orgId]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE is_read = false)::int AS unread,
         COUNT(*) FILTER (WHERE is_read = true)::int AS read
       FROM tickets
       WHERE org_id = $1`,
      [orgId]
    ),
    pool.query(
      `SELECT COALESCE(topic, 'Other') AS topic, COUNT(*)::int AS count
       FROM tickets
       WHERE org_id = $1 AND status = 'Auto-Replied'
       GROUP BY COALESCE(topic, 'Other')
       ORDER BY count DESC
       LIMIT 5`,
      [orgId]
    ),
    pool.query(
      `SELECT status, COUNT(*)::int AS value
       FROM tickets
       WHERE org_id = $1
       GROUP BY status
       ORDER BY value DESC`,
      [orgId]
    ),
    pool.query(
      `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60.0), 2), 0) AS avg_response_minutes
       FROM tickets
       WHERE org_id = $1 AND status IN ('Auto-Replied', 'Closed')`,
      [orgId]
    )
  ]);

  const overview = {
    ...countResult.rows[0],
    avg_response_minutes: Number(avgResult.rows[0].avg_response_minutes)
  };

  const healthScore = computeHealthFromTotals(Number(overview.total || 0), Number(overview.auto_resolved || 0) + Number(overview.closed || 0));

  return res.json({
    overview,
    unread_vs_read: unreadResult.rows[0],
    top_faq_topics: topicsResult.rows,
    status_breakdown: statusResult.rows,
    healthScore,
    meta: {
      plan: req.plan,
      analyticsTier: req.planLimits?.analytics || "basic"
    }
  });
};

const getTicketVolume = async (req, res) => {
  const orgId = req.orgId;

  if (req.plan === "free") {
    return res.json({
      locked: true,
      message: "Unlock full analytics - upgrade to Plus or Pro",
      volume: []
    });
  }

  const { rows } = await pool.query(
    `SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date, total
     FROM (
      SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::int AS total
      FROM tickets
      WHERE org_id = $1 AND created_at >= NOW() - INTERVAL '6 days'
      GROUP BY 1
     ) grouped
     ORDER BY day ASC`,
    [orgId]
  );

  return res.json({ volume: rows, locked: false });
};

const getHealthScore = async (req, res) => {
  const orgId = req.orgId;
  const { rows } = await pool.query(
    `SELECT
      COUNT(*)::numeric AS total,
      (COUNT(*) FILTER (WHERE status IN ('Auto-Replied', 'Closed')))::numeric AS positive
     FROM tickets
     WHERE org_id = $1`,
    [orgId]
  );

  const total = Number(rows[0].total || 0);
  const positive = Number(rows[0].positive || 0);
  const healthScore = computeHealthFromTotals(total, positive);

  if (req.plan === "free") {
    return res.json({
      healthScore,
      formula: "(Auto-resolved + Closed) / Total * 100",
      locked: true,
      message: "Unlock full analytics - upgrade to Plus or Pro"
    });
  }

  return res.json({
    healthScore,
    formula: "(Auto-resolved + Closed) / Total * 100",
    locked: false
  });
};

module.exports = {
  getAnalyticsSummary,
  getTicketVolume,
  getHealthScore
};
