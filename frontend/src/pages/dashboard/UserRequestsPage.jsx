import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchTickets } from "../../api/tickets";
import StatusPill from "../../components/StatusPill";

const UserRequestsPage = () => {
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(location.state?.toast || "");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTickets();
        setTickets(data.tickets || []);
      } catch (err) {
        setError(err.message || "Failed to load support requests");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const rows = useMemo(() => tickets, [tickets]);

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading your requests...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">My Support Requests</h1>
          <p className="text-sm text-black/70">Submit and track your support requests.</p>
        </div>

        <Link
          to="/dashboard/new"
          className="rounded-md border border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
        >
          New Request
        </Link>
      </div>

      {toast ? (
        <div className="rounded-md border border-emerald-700 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">
          {toast}
        </div>
      ) : null}

      {error ? <div className="zebra-card p-4 text-red-700">{error}</div> : null}

      <div className="zebra-card overflow-x-auto">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-black/70">No requests submitted yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ticket) => (
                <tr key={ticket.id} className="border-t border-black/10 hover:bg-zebra-gray/25">
                  <td className="px-4 py-3 font-bold">#{ticket.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/tickets/${ticket.id}`} className="font-semibold hover:underline">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">{ticket.priority}</td>
                  <td className="px-4 py-3">{new Date(ticket.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserRequestsPage;
