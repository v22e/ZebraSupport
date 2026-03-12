const ApiError = require("../utils/apiError");
const { getOrganisationPlan } = require("../services/planService");

const planLimits = async (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role === "superadmin") {
    req.plan = null;
    req.planLimits = null;
    return next();
  }

  if (!req.orgId) {
    return next(new ApiError(403, "Organisation context is required"));
  }

  const planData = await getOrganisationPlan(req.orgId);
  if (!planData) {
    return next(new ApiError(404, "Organisation not found"));
  }

  req.plan = planData.plan;
  req.planLimits = {
    maxUsers: planData.maxUsers,
    maxTickets: planData.maxTickets,
    analytics: planData.analytics,
    csvExport: planData.csvExport
  };
  req.orgName = planData.orgName;
  req.orgCreatedAt = planData.orgCreatedAt;

  return next();
};

module.exports = planLimits;
