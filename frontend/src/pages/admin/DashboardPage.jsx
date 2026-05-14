import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTickets } from "../../api/tickets";
import StatCard from "../../components/StatCard";
import StatusPill from "../../components/StatusPill";

const DashboardPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const ticketsData = await fetchTickets();
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
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((ticket) => ticket.status === "Open").length;
  const autoResolved = tickets.filter((ticket) => ticket.status === "Auto-Replied").length;
  const avgResponseMinutes = useMemo(() => {
    const resolved = tickets.filter((ticket) => ["Auto-Replied", "Closed"].includes(ticket.status));
    if (!resolved.length) {
      return 0;
    }
    const totalMinutes = resolved.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt).getTime();
      const updated = new Date(ticket.updatedAt).getTime();
      return sum + Math.max(0, (updated - created) / 60000);
    }, 0);
    return (totalMinutes / resolved.length).toFixed(2);
  }, [tickets]);

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
        <StatCard label="Total Tickets" value={totalTickets} />
        <StatCard label="Open Tickets" value={openTickets} />
        <StatCard label="Auto-Resolved" value={autoResolved} />
        <StatCard
          label="Avg Response Time"
          value={`${avgResponseMinutes} min`}
          subtext="For auto-replied and closed tickets"
        />
      </div>

      {totalTickets === 0 ? (
        <div className="zebra-card p-10 text-center">
          <h2 className="text-2xl font-black">No tickets yet. Share your support link to get started.</h2>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default DashboardPage;
