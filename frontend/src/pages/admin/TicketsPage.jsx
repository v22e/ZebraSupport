import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTickets } from "../../api/tickets";
import StatusPill from "../../components/StatusPill";

const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTickets();
        setTickets(data.tickets);
      } catch (err) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading tickets...</div>;
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Tickets</h1>
        <p className="text-sm text-black/70">Review and manage all inbound support requests.</p>
      </div>

      <div className="zebra-card overflow-x-auto">
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
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-black/10 hover:bg-zebra-gray/30">
                <td className="px-4 py-3 font-bold">#{ticket.id}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/tickets/${ticket.id}`} className="font-semibold hover:underline">
                    {ticket.subject}
                  </Link>
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
      </div>
    </div>
  );
};

export default TicketsPage;