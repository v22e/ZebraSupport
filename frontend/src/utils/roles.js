export const ROLE_LABELS = {
  superadmin: "Super Admin",
  org_owner: "Org Owner",
  org_admin: "Org Admin",
  user: "User"
};

export const formatRole = (role) => ROLE_LABELS[role] || role;

export const isSuperadmin = (role) => role === "superadmin";

export const isOrgRole = (role) => ["org_owner", "org_admin", "user"].includes(role);
export const isEndUser = (role) => role === "user";

export const getHomeRouteByRole = (role) => {
  if (role === "superadmin") return "/platform/dashboard";
  if (role === "org_owner" || role === "org_admin") return "/admin/dashboard";
  if (role === "user") return "/dashboard";
  return "/login";
};

export const canViewOrgAnalytics = (role) => ["org_owner", "org_admin"].includes(role);

export const canManageOrgSettings = (role) => ["org_owner", "org_admin"].includes(role);

export const canManageTargetStatus = (actorRole, targetRole, isSelf) => {
  if (isSelf || targetRole === "superadmin" || targetRole === "org_owner") {
    return false;
  }
  if (actorRole === "org_owner") {
    return ["org_admin", "user"].includes(targetRole);
  }
  if (actorRole === "org_admin") {
    return targetRole === "user";
  }
  return false;
};

export const getRoleChangeOptions = (actorRole, targetRole, isSelf) => {
  if (isSelf || targetRole === "superadmin") {
    return [];
  }

  if (actorRole === "org_owner") {
    if (["user", "org_admin"].includes(targetRole)) {
      return ["user", "org_admin"];
    }
    return [];
  }

  if (actorRole === "org_admin") {
    if (targetRole === "user") {
      return ["user", "org_admin"];
    }
    return [];
  }

  return [];
};

