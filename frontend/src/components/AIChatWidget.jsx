import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { sendChatMessage } from "../api/ai";

const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", content: "Hi! I'm the ZebraSupport assistant. Ask me anything about the platform." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = updated.filter((m, i) => !(i === 0 && m.role === "model"));
      const data = await sendChatMessage(apiMessages);
      setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Sorry, I couldn't connect right now. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex w-80 flex-col rounded-2xl border border-black bg-white shadow-zebra md:w-96">
          <div className="flex items-center justify-between rounded-t-2xl border-b border-black/10 bg-black px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">ZebraSupport Assistant</p>
              <p className="text-xs text-white/60">Ask me anything about the platform</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto p-4" style={{ maxHeight: "360px" }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-black text-white" : "bg-zebra-gray text-black"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-zebra-gray px-3 py-2 text-sm text-black/50">Typing...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-black/10 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 rounded-md border border-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || loading}
              className="rounded-md border border-black bg-black p-2 text-white transition hover:bg-white hover:text-black disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-black bg-black text-white shadow-zebra transition hover:bg-white hover:text-black"
        aria-label="Open AI assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
};

export default AIChatWidget;
