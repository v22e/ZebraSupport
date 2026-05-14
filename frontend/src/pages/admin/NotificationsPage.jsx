import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  Lock,
  MessageSquare,
  Shield,
  UserCheck,
  UserPlus,
  UserX,
  XCircle,
  Zap
} from "lucide-react";
import {
  deleteNotification,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../../api/notifications";

const typeOptions = [
  "all",
  "ticket_created",
  "ticket_replied",
  "ticket_escalated",
  "ticket_assigned",
  "ticket_closed",
  "ticket_auto_replied",
  "user_invited",
  "user_role_changed",
  "user_deactivated",
  "plan_limit_warning",
  "plan_limit_reached",
  "demo_request_received",
  "new_org_registered",
  "org_suspended"
];

const typeIcons = {
  ticket_created: FileText,
  ticket_replied: MessageSquare,
  ticket_escalated: AlertTriangle,
  ticket_assigned: UserCheck,
  ticket_closed: CheckCircle,
  ticket_auto_replied: Zap,
  user_invited: UserPlus,
  user_role_changed: Shield,
  user_deactivated: UserX,
  plan_limit_warning: AlertCircle,
  plan_limit_reached: XCircle,
  demo_request_received: Calendar,
  new_org_registered: Building,
  org_suspended: Lock
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchNotifications({ limit: 100, offset: 0 });
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      const readMatch =
        statusFilter === "all" ||
        (statusFilter === "read" && item.isRead) ||
        (statusFilter === "unread" && !item.isRead);
      const typeMatch = typeFilter === "all" || item.type === typeFilter;
      return readMatch && typeMatch;
    });
  }, [notifications, statusFilter, typeFilter]);

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((item) => item.id));
    }
  };

  const toggleSelected = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const markSelectedRead = async () => {
    await Promise.all(selected.map((id) => markNotificationRead(id).catch(() => null)));
    setSelected([]);
    await load();
  };

  const deleteSelected = async () => {
    await Promise.all(selected.map((id) => deleteNotification(id).catch(() => null)));
    setSelected([]);
    await load();
  };

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading notifications...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Notifications</h1>
        <p className="text-sm text-black/70">Track activity and updates across your organisation.</p>
      </div>

      {error ? <div className="rounded-md border border-red-700 bg-red-100 px-4 py-2 text-sm text-red-900">{error}</div> : null}

      <div className="zebra-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 font-semibold ${statusFilter === "all" ? "bg-black text-white" : "border-black"}`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 font-semibold ${statusFilter === "unread" ? "bg-black text-white" : "border-black"}`}
              onClick={() => setStatusFilter("unread")}
            >
              Unread
            </button>
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 font-semibold ${statusFilter === "read" ? "bg-black text-white" : "border-black"}`}
              onClick={() => setStatusFilter("read")}
            >
              Read
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-md border border-black/30 px-3 py-2 text-sm"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "All types" : type}
              </option>
            ))}
          </select>

          <button type="button" onClick={markAllNotificationsRead} className="text-sm font-semibold underline">
            Mark all as read
          </button>
        </div>
      </div>

      <div className="zebra-card overflow-x-auto">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleSelectAll} />
            Select all
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={markSelectedRead}
              disabled={!selected.length}
              className="rounded-md border border-black px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark selected as read
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selected.length}
              className="rounded-md border border-red-800 bg-red-700 px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete selected
            </button>
          </div>
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-zebra-gray/50 text-left uppercase tracking-[0.1em]">
            <tr>
              <th className="px-4 py-3" />
              <th className="px-4 py-3">Icon + Type</th>
              <th className="px-4 py-3">Title + Body</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-black/10">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-semibold">
                    {(typeIcons[item.type] ? (() => {
                      const Icon = typeIcons[item.type];
                      return <Icon size={16} />;
                    })() : <Bell size={16} />)}
                    {item.type}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-black/70">{item.body}</p>
                </td>
                <td className="px-4 py-3">{item.relativeTime}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${item.isRead ? "bg-zebra-gray text-black" : "bg-black text-white"}`}>
                    {item.isRead ? "Read" : "Unread"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await markNotificationRead(item.id);
                          await load();
                        }}
                        className="rounded-md border border-black px-2 py-1 text-xs font-semibold"
                      >
                        Mark as read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteNotification(item.id);
                        await load();
                      }}
                      className="rounded-md border border-red-800 bg-red-700 px-2 py-1 text-xs font-semibold text-white"
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
    </div>
  );
};

export default NotificationsPage;
