import { useEffect, useRef, useState } from "react";
import { Clipboard, Send, Sparkles } from "lucide-react";
import { sendTicketCopilotMessage } from "../api/ai";

const starterMessage = {
  role: "model",
  content: "I can help summarize this ticket, draft a customer reply, suggest next steps, or check if it needs escalation.",
  kind: "internal_guidance"
};

const quickActions = [
  {
    label: "Summarize",
    mode: "internal",
    prompt: "Summarize this ticket in 3 bullets for the support agent."
  },
  {
    label: "Draft reply",
    mode: "customer_reply",
    prompt: "Draft a concise, professional customer reply for this ticket."
  },
  {
    label: "Next steps",
    mode: "internal",
    prompt: "Suggest the best next steps for resolving this ticket."
  },
  {
    label: "Escalation check",
    mode: "internal",
    prompt: "Should this ticket be escalated? Explain why and what to do next."
  }
];

const TicketCopilotPanel = ({ ticket, onApplyReply }) => {
  const [messages, setMessages] = useState([starterMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([starterMessage]);
    setInput("");
    setError("");
  }, [ticket?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async ({ prompt, mode = "internal" } = {}) => {
    const text = (prompt ?? input).trim();
    if (!ticket?.id || !text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const apiMessages = nextMessages.filter((message) => message.role !== "model" || message !== starterMessage);
      const data = await sendTicketCopilotMessage({
        ticketId: ticket.id,
        messages: apiMessages,
        mode
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: data.reply,
          kind: data.kind,
          canApplyToReply: data.canApplyToReply
        }
      ]);
    } catch (err) {
      setError(err.message || "Copilot could not respond right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  if (!ticket) return null;

  return (
    <aside className="zebra-card flex h-fit flex-col overflow-hidden p-0 lg:sticky lg:top-6">
      <div className="border-b border-black/10 bg-black p-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <h2 className="text-lg font-extrabold">Ticket Copilot</h2>
        </div>
        <p className="mt-1 text-xs text-white/70">
          Ticket #{ticket.id} · {ticket.priority} · {ticket.status} · {ticket.topic || "Uncategorized"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-black/10 p-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => send(action)}
            disabled={loading}
            className="rounded-full border border-black/20 px-3 py-1 text-xs font-bold transition hover:border-black hover:bg-zebra-gray disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const isDraft = message.canApplyToReply;

          return (
            <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  isUser ? "bg-black text-white" : isDraft ? "border border-emerald-800 bg-emerald-50 text-emerald-950" : "bg-zebra-gray text-black"
                }`}
              >
                {!isUser && message.kind ? (
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] opacity-60">
                    {isDraft ? "Customer draft" : "Internal guidance"}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{message.content}</p>

                {!isUser && index > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isDraft ? (
                      <button
                        type="button"
                        onClick={() => onApplyReply(message.content)}
                        className="rounded-md border border-emerald-800 bg-emerald-800 px-2 py-1 text-xs font-bold text-white hover:bg-white hover:text-emerald-900"
                      >
                        Apply to reply
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleCopy(message.content, index)}
                      className="inline-flex items-center gap-1 rounded-md border border-black/20 px-2 py-1 text-xs font-bold hover:border-black"
                    >
                      <Clipboard size={12} /> {copiedIndex === index ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {loading ? (
          <div className="rounded-xl bg-zebra-gray px-3 py-2 text-sm text-black/50">Thinking...</div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="border-t border-black/10 px-4 pt-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="flex items-center gap-2 border-t border-black/10 p-3">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Copilot about this ticket..."
          className="min-w-0 flex-1 rounded-md border border-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="rounded-md border border-black bg-black p-2 text-white transition hover:bg-white hover:text-black disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </aside>
  );
};

export default TicketCopilotPanel;
