import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/StatCard";
import PlanBadge from "../../components/PlanBadge";
import { fetchPlatformSummary } from "../../api/platform";

const PlatformDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPlatformSummary();
        setSummary(data);
      } catch (err) {
        setError(err.message || "Failed to load platform summary");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading platform dashboard...</div>;
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  const totals = summary?.totals || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Platform Dashboard</h1>
        <p className="text-sm text-black/70">Global view across all ZebraSupport organisations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Organisations" value={totals.organisations || 0} />
        <StatCard label="Total Users" value={totals.users || 0} />
        <StatCard label="Total Tickets" value={totals.tickets || 0} />
        <StatCard label="Platform Health Score" value={`${totals.platformHealthScore || 0}%`} />
        <StatCard label="Demo Requests" value={totals.newDemoRequests || 0} />
      </div>

      {(totals.newDemoRequests || 0) > 0 ? (
        <Link to="/platform/demo-requests" className="inline-flex items-center gap-2 rounded-md border border-red-700 bg-red-100 px-4 py-2 text-sm font-bold text-red-900">
          {totals.newDemoRequests} new demo requests
        </Link>
      ) : null}

      <div className="zebra-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="text-xl font-extrabold">Recent Organisations</h2>
          <Link to="/platform/organisations" className="text-sm font-bold underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Tickets</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.recentOrganisations || []).map((org) => (
                <tr key={org.id} className="border-t border-black/10">
                  <td className="px-4 py-3 font-semibold">
                    <Link to={`/platform/organisations/${org.id}`} className="hover:underline">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{org.ownerEmail || "N/A"}</td>
                  <td className="px-4 py-3">{org.userCount}</td>
                  <td className="px-4 py-3">{org.ticketCount}</td>
                  <td className="px-4 py-3">{new Date(org.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><PlanBadge plan={org.plan} /></td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${org.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}>
                      {org.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboardPage;
