import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../../api/tickets";

const UserNewRequestPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: "Medium"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createTicket({
        subject: form.subject,
        description: form.description,
        priority: form.priority
      });

      navigate("/dashboard", {
        replace: true,
        state: { toast: "Request submitted successfully." }
      });
    } catch (err) {
      setError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">New Support Request</h1>
        <p className="text-sm text-black/70">Tell us what happened and our support team will respond.</p>
      </div>

      <form className="zebra-card space-y-4 p-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-semibold">Subject</label>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Description</label>
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-md border border-black/30 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Priority</label>
          <select
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            className="rounded-md border border-black/30 px-3 py-2"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default UserNewRequestPage;
