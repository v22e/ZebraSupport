import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Link } from "react-router-dom";
import { fetchHealthScore, fetchSummary, fetchVolume } from "../../api/analytics";
import { useAuth } from "../../context/AuthContext";
import { canViewOrgAnalytics } from "../../utils/roles";

const STATUS_COLORS = ["#0a0a0a", "#4b4b4b", "#9a9a9a", "#16a34a"];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [volume, setVolume] = useState([]);
  const [health, setHealth] = useState(87);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [volumeLocked, setVolumeLocked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, volumeData, healthData] = await Promise.all([
          fetchSummary(),
          fetchVolume(),
          fetchHealthScore()
        ]);

        setSummary(summaryData);
        setVolume(volumeData.volume || []);
        setVolumeLocked(Boolean(volumeData.locked));
        setHealth(healthData.healthScore);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const ringData = useMemo(
    () => [
      { name: "Score", value: health },
      { name: "Remaining", value: 100 - health }
    ],
    [health]
  );

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading analytics...</div>;
  }

  if (!canViewOrgAnalytics(user?.role)) {
    return (
      <div className="zebra-card p-6">
        <h1 className="text-2xl font-black">Analytics</h1>
        <p className="mt-3 text-black/70">Users do not have access to analytics.</p>
      </div>
    );
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  const unreadCount = Number(summary?.unread_vs_read?.unread || 0);
  const readCount = Number(summary?.unread_vs_read?.read || 0);
  const total = Number(summary?.overview?.total || 0);
  const autoRate = total ? Math.round((Number(summary?.overview?.auto_resolved || 0) / total) * 100) : 0;
  const isFree = summary?.meta?.plan === "free";

  if (total === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">Analytics</h1>
          <p className="text-sm text-black/70">Measure ticket trends, resolution quality, and team focus.</p>
        </div>

        <div className="zebra-card p-10 text-center">
          <h2 className="text-2xl font-black">No analytics yet</h2>
          <p className="mt-3 text-black/70">
            Your organisation has no ticket data yet. Once tickets arrive, analytics and health metrics will appear here.
          </p>
        </div>
      </div>
    );
  }

  const unreadReadData = [
    { name: "Unread", value: unreadCount, fill: "#0a0a0a" },
    { name: "Read", value: readCount, fill: "#d6d6d6" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Analytics</h1>
        <p className="text-sm text-black/70">Measure ticket trends, resolution quality, and team focus.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="zebra-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-black/60">Support Health Score</p>
          <div className="mt-3 flex items-center gap-6">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ringData} dataKey="value" innerRadius={52} outerRadius={74} startAngle={90} endAngle={-270}>
                    <Cell fill="#0a0a0a" />
                    <Cell fill="#e5e5e5" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-6xl font-black">{health}%</p>
              <p className="text-sm text-black/70">(Auto-resolved + Closed) / Total * 100</p>
            </div>
          </div>
        </div>

        <div className="zebra-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-black/60">Unread vs Read Tickets</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unreadReadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {unreadReadData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="relative zebra-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-black/60">Ticket Volume - Last 7 Days</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#0a0a0a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {isFree || volumeLocked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/75 p-5 text-center backdrop-blur-[1px]">
              <p className="text-sm font-bold">Unlock full analytics - upgrade to Plus or Pro</p>
              <Link
                to="/admin/billing"
                className="mt-3 rounded-md border border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
              >
                Upgrade Plan
              </Link>
            </div>
          ) : null}
        </div>

        <div className="zebra-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-black/60">Ticket Status Breakdown</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.status_breakdown || []}
                  dataKey="value"
                  nameKey="status"
                  outerRadius={92}
                  label={(entry) => `${entry.status}: ${entry.value}`}
                >
                  {(summary?.status_breakdown || []).map((entry, index) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="relative zebra-card p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-black/60">Top 5 FAQ Topics Auto-Resolved</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={summary?.top_faq_topics || []} margin={{ left: 25, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="topic" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0a0a0a" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="count" position="right" fill="#0a0a0a" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {isFree ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/75 p-5 text-center backdrop-blur-[1px]">
            <p className="text-sm font-bold">Unlock full analytics - upgrade to Plus or Pro</p>
            <Link
              to="/admin/billing"
              className="mt-3 rounded-md border border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
            >
              Upgrade Plan
            </Link>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-black/20 bg-black p-5 text-white">
        You have {unreadCount} unread tickets. Auto-resolution rate is {autoRate}%. Consider reviewing escalated tickets.
      </div>
    </div>
  );
};

export default AnalyticsPage;

