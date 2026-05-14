import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SuperadminLoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
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
      if (loggedInUser.role !== "superadmin") {
        setError("This portal is restricted to platform administrators only.");
        return;
      }
      navigate(location.state?.from || "/platform/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-white/30 zebra-stripe-bar" />
          <div>
            <p className="text-xl font-extrabold tracking-tight text-white">ZebraSupport Platform Admin</p>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Internal Access Only</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Platform Administration Access</span>
          </div>

          <h1 className="text-2xl font-black text-white">Sign in</h1>
          <p className="mt-1 text-sm text-white/50">
            This login is for ZebraSupport platform administrators only. Org accounts use the{" "}
            <Link to="/login" className="text-white/80 underline">
              admin login
            </Link>
            .
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/30 focus:border-white/50 focus:outline-none"
              placeholder="Platform admin email"
            />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/30 focus:border-white/50 focus:outline-none"
              placeholder="Password"
            />

            {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md border border-white bg-white px-4 py-2 font-bold text-black transition hover:bg-transparent hover:text-white disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in to Platform"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          Org admin?{" "}
          <Link to="/login" className="text-white/50 underline">
            Go to admin login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SuperadminLoginPage;
