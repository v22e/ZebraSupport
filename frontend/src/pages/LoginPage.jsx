import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomeRouteByRole } from "../utils/roles";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "admin@zebrasupport.io", password: "Password123!" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const loggedInUser = await login(form);
      const fallbackPath = getHomeRouteByRole(loggedInUser.role);
      navigate(location.state?.from || fallbackPath, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="zebra-card w-full max-w-md p-8">
        <h1 className="text-3xl font-black">Welcome back</h1>
        <p className="mt-2 text-sm text-black/70">Sign in to ZebraSupport admin portal.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
            placeholder="Email"
          />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
            placeholder="Password"
          />

          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-sm text-black/70">
          Need an account?{" "}
          <Link to="/register" className="font-bold text-black underline">
            Request a demo
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
