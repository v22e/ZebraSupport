const pool = require("../config/db");
const ApiError = require("../utils/apiError");
const { PLAN_FEATURES } = require("../services/planService");

const getCurrentBilling = async (req, res) => {
  if (req.user.role !== "org_owner") {
    throw new ApiError(403, "Only organisation owners can access billing");
  }

  const [orgResult, usageResult, limitsResult] = await Promise.all([
    pool.query(
      `SELECT id, name, plan, created_at AS "createdAt", plan_updated_at AS "planUpdatedAt"
       FROM organisations
       WHERE id = $1`,
      [req.orgId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM tickets
       WHERE org_id = $1
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`,
      [req.orgId]
    ),
    pool.query(
      `SELECT plan, max_users AS "maxUsers", max_tickets AS "maxTickets", analytics, csv_export AS "csvExport"
       FROM plan_limits
       ORDER BY CASE plan WHEN 'free' THEN 1 WHEN 'plus' THEN 2 ELSE 3 END`
    )
  ]);

  const organisation = orgResult.rows[0];
  if (!organisation) {
    throw new ApiError(404, "Organisation not found");
  }

  const monthlyTicketCount = usageResult.rows[0].count;
  const currentPlanLimits = limitsResult.rows.find((row) => row.plan === organisation.plan);

  return res.json({
    organisation,
    currentPlan: {
      ...currentPlanLimits,
      features: PLAN_FEATURES[organisation.plan]
    },
    monthlyUsage: {
      tickets: monthlyTicketCount,
      limit: currentPlanLimits?.maxTickets
    },
    planComparison: limitsResult.rows
  });
};

module.exports = {
  getCurrentBilling
};
