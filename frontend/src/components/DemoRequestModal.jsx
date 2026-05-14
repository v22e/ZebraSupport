import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createDemoRequest } from "../api/demoRequests";

const emptyForm = {
  name: "",
  email: "",
  company: "",
  phone: "",
  message: ""
};

const DemoRequestModal = ({
  isOpen,
  onClose,
  interestedPlan = null,
  readOnlyPlan = false,
  initialValues = {},
  orgId = null,
  title = "Talk to Our Team",
  compact = false
}) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...emptyForm, ...initialValues });
    setSubmitting(false);
    setError("");
    setSent(false);
  }, [isOpen, initialValues]);

  const selectedPlan = useMemo(() => (interestedPlan ? String(interestedPlan).toLowerCase() : null), [interestedPlan]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Full name and work email are required.");
      return;
    }

    setSubmitting(true);

    try {
      await createDemoRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
        interestedPlan: selectedPlan || undefined,
        orgId: orgId || undefined
      });
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-black bg-white p-6">
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-black" />
            <h3 className="mt-3 text-3xl font-black">Request Sent!</h3>
            <p className="mt-3 text-sm text-black/70">
              Thanks {form.name}, we will be in touch at {form.email} within 1 business day.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-md border border-black bg-black px-5 py-2 font-bold text-white hover:bg-white hover:text-black"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-black">{title}</h3>
            <p className="mt-2 text-sm text-black/75">
              {selectedPlan
                ? `Interested in upgrading to ${selectedPlan.toUpperCase()}? Our team will walk you through everything ZebraSupport has to offer and set up your account personally.`
                : "Our team will walk you through everything ZebraSupport has to offer and set up your account personally."}
            </p>
            <p className="mt-2 text-sm text-black/75">Fill in your details below and we will be in touch within 1 business day.</p>

            <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
              <input
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Full Name"
                className="rounded-md border border-black/30 px-3 py-2"
              />
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Work Email"
                className="rounded-md border border-black/30 px-3 py-2"
              />
              <input
                type="text"
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                placeholder="Company Name"
                className="rounded-md border border-black/30 px-3 py-2"
              />

              {!compact ? (
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+44 7700 900000"
                  className="rounded-md border border-black/30 px-3 py-2"
                />
              ) : null}

              <textarea
                rows={compact ? 3 : 4}
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Message (optional)"
                className="rounded-md border border-black/30 px-3 py-2"
              />

              {selectedPlan ? (
                <div className="rounded-md border border-black/20 bg-zebra-gray/20 px-3 py-2 text-sm">
                  Interested Plan: <span className="font-bold uppercase">{selectedPlan}</span>
                </div>
              ) : null}

              {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-black px-4 py-2 font-semibold hover:bg-zebra-gray"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DemoRequestModal;
