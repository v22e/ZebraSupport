export const PLAN_ORDER = ["standard", "pro"];

export const getNextTierLabel = (plan) => {
  const normalized = String(plan || "standard").toLowerCase();
  const index = PLAN_ORDER.indexOf(normalized);
  if (index < 0 || index === PLAN_ORDER.length - 1) return normalized;
  return PLAN_ORDER[index + 1];
};

export const formatPlan = (plan) => String(plan || "standard").toUpperCase();
