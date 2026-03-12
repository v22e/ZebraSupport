import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlanBadge from "../../components/PlanBadge";
import {
  activatePlatformOrganisation,
  createPlatformOrganisation,
  deletePlatformOrganisation,
  fetchPlatformOrganisations,
  suspendPlatformOrganisation,
  updatePlatformOrganisationPlan
} from "../../api/platform";

const planOptions = ["free", "plus", "pro"];

const PlatformOrganisationsPage = () => {
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [deletingOrg, setDeletingOrg] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState("free");

  const loadOrganisations = async () => {
    try {
      const data = await fetchPlatformOrganisations();
      setOrganisations(data.organisations || []);
    } catch (err) {
      setError(err.message || "Failed to load organisations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganisations();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  };

  const handleSuspendToggle = async (org) => {
    setBusyId(org.id);
    setError("");
    try {
      if (org.status === "active") {
        await suspendPlatformOrganisation(org.id);
        showToast("Organisation suspended.");
      } else {
        await activatePlatformOrganisation(org.id);
        showToast("Organisation activated.");
      }
      await loadOrganisations();
    } catch (err) {
      setError(err.message || "Failed to update organisation status");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateOrganisation = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await createPlatformOrganisation({ name: newOrgName, plan: newOrgPlan });
      setNewOrgName("");
      setNewOrgPlan("free");
      showToast("Organisation created.");
      await loadOrganisations();
    } catch (err) {
      setError(err.message || "Failed to create organisation");
    }
  };

  const handleDeleteOrganisation = async () => {
    if (!deletingOrg) return;
    setBusyId(deletingOrg.id);
    setError("");
    try {
      await deletePlatformOrganisation(deletingOrg.id);
      showToast("Organisation deleted.");
      setDeletingOrg(null);
      await loadOrganisations();
    } catch (err) {
      setError(err.message || "Failed to delete organisation");
    } finally {
      setBusyId(null);
    }
  };

  const handlePlanChange = async (orgId, plan) => {
    setError("");
    setBusyId(orgId);
    try {
      await updatePlatformOrganisationPlan(orgId, plan);
      showToast("Organisation plan updated.");
      await loadOrganisations();
    } catch (err) {
      setError(err.message || "Failed to update plan");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading organisations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Organisations</h1>
        <p className="text-sm text-black/70">Manage all customer organisations across the platform.</p>
      </div>

      {error ? <div className="rounded-md border border-red-700 bg-red-100 px-4 py-2 text-sm text-red-900">{error}</div> : null}
      {toast ? (
        <div className="rounded-md border border-emerald-700 bg-emerald-100 px-4 py-2 text-sm text-emerald-900">{toast}</div>
      ) : null}

      <div className="zebra-card p-5">
        <h2 className="text-lg font-extrabold">Create Organisation</h2>
        <form className="mt-3 flex flex-wrap gap-3" onSubmit={handleCreateOrganisation}>
          <input
            type="text"
            required
            value={newOrgName}
            onChange={(event) => setNewOrgName(event.target.value)}
            placeholder="Organisation name"
            className="min-w-[260px] flex-1 rounded-md border border-black/30 px-3 py-2"
          />
          <select
            value={newOrgPlan}
            onChange={(event) => setNewOrgPlan(event.target.value)}
            className="rounded-md border border-black/30 px-3 py-2"
          >
            {planOptions.map((plan) => (
              <option key={plan} value={plan}>{plan.toUpperCase()}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black"
          >
            Create
          </button>
        </form>
      </div>

      <div className="zebra-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">Tickets</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organisations.map((org) => (
              <tr key={org.id} className="border-t border-black/10">
                <td className="px-4 py-3 font-semibold">#{org.id}</td>
                <td className="px-4 py-3">{org.name}</td>
                <td className="px-4 py-3">{org.ownerEmail || "N/A"}</td>
                <td className="px-4 py-3">{org.userCount}</td>
                <td className="px-4 py-3">{org.ticketCount}</td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <PlanBadge plan={org.plan} />
                    <select
                      value={org.plan}
                      disabled={busyId === org.id}
                      onChange={(event) => handlePlanChange(org.id, event.target.value)}
                      className="block rounded-md border border-black/30 px-2 py-1 text-xs"
                    >
                      {planOptions.map((plan) => (
                        <option key={plan} value={plan}>{plan.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${org.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}>
                    {org.status}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(org.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/platform/organisations/${org.id}`}
                      className="rounded-md border border-black px-3 py-1 font-semibold hover:bg-zebra-gray"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === org.id}
                      onClick={() => handleSuspendToggle(org)}
                      className={`rounded-md border px-3 py-1 font-semibold ${
                        org.status === "active"
                          ? "border-amber-800 bg-amber-600 text-white hover:bg-amber-700"
                          : "border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800"
                      }`}
                    >
                      {busyId === org.id ? "Saving..." : org.status === "active" ? "Suspend" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingOrg(org)}
                      className="rounded-md border border-red-800 bg-red-700 px-3 py-1 font-semibold text-white hover:bg-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingOrg ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-black bg-white p-6">
            <h3 className="text-2xl font-black">Delete Organisation?</h3>
            <p className="mt-3 text-sm text-black/80">
              This permanently removes {deletingOrg.name} and all its users and tickets. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="rounded-md border border-black px-4 py-2 font-semibold hover:bg-zebra-gray"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrganisation}
                disabled={busyId === deletingOrg.id}
                className="rounded-md border border-red-800 bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {busyId === deletingOrg.id ? "Deleting..." : "Delete Organisation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PlatformOrganisationsPage;
