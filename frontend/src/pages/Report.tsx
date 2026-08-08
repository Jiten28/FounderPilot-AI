import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getAnalysis, ApiError } from "../api/client";
import type { AnalysisResult } from "../types/api";
import { LoadingState, ErrorBanner } from "../components/PageState";

export function Report() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const location = useLocation();
  const stateAnalysis = (location.state as { analysis?: AnalysisResult } | null)?.analysis;

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(stateAnalysis ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!stateAnalysis);

  useEffect(() => {
    if (stateAnalysis || !analysisId) return;
    let cancelled = false;
    getAnalysis(analysisId)
      .then((res) => !cancelled && setAnalysis(res))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Couldn't load this report."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [analysisId, stateAnalysis]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 print:hidden">
        <LoadingState label="Preparing your report..." />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 print:hidden">
        <ErrorBanner message={error ?? "We couldn't find this analysis."} />
        <Link to="/form" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white">
          Start New Analysis →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Screen-only controls — hidden entirely when printing */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link to={`/results/${analysis.analysis_id}`} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          ← Back to dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          Download as PDF
        </button>
      </div>

      {/* ============ PRINTABLE REPORT — fixed layout, dynamic content ============ */}
      <div id="report-sheet" className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-12">
        {/* Header / letterhead */}
        <div className="mb-8 flex items-center justify-between border-b border-[var(--border-subtle)] pb-6 print:border-black/15">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white print:bg-black">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M9 22 L16 9 L23 22" stroke="white" strokeWidth="2.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx="16" cy="16.5" r="2.2" fill="#00D9A3" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              FounderPilot <span className="text-primary print:text-black">AI</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] print:text-black/60">
            Generated {new Date(analysis.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <h1 className="font-display text-2xl font-bold">{analysis.original_input.startup_name}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)] print:text-black/60">
          {analysis.original_input.industry} · {analysis.original_input.stage} stage
        </p>

        {/* Score summary strip */}
        <div className="my-8 grid grid-cols-4 gap-3 text-center">
          <ReportStat label="Health" value={`${analysis.health_score}/100`} />
          <ReportStat label="Risk" value={analysis.risk_level} />
          <ReportStat label="Runway" value={analysis.runway_months >= 999 ? "∞" : `${analysis.runway_months} mo`} />
          <ReportStat label="Funding Ready" value={`${analysis.funding_readiness_score}/100`} />
        </div>

        <ReportSection title="Summary">
          <p className="text-sm leading-relaxed">{analysis.business_summary}</p>
        </ReportSection>

        <ReportSection title="Top Risks">
          <ul className="space-y-1.5 text-sm">
            {analysis.top_risks.map((r, i) => (
              <li key={i}>— {r}</li>
            ))}
          </ul>
        </ReportSection>

        <ReportSection title="Growth Opportunities">
          <ul className="space-y-1.5 text-sm">
            {analysis.growth_opportunities.map((g, i) => (
              <li key={i}>— {g}</li>
            ))}
          </ul>
        </ReportSection>

        {analysis.benchmarks.length > 0 && (
          <ReportSection title="How You Compare">
            <ul className="space-y-2 text-sm">
              {analysis.benchmarks.map((b) => (
                <li key={b.metric}>
                  <span className="font-medium">{b.metric}:</span> {b.comparison}
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        <ReportSection title="30-Day Action Plan">
          <ul className="space-y-1.5 text-sm">
            {analysis.action_plan_30_days.map((item, i) => (
              <li key={i}>
                <span className="font-medium">[{item.priority}]</span> {item.task}
              </li>
            ))}
          </ul>
        </ReportSection>

        <p className="mt-10 border-t border-[var(--border-subtle)] pt-4 text-[10px] text-[var(--text-muted)] print:border-black/15 print:text-black/50">
          Generated by FounderPilot AI. Figures are directional, based on founder-provided
          inputs and stage-typical benchmarks — not financial or investment advice.
        </p>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-raised)] p-3 print:bg-black/[0.03]">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] print:text-black/50">{label}</p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 break-inside-avoid">
      <h2 className="font-display mb-2 text-sm font-semibold uppercase tracking-wide text-primary print:text-black">
        {title}
      </h2>
      {children}
    </div>
  );
}
