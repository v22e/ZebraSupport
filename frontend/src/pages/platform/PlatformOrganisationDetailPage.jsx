import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PlanBadge from "../../components/PlanBadge";
import { fetchPlatformOrganisationById, updatePlatformOrganisationPlan } from "../../api/platform";
import { updateUserRole } from "../../api/users";
import { formatRole } from "../../utils/roles";

const PlatformOrganisationDetailPage = () => {
  const { id } = useParams();
  const [organisation, setOrganisation] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadData = async () => {
    try {
      const data = await fetchPlatformOrganisationById(id);
      setOrganisation(data.organisation);
      setUsers(data.users || []);
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || "Failed to load organisation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRoleChange = async (userId, role) => {
    setError("");
    try {
      await updateUserRole(userId, role);
      setToast(`Role updated to ${formatRole(role)}.`);
      setTimeout(() => setToast(""), 3000);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update role");
    }
  };

  const handlePlanChange = async (plan) => {
    setError("");
    try {
      await updatePlatformOrganisationPlan(id, plan);
      setToast("Organisation plan updated.");
      setTimeout(() => setToast(""), 3000);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update organisation plan");
    }
  };

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading organisation details...</div>;
  }

  if (!organisation) {
    return <div className="zebra-card p-6 text-red-700">{error || "Organisation not found."}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">{organisation.name}</h1>
          <p className="text-sm text-black/70">Org #{organisation.id} · {organisation.status}</p>
          <div className="mt-2 flex items-center gap-2">
            <PlanBadge plan={organisation.plan} />
            <select
              value={organisation.plan}
              onChange={(event) => handlePlanChange(event.target.value)}
              className="rounded-md border border-black/30 px-2 py-1 text-xs"
            >
              <option value="free">FREE</option>
              <option value="plus">PLUS</option>
              <option value="pro">PRO</option>
            </select>
          </div>
        </div>
        <Link to="/platform/organisations" className="text-sm font-bold underline">
          Back to organisations
        </Link>
      </div>

      {error ? <div className="rounded-md border border-red-700 bg-red-100 px-4 py-2 text-sm text-red-900">{error}</div> : null}
      {toast ? <div className="rounded-md border border-emerald-700 bg-emerald-100 px-4 py-2 text-sm text-emerald-900">{toast}</div> : null}

      <div className="zebra-card overflow-hidden">
        <div className="border-b border-black/10 px-5 py-4">
          <h2 className="text-xl font-extrabold">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((tableUser) => (
                <tr key={tableUser.id} className="border-t border-black/10">
                  <td className="px-4 py-3 font-semibold">{tableUser.name}</td>
                  <td className="px-4 py-3">{tableUser.email}</td>
                  <td className="px-4 py-3">{formatRole(tableUser.role)}</td>
                  <td className="px-4 py-3">{tableUser.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">
                    {tableUser.role === "superadmin" ? (
                      <span className="text-xs font-semibold text-black/50">Protected</span>
                    ) : (
                      <select
                        value={tableUser.role}
                        onChange={(event) => handleRoleChange(tableUser.id, event.target.value)}
                        className="rounded-md border border-black/30 px-3 py-1"
                      >
                        <option value="user">User</option>
                        <option value="org_admin">Org Admin</option>
                        <option value="org_owner">Org Owner</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="zebra-card overflow-hidden">
        <div className="border-b border-black/10 px-5 py-4">
          <h2 className="text-xl font-extrabold">Recent Tickets</h2>
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
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-black/10">
                  <td className="px-4 py-3 font-semibold">#{ticket.id}</td>
                  <td className="px-4 py-3">{ticket.subject}</td>
                  <td className="px-4 py-3">{ticket.requesterName}</td>
                  <td className="px-4 py-3">{ticket.status}</td>
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

export default PlatformOrganisationDetailPage;

