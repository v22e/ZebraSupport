const StatCard = ({ label, value, subtext }) => (
  <div className="zebra-card p-5">
    <p className="text-xs uppercase tracking-[0.15em] text-black/60">{label}</p>
    <h3 className="mt-2 text-3xl font-extrabold text-black">{value}</h3>
    {subtext ? <p className="mt-2 text-sm text-black/70">{subtext}</p> : null}
  </div>
);

export default StatCard;