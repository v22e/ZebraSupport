import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { fetchHealthScore, fetchSummary, fetchVolume } from "../../api/analytics";

const STATUS_COLORS = ["#0a0a0a", "#4b4b4b", "#9a9a9a", "#16a34a"];

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [volume, setVolume] = useState([]);
  const [health, setHealth] = useState(87);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, volumeData, healthData] = await Promise.all([
          fetchSummary(),
          fetchVolume(),
          fetchHealthScore()
        ]);
        setSummary(summaryData);
        setVolume(volumeData.volume);
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

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  const unreadCount = Number(summary?.unread_vs_read?.unread || 0);
  const total = Number(summary?.overview?.total || 0);
  const autoRate = total ? Math.round((Number(summary?.overview?.auto_resolved || 0) / total) * 100) : 0;

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
              <BarChart
                data={[
                  { name: "Unread", value: Number(summary?.unread_vs_read?.unread || 0) },
                  { name: "Read", value: Number(summary?.unread_vs_read?.read || 0) }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0a0a0a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="zebra-card p-6">
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

      <div className="zebra-card p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-black/60">Top 5 FAQ Topics Auto-Resolved</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={summary?.top_faq_topics || []} margin={{ left: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="topic" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0a0a0a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-black/20 bg-black p-5 text-white">
        You have {unreadCount} unread tickets. Auto-resolution rate is {autoRate}%. Consider reviewing escalated tickets.
      </div>
    </div>
  );
};

export default AnalyticsPage;