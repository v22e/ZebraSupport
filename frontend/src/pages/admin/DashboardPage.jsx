import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSummary } from "../../api/analytics";
import { fetchTickets } from "../../api/tickets";
import StatCard from "../../components/StatCard";
import StatusPill from "../../components/StatusPill";

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, ticketsData] = await Promise.all([fetchSummary(), fetchTickets()]);
        setSummary(summaryData.overview);
        setTickets(ticketsData.tickets);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const recentTickets = useMemo(() => tickets.slice(0, 10), [tickets]);

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Dashboard</h1>
        <p className="text-sm text-black/70">Live overview of support operations and AI automation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tickets" value={summary?.total ?? 0} />
        <StatCard label="Open Tickets" value={summary?.open ?? 0} />
        <StatCard label="Auto-Resolved" value={summary?.auto_resolved ?? 0} />
        <StatCard
          label="Avg Response Time"
          value={`${summary?.avg_response_minutes ?? 0} min`}
          subtext="For auto-replied and closed tickets"
        />
      </div>

      <div className="zebra-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="text-xl font-extrabold">Recent tickets</h2>
          <Link to="/admin/tickets" className="text-sm font-bold underline">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Created At</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-black/10 hover:bg-zebra-gray/30">
                  <td className="px-4 py-3 font-bold">#{ticket.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/tickets/${ticket.id}`} className="font-semibold underline-offset-2 hover:underline">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{ticket.requesterName}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">{ticket.priority}</td>
                  <td className="px-4 py-3">{new Date(ticket.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;