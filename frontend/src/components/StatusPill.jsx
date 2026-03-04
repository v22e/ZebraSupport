const StatusPill = ({ status }) => {
  const statusStyles = {
    Open: "bg-white border border-black text-black",
    "Auto-Replied": "bg-black text-white",
    Escalated: "bg-zebra-gray text-black",
    Closed: "bg-emerald-100 text-emerald-900"
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyles[status] || "bg-zebra-gray"}`}>
      {status}
    </span>
  );
};

export default StatusPill;