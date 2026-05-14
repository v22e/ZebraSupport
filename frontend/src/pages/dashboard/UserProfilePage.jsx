import { useState } from "react";
import { updateNotificationPreference } from "../../api/notifications";
import { updateCurrentUser } from "../../api/users";
import { useAuth } from "../../context/AuthContext";

const notificationToggleItems = [
  { type: "ticket_created", label: "New ticket created" },
  { type: "ticket_escalated", label: "Ticket escalated" },
  { type: "ticket_assigned", label: "Ticket assigned to me" },
  { type: "ticket_replied", label: "Ticket replied" },
  { type: "ticket_closed", label: "Ticket closed" },
  { type: "user_role_changed", label: "Role changed" },
  { type: "plan_limit_warning", label: "Plan limit warnings" }
];

const UserProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState(
    notificationToggleItems.reduce((acc, item) => ({ ...acc, [item.type]: true }), {})
  );

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateCurrentUser({
        name,
        ...(newPassword ? { currentPassword, newPassword } : {})
      });
      await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceToggle = async (type) => {
    const enabled = !preferences[type];
    setPreferences((prev) => ({ ...prev, [type]: enabled }));

    try {
      await updateNotificationPreference({ type, enabled });
      setMessage("Notification preferences saved.");
      setError("");
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [type]: !enabled }));
      setError(err.message || "Failed to save notification preference");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Profile</h1>
        <p className="text-sm text-black/70">Manage your account and notification settings.</p>
      </div>

      <form className="zebra-card space-y-4 p-6" onSubmit={handleSave}>
        <h2 className="text-xl font-extrabold">Account Details</h2>

        <div>
          <label className="mb-1 block text-sm font-semibold">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-black/30 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Email</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-md border border-black/20 bg-zebra-gray/40 px-3 py-2"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-md border border-black/30 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-md border border-black/30 px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

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
    </div>
  );
};

export default UserProfilePage;
