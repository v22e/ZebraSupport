import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchTicketById, updateTicket } from "../../api/tickets";
import StatusPill from "../../components/StatusPill";

const UserTicketDetailPage = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTicketById(id);
        setTicket(data.ticket);
      } catch (err) {
        setError(err.message || "Failed to load request");
      }
    };

    load();
  }, [id]);

  const handleReply = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await updateTicket(id, { message: message.trim(), isRead: true });
      setTicket(data.ticket);
      setMessage("");
      setSuccess("Message sent.");
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSaving(false);
    }
  };

  if (!ticket && !error) {
    return <div className="zebra-card p-6 text-lg font-semibold">Loading request...</div>;
  }

  if (error) {
    return <div className="zebra-card p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-black/60">Request #{ticket.id}</p>
          <h1 className="text-3xl font-black">{ticket.subject}</h1>
        </div>
        <StatusPill status={ticket.status} />
      </div>

      <div className="zebra-card p-6">
        <p className="text-sm text-black/70">Priority</p>
        <p className="font-semibold">{ticket.priority}</p>
      </div>

      <div className="zebra-card space-y-4 p-6">
        <div className="rounded-md border border-black/20 bg-zebra-gray/20 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/60">Your Message</p>
          <p className="mt-2 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.aiReply ? (
          <div className="rounded-md border border-black bg-black p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">AI Auto-Reply</p>
            <p className="mt-2 whitespace-pre-wrap">{ticket.aiReply}</p>
          </div>
        ) : null}

        {ticket.manualReply ? (
          <div className="rounded-md border border-black/20 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/60">Support Reply</p>
            <p className="mt-2 whitespace-pre-wrap">{ticket.manualReply}</p>
          </div>
        ) : null}
      </div>

      <form className="zebra-card space-y-4 p-6" onSubmit={handleReply}>
        <h2 className="text-xl font-extrabold">Add a message</h2>
        <textarea
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Add a message..."
          className="w-full rounded-md border border-black/30 px-3 py-2"
        />

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !message.trim()}
            className="rounded-md border border-black bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black disabled:opacity-60"
          >
            {saving ? "Sending..." : "Submit Reply"}
          </button>

          <Link to="/dashboard" className="text-sm font-bold underline">
            Back to My Requests
          </Link>
        </div>

        {success ? <p className="text-sm font-semibold text-emerald-700">{success}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>
    </div>
  );
};

export default UserTicketDetailPage;
