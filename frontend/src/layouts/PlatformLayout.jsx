import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/platform/dashboard", label: "Dashboard" },
  { to: "/platform/organisations", label: "Organisations" },
  { to: "/platform/demo-requests", label: "Demo Requests" }
];

const PlatformLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/platform/login");
  };

  return (
    <div className="min-h-screen bg-zebra-white text-black">
      <header className="border-b border-black/20 bg-black text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/platform/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-white zebra-stripe-bar" />
            <div>
              <p className="text-xl font-extrabold tracking-tight">ZebraSupport Platform</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Superadmin Console</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-xs text-white/70">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-white bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-transparent hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 md:grid-cols-[220px_1fr]">
        <aside className="zebra-card h-fit p-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-black text-white" : "text-black hover:bg-zebra-gray"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
