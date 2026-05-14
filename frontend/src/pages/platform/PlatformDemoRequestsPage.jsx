import { Fragment, useEffect, useState } from "react";
import { fetchPlatformDemoRequests, updatePlatformDemoRequestStatus } from "../../api/platform";

const statusOptions = ["new", "contacted", "converted", "closed"];

const PlatformDemoRequestsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const data = await fetchPlatformDemoRequests();
      setRows(data.demoRequests || []);
    } catch (err) {
      setError(err.message || "Failed to load demo requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading demo requests...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Demo Requests</h1>
        <p className="text-sm text-black/70">Track inbound sales interest across the platform.</p>
      </div>

      {error ? <div className="rounded-md border border-red-700 bg-red-100 px-4 py-2 text-sm text-red-900">{error}</div> : null}

      <div className="zebra-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Interested Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((request) => (
              <Fragment key={request.id}>
                <tr className="border-t border-black/10">
                  <td className="px-4 py-3 font-semibold">#{request.id}</td>
                  <td className="px-4 py-3">{request.name}</td>
                  <td className="px-4 py-3">{request.email}</td>
                  <td className="px-4 py-3">{request.company || "-"}</td>
                  <td className="px-4 py-3 uppercase">{request.interestedPlan || "-"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={request.status}
                      onChange={async (event) => {
                        await updatePlatformDemoRequestStatus(request.id, event.target.value);
                        await load();
                      }}
                      className="rounded-md border border-black/30 px-2 py-1"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{new Date(request.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => (prev === request.id ? null : request.id))}
                      className="rounded-md border border-black px-3 py-1 font-semibold"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
                {expanded === request.id ? (
                  <tr className="border-t border-black/10 bg-zebra-gray/20">
                    <td colSpan={8} className="px-4 py-3 text-sm">
                      <p><span className="font-semibold">Phone:</span> {request.phone || "-"}</p>
                      <p className="mt-1 whitespace-pre-wrap"><span className="font-semibold">Message:</span> {request.message || "-"}</p>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlatformDemoRequestsPage;
