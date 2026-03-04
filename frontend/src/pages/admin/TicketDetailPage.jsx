import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchTicketById, updateTicket } from "../../api/tickets";
import StatusPill from "../../components/StatusPill";

const statusOptions = ["Open", "Escalated", "Closed", "Auto-Replied"];

const TicketDetailPage = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [manualReply, setManualReply] = useState("");
  const [status, setStatus] = useState("Open");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTicketById(id);
        setTicket(data.ticket);
        setManualReply(data.ticket.manualReply || "");
        setStatus(data.ticket.status || "Open");
      } catch (err) {
        setError(err.message || "Failed to load ticket");
      }
    };

    load();
  }, [id]);

  const canSave = useMemo(() => Boolean(ticket), [ticket]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!ticket) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = { status, isRead: true };
      if (manualReply.trim()) {
        payload.manualReply = manualReply.trim();
      }
      const data = await updateTicket(id, payload);
      setTicket(data.ticket);
      setMessage("Ticket updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  if (!ticket && !error) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading ticket...</div>;
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-black/60">Ticket #{ticket.id}</p>
          <h1 className="text-3xl font-black">{ticket.subject}</h1>
        </div>
        <StatusPill status={ticket.status} />
      </div>

      <div className="zebra-card p-6">
        <p className="text-sm text-black/70">Requester</p>
        <p className="font-semibold">{ticket.requesterName} ({ticket.requesterEmail})</p>
        <p className="mt-2 text-sm text-black/70">Company</p>
        <p className="font-semibold">{ticket.company}</p>
        <p className="mt-2 text-sm text-black/70">Priority</p>
        <p className="font-semibold">{ticket.priority}</p>
      </div>

      <div className="zebra-card p-6">
        <h2 className="text-xl font-extrabold">Ticket Thread</h2>

        <div className="mt-4 rounded-lg border border-black/20 bg-zebra-gray/25 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-black/60">Customer Message</p>
          <p className="mt-2 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.aiReply ? (
          <div className="mt-4 rounded-lg border border-black bg-black p-4 text-white">
            <p className="text-xs uppercase tracking-[0.15em] text-white/70">AI Auto-Reply</p>
            <p className="mt-2 whitespace-pre-wrap">{ticket.aiReply}</p>
          </div>
        ) : null}

        {ticket.manualReply ? (
          <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-emerald-700">Admin Reply</p>
            <p className="mt-2 whitespace-pre-wrap text-emerald-900">{ticket.manualReply}</p>
          </div>
        ) : null}
      </div>

      <form className="zebra-card space-y-4 p-6" onSubmit={handleSave}>
        <h2 className="text-xl font-extrabold">Respond & Update Status</h2>

        <textarea
          value={manualReply}
          onChange={(e) => setManualReply(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-black/30 px-3 py-2"
          placeholder="Write a manual response..."
        />

        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-black/30 px-3 py-2"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!canSave || saving}
            className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <Link to="/admin/tickets" className="text-sm font-bold underline">
            Back to Tickets
          </Link>
        </div>

        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>
    </div>
  );
};

export default TicketDetailPage;