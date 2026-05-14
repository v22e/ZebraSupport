const styles = {
  standard: "bg-zinc-200 text-zinc-900",
  pro: "bg-black text-white",
  // legacy fallbacks
  free: "bg-zinc-200 text-zinc-900",
  plus: "bg-blue-600 text-white"
};

const PlanBadge = ({ plan, className = "" }) => {
  const normalized = String(plan || "standard").toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${styles[normalized] || styles.standard} ${className}`}
    >
      {normalized === "free" || normalized === "plus" ? "standard" : normalized}
    </span>
  );
};

export default PlanBadge;
