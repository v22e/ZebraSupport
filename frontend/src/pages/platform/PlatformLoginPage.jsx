import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PlatformLoginPage = () => {
  const [form, setForm] = useState({
    email: "superadmin@zebrasupport.io",
    password: "SuperAdmin123!"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const loggedInUser = await login(form);
      if (loggedInUser.role !== "superadmin") {
        setError("This portal is only for ZebraSupport platform superadmin.");
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
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-xl border border-white/30 bg-white/10 p-8 backdrop-blur">
        <h1 className="text-3xl font-black">Platform Login</h1>
        <p className="mt-2 text-sm text-white/75">Sign in as ZebraSupport superadmin.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-md border border-white/40 bg-white/5 px-3 py-2"
            placeholder="Email"
          />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-md border border-white/40 bg-white/5 px-3 py-2"
            placeholder="Password"
          />

          {error ? <p className="text-sm font-semibold text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md border border-white bg-white px-4 py-2 font-bold text-black hover:bg-black hover:text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-white/70">
          Need org access?{" "}
          <Link to="/login" className="font-bold underline">
            Go to admin login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PlatformLoginPage;
