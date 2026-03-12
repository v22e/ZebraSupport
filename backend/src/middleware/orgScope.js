const ApiError = require("../utils/apiError");

const orgScope = (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role === "superadmin") {
    req.isSuperadmin = true;
    const scopedOrgId = req.query?.orgId ? Number(req.query.orgId) : null;
    req.orgId = Number.isFinite(scopedOrgId) ? scopedOrgId : null;
    return next();
  }

  if (!req.user.orgId) {
    return next(new ApiError(403, "Organisation context is required"));
  }

  req.isSuperadmin = false;
  req.orgId = req.user.orgId;
  return next();
};

module.exports = orgScope;
