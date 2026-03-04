const pool = require("../config/db");

const getAnalyticsSummary = async (_req, res) => {
  const [countResult, unreadResult, topicsResult, statusResult, avgResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'Open')::int AS open,
         COUNT(*) FILTER (WHERE status = 'Auto-Replied')::int AS auto_resolved,
         COUNT(*) FILTER (WHERE status = 'Escalated')::int AS escalated,
         COUNT(*) FILTER (WHERE status = 'Closed')::int AS closed
       FROM tickets`
    ),
    pool.query(`SELECT COUNT(*)::int AS unread, COUNT(*) FILTER (WHERE is_read = true)::int AS read FROM tickets`),
    pool.query(
      `SELECT COALESCE(topic, 'Other') AS topic, COUNT(*)::int AS count
       FROM tickets
       WHERE status = 'Auto-Replied'
       GROUP BY COALESCE(topic, 'Other')
       ORDER BY count DESC
       LIMIT 5`
    ),
    pool.query(
      `SELECT status, COUNT(*)::int AS value
       FROM tickets
       GROUP BY status
       ORDER BY value DESC`
    ),
    pool.query(
      `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60.0), 2), 0) AS avg_response_minutes
       FROM tickets
       WHERE status IN ('Auto-Replied', 'Closed')`
    )
  ]);

  return res.json({
    overview: {
      ...countResult.rows[0],
      avg_response_minutes: Number(avgResult.rows[0].avg_response_minutes)
    },
    unread_vs_read: unreadResult.rows[0],
    top_faq_topics: topicsResult.rows,
    status_breakdown: statusResult.rows
  });
};

const getTicketVolume = async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date, total
     FROM (
      SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::int AS total
      FROM tickets
      WHERE created_at >= NOW() - INTERVAL '6 days'
      GROUP BY 1
     ) grouped
     ORDER BY day ASC`
  );

  return res.json({ volume: rows });
};

const getHealthScore = async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT
      COUNT(*)::numeric AS total,
      (COUNT(*) FILTER (WHERE status IN ('Auto-Replied', 'Closed')))::numeric AS positive
     FROM tickets`
  );

  const total = Number(rows[0].total || 0);
  const positive = Number(rows[0].positive || 0);
  const healthScore = total === 0 ? 0 : Number(((positive / total) * 100).toFixed(0));

  return res.json({
    healthScore,
    formula: "(Auto-resolved + Closed) / Total * 100"
  });
};

module.exports = {
  getAnalyticsSummary,
  getTicketVolume,
  getHealthScore
};