const styles = {
  free: "bg-zinc-200 text-zinc-900",
  plus: "bg-blue-600 text-white",
  pro: "bg-black text-white"
};

const PlanBadge = ({ plan, className = "" }) => {
  const normalized = String(plan || "free").toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${styles[normalized] || styles.free} ${className}`}
    >
      {normalized}
    </span>
  );
};

export default PlanBadge;
