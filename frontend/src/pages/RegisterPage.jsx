import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(form);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="zebra-card w-full max-w-lg p-8">
        <h1 className="text-3xl font-black">Request your ZebraSupport demo</h1>
        <p className="mt-2 text-sm text-black/70">Create your admin account to enter the dashboard.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
            placeholder="Full name"
          />
          <input
            type="text"
            required
            value={form.company}
            onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
            placeholder="Company"
          />
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
            placeholder="Work email"
          />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
            placeholder="Password"
          />
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
            placeholder="Confirm password"
          />

          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-sm text-black/70">
          Already have access?{" "}
          <Link to="/login" className="font-bold text-black underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;