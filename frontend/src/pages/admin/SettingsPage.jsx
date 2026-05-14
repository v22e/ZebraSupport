import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTickets, loadDemoTickets, removeDemoTickets, resetAllTickets } from "../../api/tickets";
import {
  activateUser,
  deactivateCurrentUser,
  deactivateUser,
  fetchUsers,
  inviteUser,
  updateUserRole
} from "../../api/users";
import { updateNotificationPreference } from "../../api/notifications";
import DemoRequestModal from "../../components/DemoRequestModal";
import PlanBadge from "../../components/PlanBadge";
import UpgradeModal from "../../components/UpgradeModal";
import { useAuth } from "../../context/AuthContext";
import { getNextTierLabel } from "../../utils/plans";
import {
  canManageTargetStatus,
  canManageOrgSettings,
  formatRole,
  getRoleChangeOptions
} from "../../utils/roles";

const roleBadgeStyles = {
  org_owner: "bg-black text-white",
  org_admin: "bg-zebra-gray text-black",
  user: "bg-white border border-black text-black",
  superadmin: "bg-red-100 text-red-900"
};

const notificationToggleItems = [
  { type: "ticket_created", label: "New ticket created" },
  { type: "ticket_escalated", label: "Ticket escalated" },
  { type: "ticket_assigned", label: "Ticket assigned to me" },
  { type: "ticket_replied", label: "Ticket replied" },
  { type: "ticket_closed", label: "Ticket closed" },
  { type: "user_role_changed", label: "Role changed" },
  { type: "plan_limit_warning", label: "Plan limit warnings" }
];

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSelfDeactivateModal, setShowSelfDeactivateModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selfDeactivating, setSelfDeactivating] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [toast, setToast] = useState("");
  const [demoActive, setDemoActive] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [planMeta, setPlanMeta] = useState({ plan: user?.plan || "free", monthlyUsage: null });
  const [upgradeContext, setUpgradeContext] = useState(null);
  const [salesPlan, setSalesPlan] = useState(null);
  const [preferences, setPreferences] = useState(
    notificationToggleItems.reduce((acc, item) => ({ ...acc, [item.type]: true }), {})
  );

  const canManageUsers = canManageOrgSettings(user?.role);
  const inviteRoleOptions = useMemo(
    () => (user?.role === "org_owner" ? ["user", "org_admin"] : ["user"]),
    [user?.role]
  );

  const showSuccessToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => {
      setToast("");
    }, 3500);
  }, []);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) {
      setLoading(false);
      return;
    }

    try {
      const [usersData, ticketsData] = await Promise.all([fetchUsers(), fetchTickets()]);
      setUsers(usersData.users || []);
      setDemoActive((ticketsData.tickets || []).some((ticket) => ticket.isDemo));
      setPlanMeta({
        plan: ticketsData.meta?.plan || user?.plan || "free",
        monthlyUsage: ticketsData.meta?.monthlyUsage || null
      });
    } catch (err) {
      setError(err.message || "Failed to load settings data");
    } finally {
      setLoading(false);
    }
  }, [canManageUsers, user?.plan]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleInvite = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await inviteUser({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      setInviteRole("user");
      showSuccessToast("Invite logged to server console (stub).");
    } catch (err) {
      if (err.upgrade) {
        setUpgradeContext({
          type: "users",
          plan: err.plan || planMeta.plan,
          limit: err.limit,
          current: err.current
        });
        return;
      }
      setError(err.message || "Failed to invite user");
    }
  };

  const handleRoleChange = async (member, role) => {
    setError("");

    try {
      await updateUserRole(member.id, role);
      showSuccessToast(`Role updated to ${formatRole(role)}.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update role");
    }
  };

  const handleUserStatusToggle = async (member) => {
    setError("");
    setActionBusyId(member.id);

    try {
      if (member.active) {
        await deactivateUser(member.id);
        showSuccessToast("User deactivated successfully.");
      } else {
        await activateUser(member.id);
        showSuccessToast("User activated successfully.");
      }
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update user status");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDemoToggle = async () => {
    setDemoBusy(true);
    setError("");

    try {
      if (demoActive) {
        const data = await removeDemoTickets();
        showSuccessToast(data.message || "Demo tickets removed.");
        setDemoActive(false);
      } else {
        const data = await loadDemoTickets();
        showSuccessToast(data.message || "Demo tickets loaded.");
        setDemoActive(true);
      }
    } catch (err) {
      setError(err.message || "Failed to update demo tickets");
    } finally {
      setDemoBusy(false);
    }
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    setError("");

    try {
      const data = await resetAllTickets();
      setShowResetModal(false);
      showSuccessToast(data.message || "All tickets have been reset.");
      setDemoActive(false);
      setTimeout(() => {
        navigate("/admin/tickets");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset tickets");
    } finally {
      setResetting(false);
    }
  };

  const handleSelfDeactivate = async () => {
    setSelfDeactivating(true);
    setError("");

    try {
      await deactivateCurrentUser();
      setShowSelfDeactivateModal(false);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to deactivate your account");
    } finally {
      setSelfDeactivating(false);
    }
  };

  const handlePreferenceToggle = async (type) => {
    const enabled = !preferences[type];
    setPreferences((prev) => ({ ...prev, [type]: enabled }));
    try {
      await updateNotificationPreference({ type, enabled });
      showSuccessToast("Notification preferences saved.");
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [type]: !enabled }));
      setError(err.message || "Failed to save notification preference");
    }
  };

  if (!canManageUsers) {
    return (
      <div className="zebra-card p-6">
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="mt-3 text-black/70">You do not have permission to manage organisation settings.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-sm text-black/70">Manage users, roles, notifications, and data controls.</p>
      </div>

      <div className="zebra-card p-6">
        <h2 className="text-xl font-extrabold">Organisation</h2>
        <div className="mt-3 flex items-center gap-2">
          <p className="font-semibold">{user?.company}</p>
          <PlanBadge plan={planMeta.plan || user?.plan} />
        </div>
      </div>

      <div className="zebra-card p-6">
        <h2 className="text-xl font-extrabold">Invite User</h2>
        <form className="mt-4 flex flex-wrap gap-3" onSubmit={handleInvite}>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="min-w-[280px] flex-1 rounded-md border border-black/30 px-3 py-2"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-md border border-black/30 px-3 py-2"
          >
            {inviteRoleOptions.map((role) => (
              <option key={role} value={role}>
                {formatRole(role)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black"
          >
            Invite
          </button>
        </form>
      </div>

      <div className="zebra-card overflow-hidden">
        <div className="border-b border-black/10 px-5 py-4">
          <h2 className="text-xl font-extrabold">User Management</h2>
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
                <th className="px-4 py-3">User Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => {
                const isSelfRow = member.id === user.id;
                const canManageStatus = canManageTargetStatus(user.role, member.role, isSelfRow);
                const roleOptions = getRoleChangeOptions(user.role, member.role, isSelfRow);
                const roleChangeDisabled = !roleOptions.length;

                return (
                  <tr key={member.id} className="border-t border-black/10">
                    <td className="px-4 py-3 font-semibold">{member.name}</td>
                    <td className="px-4 py-3">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${roleBadgeStyles[member.role] || "bg-zebra-gray text-black"}`}>
                        {formatRole(member.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${member.active ? "bg-emerald-100 text-emerald-900" : "bg-zebra-gray text-black"}`}>
                        {member.active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {roleChangeDisabled ? (
                        <span className="text-xs font-semibold text-black/50" title="Role cannot be changed for this account">
                          Protected
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(event) => handleRoleChange(member, event.target.value)}
                          className="rounded-md border border-black/30 px-2 py-1"
                        >
                          {roleOptions.map((option) => (
                            <option key={option} value={option}>
                              {formatRole(option)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleUserStatusToggle(member)}
                        disabled={!canManageStatus || actionBusyId === member.id}
                        title={!canManageStatus ? "Cannot deactivate this account" : undefined}
                        className={`rounded-md border px-3 py-1 font-semibold ${
                          canManageStatus
                            ? member.active
                              ? "border-red-800 bg-red-700 text-white hover:bg-red-800"
                              : "border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800"
                            : "cursor-not-allowed border-black/20 bg-zebra-gray text-black/60"
                        }`}
                      >
                        {actionBusyId === member.id
                          ? member.active
                            ? "Deactivating..."
                            : "Activating..."
                          : isSelfRow
                            ? "Current User"
                            : !canManageStatus
                              ? "Protected"
                              : member.active
                                ? "Deactivate"
                                : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="zebra-card p-6">
        <h2 className="text-xl font-extrabold">Notification Preferences</h2>
        <p className="mt-1 text-sm text-black/70">Choose which events you want to be notified about.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {notificationToggleItems.map((item) => (
            <label key={item.type} className="flex items-center justify-between rounded-md border border-black/15 px-3 py-2">
              <span className="text-sm font-semibold">{item.label}</span>
              <button
                type="button"
                onClick={() => handlePreferenceToggle(item.type)}
                className={`h-6 w-11 rounded-full border p-0.5 transition ${preferences[item.type] ? "border-black bg-black" : "border-black/40 bg-zebra-gray"}`}
              >
                <span className={`block h-4 w-4 rounded-full bg-white transition ${preferences[item.type] ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      <section className="rounded-xl border-2 border-dashed border-red-700 bg-red-50 p-6">
        <h2 className="text-2xl font-black text-red-700">Danger Zone</h2>
        <p className="mt-2 text-sm font-medium text-red-900">These actions are irreversible. Proceed with caution.</p>

        <div className="mt-5 space-y-5">
          <div className="rounded-lg border border-red-200 bg-white/70 p-4">
            <h3 className="text-lg font-extrabold text-red-900">Demo Tickets</h3>
            <p className="mt-1 text-sm text-red-900/90">
              Load a set of demo tickets to preview how ZebraSupport looks with real data. Demo tickets are clearly labelled and can be removed at any time.
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${demoActive ? "bg-emerald-600" : "bg-gray-400"}`} />
              {demoActive ? "Demo data: active" : "Demo data: not loaded"}
            </p>
            <button
              type="button"
              onClick={handleDemoToggle}
              disabled={demoBusy}
              className={`mt-4 rounded-md border px-4 py-2 font-bold ${
                demoActive
                  ? "border-black bg-transparent text-black hover:bg-zebra-gray"
                  : "border-black bg-black text-white hover:bg-white hover:text-black"
              } disabled:opacity-60`}
            >
              {demoBusy ? "Updating..." : demoActive ? "Remove Demo Tickets" : "Load Demo Tickets"}
            </button>
          </div>

          <div className="rounded-lg border border-red-200 bg-white/70 p-4">
            <h3 className="text-lg font-extrabold text-red-900">Reset Ticket Data</h3>
            <p className="mt-1 text-sm text-red-900/90">
              Permanently deletes all tickets (including demo tickets) and resets the ticket ID counter to #1. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="mt-4 rounded-md border border-red-800 bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800"
            >
              Reset All Tickets
            </button>
          </div>

          <div className="rounded-lg border border-red-200 bg-white/70 p-4">
            <h3 className="text-lg font-extrabold text-red-900">Deactivate My Account</h3>
            <p className="mt-1 text-sm text-red-900/90">
              Disables your login. Only an owner can reactivate it. This will log you out immediately.
            </p>
            <button
              type="button"
              onClick={() => setShowSelfDeactivateModal(true)}
              className="mt-4 rounded-md border border-black bg-zinc-800 px-4 py-2 font-bold text-white hover:bg-zinc-900"
            >
              Deactivate My Account
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-md border border-red-700 bg-red-100 px-4 py-2 text-sm text-red-900">{error}</div> : null}

      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-md border border-emerald-700 bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-900 shadow-zebra">
          {toast}
        </div>
      ) : null}

      {showResetModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-black bg-white p-6">
            <h3 className="text-2xl font-black">Reset All Tickets?</h3>
            <p className="mt-3 text-sm text-black/80">
              This will permanently delete all tickets and reset the ticket counter to #1. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-md border border-black px-4 py-2 font-semibold hover:bg-zebra-gray"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetting}
                className="rounded-md border border-red-800 bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {resetting ? "Resetting..." : "Yes, Reset All Tickets"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSelfDeactivateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-black bg-white p-6">
            <h3 className="text-2xl font-black">Deactivate Your Account?</h3>
            <p className="mt-3 text-sm text-black/80">
              This will disable your login and log you out immediately. Only an org owner can reactivate it.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSelfDeactivateModal(false)}
                className="rounded-md border border-black px-4 py-2 font-semibold hover:bg-zebra-gray"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSelfDeactivate}
                disabled={selfDeactivating}
                className="rounded-md border border-black bg-zinc-800 px-4 py-2 font-bold text-white hover:bg-zinc-900 disabled:opacity-60"
              >
                {selfDeactivating ? "Deactivating..." : "Yes, Deactivate My Account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <UpgradeModal
        isOpen={Boolean(upgradeContext)}
        context={upgradeContext}
        onClose={() => setUpgradeContext(null)}
        onTalkToSales={(plan) => setSalesPlan(plan || getNextTierLabel(planMeta.plan || user?.plan))}
      />

      <DemoRequestModal
        isOpen={Boolean(salesPlan)}
        onClose={() => setSalesPlan(null)}
        interestedPlan={salesPlan || getNextTierLabel(planMeta.plan || user?.plan)}
        readOnlyPlan
        orgId={user?.orgId}
        initialValues={{
          name: user?.name || "",
          email: user?.email || "",
          company: user?.company || ""
        }}
      />
    </div>
  );
};

export default SettingsPage;

