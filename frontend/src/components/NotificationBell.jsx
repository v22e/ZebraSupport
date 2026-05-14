import { useEffect, useMemo, useRef, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
} from "../api/notifications";
import { useAuth } from "../context/AuthContext";

const iconMap = {
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

const iconColorMap = {
  ticket_escalated: "text-amber-600",
  ticket_closed: "text-emerald-700",
  user_deactivated: "text-red-700",
  plan_limit_warning: "text-amber-600",
  plan_limit_reached: "text-red-700",
  org_suspended: "text-red-700"
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const wrapperRef = useRef(null);

  const isOrgAdminView = user?.role === "org_owner" || user?.role === "org_admin";

  const loadNotifications = async () => {
    const data = await fetchNotifications({ limit: 20, offset: 0 });
    setItems(data.notifications || []);
    setUnreadCount(Number(data.unreadCount || 0));
  };

  const pollUnread = async () => {
    const data = await fetchUnreadNotificationCount();
    const next = Number(data.count || 0);
    setUnreadCount((prev) => {
      if (next > prev) {
        setPulse(true);
        setTimeout(() => setPulse(false), 1200);
      }
      return next;
    });
  };

  useEffect(() => {
    loadNotifications().catch(() => {});
    pollUnread().catch(() => {});

    const interval = setInterval(() => {
      pollUnread().catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unreadLabel = useMemo(() => {
    if (unreadCount > 99) return "99+";
    return unreadCount;
  }, [unreadCount]);

  const handleItemClick = async (item) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
      }
      setOpen(false);
      await loadNotifications();
      if (item.link) {
        navigate(item.link);
      }
    } catch (_error) {
      // best effort
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (_error) {
      // best effort
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={async () => {
          setOpen((prev) => !prev);
          if (!open) {
            await loadNotifications().catch(() => {});
          }
        }}
        className={`relative rounded-md border border-black/20 bg-white p-2 text-black hover:bg-zebra-gray ${pulse ? "animate-pulse" : ""}`}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-[10px] font-bold text-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[380px] max-h-[480px] overflow-hidden rounded-xl border border-black/20 bg-white shadow-zebra">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <p className="font-bold">Notifications</p>
            <button type="button" onClick={handleMarkAll} className="text-xs font-semibold text-black/70 hover:text-black">
              Mark all as read
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-3">
            {items.length === 0 ? (
              <div className="py-10 text-center text-black/60">
                <Bell className="mx-auto h-10 w-10 text-black/35" />
                <p className="mt-2 font-semibold">You're all caught up</p>
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const Icon = iconMap[item.type] || Bell;
                  const iconColor = iconColorMap[item.type] || "text-black";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full rounded-md border border-black/10 p-3 text-left transition hover:bg-zebra-gray/40 ${
                        item.isRead ? "bg-zebra-gray/25" : "border-l-[3px] border-l-black bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={17} className={iconColor} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold">{item.title}</p>
                            <p className="shrink-0 text-[11px] text-black/55">{item.relativeTime}</p>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-black/70">{item.body || ""}</p>
                        </div>
                        {!item.isRead ? <span className="mt-1 h-2 w-2 rounded-full bg-black" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isOrgAdminView ? (
            <div className="border-t border-black/10 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/notifications");
                }}
                className="text-sm font-semibold text-black/70 hover:text-black"
              >
                View all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
