import { Link } from "react-router-dom";

const HomePage = () => {
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
            <Link to="/register" className="rounded-md border border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black">
              Request a Demo
            </Link>
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
              <Link
                to="/register"
                className="mt-8 inline-block rounded-md border border-black bg-black px-6 py-3 text-base font-bold text-white transition hover:bg-white hover:text-black"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-3xl font-black">Why teams choose ZebraSupport</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              "AI-automated replies to frequently asked questions",
              "Ticket triage and priority scoring for faster handling",
              "Reduced response times across customer support operations",
              "Seamless integration-ready workflows for growing teams"
            ].map((item) => (
              <div key={item} className="zebra-card p-5 text-base font-semibold">
                {item}
              </div>
            ))}
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
          <div className="flex gap-4 text-black/70">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Request Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;