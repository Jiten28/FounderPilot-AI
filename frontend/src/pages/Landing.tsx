import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "Health Score",
    detail: "A transparent, weighted score across runway, revenue, traction, and team.",
    color: "var(--color-success)",
  },
  {
    title: "Risk Radar",
    detail: "Your top 3 risks, ranked and explained in plain language — no jargon.",
    color: "var(--color-danger)",
  },
  {
    title: "30-Day Plan",
    detail: "A prioritized action plan you can actually execute this month.",
    color: "var(--color-primary)",
  },
  {
    title: "Ask Anything",
    detail: "A chat grounded in your own numbers — not a generic chatbot.",
    color: "var(--color-warning)",
  },
];

const STEPS = [
  { label: "Share your numbers", detail: "Revenue, expenses, users, stage — one short form." },
  { label: "Get scored instantly", detail: "A deterministic health score plus AI-generated insight." },
  { label: "Act on the plan", detail: "Risks, opportunities, KPIs, and a 30-day roadmap." },
];

export function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            Built for early-stage founders
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Your AI co-founder<br />for startup growth
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            Turn one form into a real health score, a ranked risk list, and a 30-day plan —
            a structured dashboard, not another AI chatbot.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/form"
              className="w-full rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] sm:w-auto"
            >
              Start Free Analysis →
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-full border border-[var(--border-subtle)] px-7 py-3.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-primary sm:w-auto"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">No login required · Takes about 2 minutes</p>
        </div>
      </section>

      {/* Dashboard preview strip */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:grid-cols-4">
          {[
            { label: "Health Score", value: "78", color: "var(--color-success)" },
            { label: "Risk Level", value: "Low", color: "var(--color-success)" },
            { label: "Runway", value: "14mo", color: "var(--color-primary)" },
            { label: "Funding Ready", value: "65%", color: "var(--color-warning)" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border-subtle)] p-4 text-center">
              <div className="font-display text-2xl font-semibold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
              style={{ borderTop: `3px solid ${f.color}` }}
            >
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-4xl px-6 pb-24 scroll-mt-20">
        <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">How it works</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.label} className="relative">
              <div className="font-display text-sm font-semibold text-primary">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-2 font-display text-base font-semibold">{step.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] px-8 py-14">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Know exactly where your startup stands
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-muted)]">
            Free, fast, and grounded in your real numbers — not guesses.
          </p>
          <Link
            to="/form"
            className="mt-7 inline-block rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
          >
            Start Free Analysis →
          </Link>
        </div>
      </section>
    </div>
  );
}
