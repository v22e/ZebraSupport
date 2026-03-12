import { Download, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DemoRequestModal from "../../components/DemoRequestModal";
import StatusPill from "../../components/StatusPill";
import UpgradeModal from "../../components/UpgradeModal";
import { exportTicketsCsv, fetchTickets } from "../../api/tickets";
import { useAuth } from "../../context/AuthContext";
import { getNextTierLabel } from "../../utils/plans";

const statusOptions = ["All", "Open", "Auto-Replied", "Escalated", "Closed"];
const priorityOptions = ["All", "Low", "Medium", "High"];

const TicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ plan: user?.plan || "free", monthlyUsage: null });
  const [searchParams, setSearchParams] = useSearchParams();
  const [upgradeContext, setUpgradeContext] = useState(null);
  const [salesPlan, setSalesPlan] = useState(null);

  const query = searchParams.get("q") || "";
  const statusFilter = statusOptions.includes(searchParams.get("status")) ? searchParams.get("status") : "All";
  const priorityFilter = priorityOptions.includes(searchParams.get("priority")) ? searchParams.get("priority") : "All";

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTickets();
        setTickets(data.tickets);
        setMeta(data.meta || { plan: user?.plan || "free", monthlyUsage: null });
      } catch (err) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.plan]);

  const updateFilterParam = (key, value) => {
    const next = new URLSearchParams(searchParams);

    if (!value || value === "All") {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const textMatch =
        !normalizedQuery ||
        ticket.subject.toLowerCase().includes(normalizedQuery) ||
        ticket.requesterName.toLowerCase().includes(normalizedQuery) ||
        ticket.company.toLowerCase().includes(normalizedQuery);

      const statusMatch = statusFilter === "All" || ticket.status === statusFilter;
      const priorityMatch = priorityFilter === "All" || ticket.priority === priorityFilter;

      return textMatch && statusMatch && priorityMatch;
    });
  }, [tickets, query, statusFilter, priorityFilter]);

  const fromSearch = searchParams.toString();

  const handleExport = async () => {
    try {
      const csv = await exportTicketsCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tickets-org-${user?.orgId || "export"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err.upgrade) {
        setUpgradeContext({
          type: "tickets",
          plan: err.plan || meta.plan,
          limit: err.limit,
          current: err.current
        });
        return;
      }
      setError(err.message || "Failed to export CSV");
    }
  };

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading tickets...</div>;
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  const monthlyUsed = Number(meta.monthlyUsage?.tickets || 0);
  const monthlyLimit = meta.monthlyUsage?.limit;
  const isFree = meta.plan === "free";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Tickets</h1>
          <p className="text-sm text-black/70">Review and manage all inbound support requests.</p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={meta.plan !== "pro"}
          title={meta.plan !== "pro" ? "CSV export is available on the Pro plan" : "Export CSV"}
          className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold ${
            meta.plan === "pro"
              ? "border-black bg-black text-white hover:bg-white hover:text-black"
              : "cursor-not-allowed border-black/20 bg-zebra-gray text-black/50"
          }`}
        >
          {meta.plan === "pro" ? <Download size={16} /> : <Lock size={16} />} CSV Export
        </button>
      </div>

      {isFree && monthlyLimit && monthlyUsed >= 40 && monthlyUsed < monthlyLimit ? (
        <div className="rounded-md border border-yellow-600 bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-900">
          You are approaching your monthly ticket limit ({monthlyUsed}/{monthlyLimit} used). Upgrade your plan to avoid disruption.
        </div>
      ) : null}

      {isFree && monthlyLimit && monthlyUsed >= monthlyLimit ? (
        <div className="rounded-md border border-red-700 bg-red-100 px-4 py-2 text-sm font-semibold text-red-900">
          Monthly ticket limit reached. New tickets cannot be accepted until next month or you upgrade your plan.
        </div>
      ) : null}

      <div className="zebra-card p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            type="text"
            value={query}
            onChange={(event) => updateFilterParam("q", event.target.value)}
            placeholder="Search subject, requester, or company"
            className="rounded-md border border-black/30 px-3 py-2"
          />

          <select
            value={statusFilter}
            onChange={(event) => updateFilterParam("status", event.target.value)}
            className="rounded-md border border-black/30 px-3 py-2"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => updateFilterParam("priority", event.target.value)}
            className="rounded-md border border-black/30 px-3 py-2"
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-black px-3 py-2 font-semibold hover:bg-zebra-gray"
          >
            Clear filters
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-black/70">
        Showing {filteredTickets.length} of {tickets.length} tickets
      </p>

      <div className="zebra-card overflow-x-auto">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-black/70">No tickets yet.</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-black/70">No tickets match your filters.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-black/10 hover:bg-zebra-gray/30">
                  <td className="px-4 py-3 font-bold">#{ticket.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/tickets/${ticket.id}`}
                      state={{ fromSearch: fromSearch ? `?${fromSearch}` : "" }}
                      className="font-semibold hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                    {ticket.isDemo ? (
                      <span className="ml-2 rounded-full bg-zebra-gray px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/80">
                        Demo
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{ticket.requesterName}</td>
                  <td className="px-4 py-3">{ticket.company}</td>
                  <td className="px-4 py-3"><StatusPill status={ticket.status} /></td>
                  <td className="px-4 py-3">{ticket.priority}</td>
                  <td className="px-4 py-3">{new Date(ticket.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UpgradeModal
        isOpen={Boolean(upgradeContext)}
        context={upgradeContext}
        onClose={() => setUpgradeContext(null)}
        onTalkToSales={(plan) => setSalesPlan(plan || getNextTierLabel(meta.plan || user?.plan))}
      />

      <DemoRequestModal
        isOpen={Boolean(salesPlan)}
        onClose={() => setSalesPlan(null)}
        interestedPlan={salesPlan || getNextTierLabel(meta.plan || user?.plan)}
        readOnlyPlan
        orgId={user?.orgId}
        initialValues={{
          name: user?.name || "",
          email: user?.email || "",
          company: user?.company || ""
        }}
      />
    </div>
  );
};

export default TicketsPage;
