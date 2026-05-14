const pool = require("../config/db");

const PLAN_ORDER = ["free", "plus", "pro"];

const PLAN_FEATURES = {
  free: {
    support: "Community",
    analytics: "Basic",
    csvExport: false,
    customBranding: false
  },
  plus: {
    support: "Email",
    analytics: "Full",
    csvExport: false,
    customBranding: false
  },
  pro: {
    support: "Dedicated",
    analytics: "Full + Export",
    csvExport: true,
    customBranding: true
  }
};

const getNextTier = (plan) => {
  const index = PLAN_ORDER.indexOf(plan);
  if (index < 0 || index === PLAN_ORDER.length - 1) {
    return plan;
  }
  return PLAN_ORDER[index + 1];
};

const getOrganisationPlan = async (orgId) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id AS "orgId", o.name AS "orgName", o.plan, o.created_at AS "orgCreatedAt",
              pl.max_users AS "maxUsers", pl.max_tickets AS "maxTickets",
              pl.analytics, pl.csv_export AS "csvExport"
       FROM organisations o
       JOIN plan_limits pl ON pl.plan = o.plan::text
       WHERE o.id = $1`,
      [orgId]
    );
    return rows[0] || null;
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }

    const { rows } = await pool.query(
      `SELECT id AS "orgId", name AS "orgName", COALESCE(plan::text, 'free') AS plan, created_at AS "orgCreatedAt"
       FROM organisations
       WHERE id = $1`,
      [orgId]
    );
    if (!rows[0]) {
      return null;
    }

    const fallbackLimits = {
      free: { maxUsers: 3, maxTickets: 50, analytics: "basic", csvExport: false },
      plus: { maxUsers: 10, maxTickets: 500, analytics: "full", csvExport: false },
      pro: { maxUsers: null, maxTickets: null, analytics: "full", csvExport: true }
    };
    const limits = fallbackLimits[rows[0].plan] || fallbackLimits.free;

    return {
      ...rows[0],
      ...limits
    };
  }
};

module.exports = {
  PLAN_ORDER,
  PLAN_FEATURES,
  getNextTier,
  getOrganisationPlan
};
