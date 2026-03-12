import { useState } from "react";
import { Bot, Gauge, Layers3, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import DemoRequestModal from "../components/DemoRequestModal";

const featureCards = [
  {
    icon: Bot,
    text: "AI-automated replies to frequently asked questions"
  },
  {
    icon: Workflow,
    text: "Ticket triage and priority scoring for faster handling"
  },
  {
    icon: Gauge,
    text: "Reduced response times across customer support operations"
  },
  {
    icon: Layers3,
    text: "Seamless integration-ready workflows for growing teams"
  }
];

const priorityStyles = {
  High: "text-red-700",
  Medium: "text-amber-700",
  Low: "text-emerald-700"
};

const classifyDemoRequest = (input) => {
  const text = input.toLowerCase();

  const match = (keywords) => keywords.some((keyword) => text.includes(keyword));

  if (match(["password", "reset", "login"])) {
    return {
      category: "Password Reset",
      priority: "Low",
      reply:
        "To reset your password, visit the login page and click 'Forgot Password'. A reset link will be sent to your registered email address within 2 minutes."
    };
  }

  if (match(["billing", "invoice", "payment", "charge"])) {
    return {
      category: "Billing Query",
      priority: "Medium",
      reply:
        "Our billing team processes invoices on the 1st of each month. For urgent billing queries please include your account reference number and we will prioritise your case."
    };
  }

  if (match(["crash", "down", "outage", "error", "broken"])) {
    return {
      category: "Technical Issue",
      priority: "High",
      reply:
        "We have escalated your report to our technical team. A senior engineer will review this within 1 hour. Please include any error codes or screenshots to help us resolve this faster."
    };
  }

  if (match(["account", "access", "locked", "permission"])) {
    return {
      category: "Account Access",
      priority: "Medium",
      reply:
        "Account access issues are typically resolved within 30 minutes. Please verify you are using your registered email address and that caps lock is not enabled."
    };
  }

  return {
    category: "General Enquiry",
    priority: "Low",
    reply:
      "Thank you for reaching out to ZebraSupport. Your request has been logged and a member of our support team will respond within 4 business hours."
  };
};

const HomePage = () => {
  const [demoInput, setDemoInput] = useState("");
  const [demoStage, setDemoStage] = useState("idle");
  const [demoResult, setDemoResult] = useState(null);
  const [bookDemoOpen, setBookDemoOpen] = useState(false);
  const isBusy = demoStage === "analysing" || demoStage === "typing";

  const handleDemoSubmit = async (event) => {
    event.preventDefault();
    if (!demoInput.trim()) {
      return;
    }

    setDemoStage("analysing");
    setDemoResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    setDemoStage("typing");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setDemoResult(classifyDemoRequest(demoInput));
    setDemoStage("result");
  };

  const resetDemo = () => {
    setDemoInput("");
    setDemoStage("idle");
    setDemoResult(null);
  };

  return (
    <div className="min-h-screen bg-zebra-white text-black">
      <header className="border-b border-black/20 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full border border-black zebra-stripe-bar" />
            <div>
              <p className="text-2xl font-extrabold">ZebraSupport</p>
              <p className="text-xs uppercase tracking-[0.2em] text-black/70">B2B AI Ticket Platform</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="rounded-md border border-black px-4 py-2 text-sm font-semibold hover:bg-zebra-gray">
              Login
            </Link>
            <button
              type="button"
              onClick={() => setBookDemoOpen(true)}
              className="rounded-md border border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
            >
              Book a Demo
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="zebra-stripe-bar">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="max-w-3xl rounded-2xl bg-white/95 p-10 shadow-zebra backdrop-blur">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-black/70">Strip away the chaos. Automate your support.</p>
              <h1 className="text-5xl font-black leading-tight">ZebraSupport brings speed, clarity, and AI automation to B2B support teams.</h1>
              <p className="mt-6 text-lg text-black/80">
                Reduce repetitive workload, prioritize what matters, and deliver faster responses with intelligent ticket triage and FAQ auto-replies.
              </p>
              <button
                type="button"
                onClick={() => setBookDemoOpen(true)}
                className="mt-8 inline-block rounded-md border border-black bg-black px-6 py-3 text-base font-bold text-white transition hover:bg-white hover:text-black"
              >
                Book a Demo
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-3xl font-black">Why teams choose ZebraSupport</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="zebra-card flex items-start gap-4 p-5 text-base font-semibold">
                  <div className="rounded-md border border-black bg-zebra-gray p-2">
                    <Icon size={18} />
                  </div>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-black py-14 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-black">How it works</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { title: "Submit", text: "Customer submits a support request in your queue." },
                { title: "Classify", text: "ZebraSupport classifies intent and priority instantly." },
                { title: "Auto-reply or Escalate", text: "FAQ tickets get instant AI responses. Complex cases escalate." }
              ].map((step, index) => (
                <div key={step.title} className="rounded-xl border border-white/25 bg-white/10 p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Step {index + 1}</p>
                  <h3 className="mt-2 text-2xl font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-white/85">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14">
          <div className="zebra-card p-8">
            <h2 className="text-3xl font-black">See it in action</h2>
            <p className="mt-2 text-black/70">Submit a test support request and watch ZebraSupport classify and respond instantly.</p>

            <form className="mt-6 space-y-4" onSubmit={handleDemoSubmit}>
              <textarea
                value={demoInput}
                onChange={(event) => setDemoInput(event.target.value)}
                rows={4}
                placeholder="Describe your support issue..."
                className="w-full rounded-md border border-black/30 px-4 py-3 text-sm"
              />
              <button
                type="submit"
                disabled={isBusy || !demoInput.trim()}
                className="rounded-md border border-black bg-black px-5 py-2 font-bold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit Demo Ticket
              </button>
            </form>

            {demoStage === "analysing" ? (
              <div className="mt-6 rounded-md border border-black/20 bg-zebra-gray/20 px-4 py-3 text-sm font-semibold">
                ZebraSupport is analysing your request...
              </div>
            ) : null}

            {demoStage === "typing" ? (
              <div className="mt-6 flex items-center gap-3 rounded-md border border-black/20 bg-zebra-gray/20 px-4 py-3 text-sm font-semibold">
                <span>ZebraSupport AI is typing...</span>
                <span className="typing-dots" aria-hidden="true">
                  <span className="typing-dot typing-dot-1" />
                  <span className="typing-dot typing-dot-2" />
                  <span className="typing-dot typing-dot-3" />
                </span>
              </div>
            ) : null}

            {demoResult ? (
              <div className="fade-in-up mt-6 space-y-4 rounded-xl border border-black bg-white p-6 shadow-zebra">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold uppercase tracking-[0.12em]">
                  <p>
                    Classified As: <span className="text-black">{demoResult.category}</span>
                  </p>
                  <p>
                    Priority: <span className={priorityStyles[demoResult.priority]}>{demoResult.priority}</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/60">AI Auto-Reply</p>
                  <p className="mt-2 rounded-md border border-black/20 bg-zebra-gray/15 p-4 text-sm leading-relaxed">
                    {demoResult.reply}
                  </p>
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.12em] text-black">Status: AUTO-REPLIED ✓</p>

                <div className="flex flex-wrap items-center gap-4 border-t border-black/10 pt-4">
                  <p className="font-semibold">Ready to automate your support?</p>
                  <button
                    type="button"
                    onClick={() => setBookDemoOpen(true)}
                    className="rounded-md border border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
                  >
                    Book a Demo
                  </button>
                  <button type="button" onClick={resetDemo} className="text-sm font-bold underline">
                    Try another request
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-4 rounded-2xl border border-black bg-white p-6 md:grid-cols-3">
            <div>
              <p className="text-4xl font-black">94%</p>
              <p className="text-sm uppercase tracking-[0.2em] text-black/70">FAQ auto-resolution rate</p>
            </div>
            <div>
              <p className="text-4xl font-black">&lt; 2 min</p>
              <p className="text-sm uppercase tracking-[0.2em] text-black/70">Avg first response</p>
            </div>
            <div>
              <p className="text-4xl font-black">3,000+</p>
              <p className="text-sm uppercase tracking-[0.2em] text-black/70">Tickets handled this month</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/20 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm">
          <p className="font-semibold">ZebraSupport</p>
          <div className="flex flex-wrap gap-4 text-black/70">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <a href="mailto:sales@zebrasupport.io">Sales: sales@zebrasupport.io</a>
            <button type="button" onClick={() => setBookDemoOpen(true)} className="font-semibold underline">
              Book a Demo
            </button>
          </div>
        </div>
      </footer>

      <DemoRequestModal isOpen={bookDemoOpen} onClose={() => setBookDemoOpen(false)} compact title="Book a Demo" />
    </div>
  );
};

export default HomePage;
