import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { getMetrics, getRecommendations, ApiError } from "../api/client";
import type { AnalysisResult, MetricsResponse, RecommendationsResponse } from "../types/api";
import { ScoreCard } from "../components/dashboard/ScoreCard";
import { MetricsCharts } from "../components/dashboard/MetricsCharts";
import { InsightList } from "../components/insights/InsightList";
import { ActionPlan } from "../components/insights/ActionPlan";
import { ExpandedRecommendations } from "../components/insights/ExpandedRecommendations";
import { ChatWindow } from "../components/chat/ChatWindow";
import { RiskBadge } from "../components/RiskBadge";
import { LoadingState, ErrorBanner, DegradedNotice } from "../components/PageState";

type Tab = "dashboard" | "insights" | "chat";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "insights", label: "AI Insights" },
  { id: "chat", label: "Chat" },
];

export function Results() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const location = useLocation();
  const stateAnalysis = (location.state as { analysis?: AnalysisResult } | null)?.analysis;

  const [analysis] = useState<AnalysisResult | null>(stateAnalysis ?? null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!stateAnalysis);

  useEffect(() => {
    if (!analysisId) return;

    // The analysis itself only arrives via router state (from the intake form's
    // immediate POST /analyze response) — there's no GET /analyze/:id in the
    // contract, so a hard refresh on this page can't re-fetch it. Everything
    // else (metrics, recommendations) is safely re-fetchable by id.
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [metricsRes, recsRes] = await Promise.all([
          getMetrics(analysisId!),
          getRecommendations(analysisId!),
        ]);
        if (!cancelled) {
          setMetrics(metricsRes);
          setRecommendations(recsRes);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof ApiError ? err.message : "Couldn't load this analysis.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (!analysis) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <ErrorBanner message="We don't have this analysis in memory (likely a page refresh). Start a new one — it only takes 2 minutes." />
        <Link
          to="/form"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          Start New Analysis →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{analysis.risk_level} risk · {new Date(analysis.created_at).toLocaleDateString()}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Your FounderPilot Report</h1>
        </div>
        <RiskBadge level={analysis.risk_level} />
      </div>

      {analysis.ai_degraded && (
        <div className="mb-6">
          <DegradedNotice />
        </div>
      )}

      <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-[var(--text-muted)]">
        {analysis.business_summary}
      </p>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] p-1 sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-5 py-2 text-sm font-medium transition sm:flex-none ${
              tab === t.id
                ? "bg-primary text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ScoreCard
              label="Health Score"
              value={analysis.health_score}
              suffix="/100"
              tone={analysis.health_score >= 60 ? "success" : analysis.health_score >= 40 ? "warning" : "danger"}
            />
            <ScoreCard
              label="Runway"
              value={analysis.runway_months >= 999 ? "∞" : analysis.runway_months}
              suffix={analysis.runway_months >= 999 ? "" : "months"}
              tone="primary"
            />
            <ScoreCard
              label="Risk Score"
              value={analysis.risk_score}
              suffix="/100"
              tone={analysis.risk_level === "Low" ? "success" : analysis.risk_level === "Medium" ? "warning" : "danger"}
              caption={`${analysis.risk_level} risk`}
            />
            <ScoreCard
              label="Funding Readiness"
              value={analysis.funding_readiness_score}
              suffix="/100"
              tone={analysis.funding_readiness_score >= 60 ? "success" : "warning"}
            />
          </div>

          {loading && <LoadingState label="Loading charts..." />}
          {error && !loading && <ErrorBanner message={error} />}
          {metrics && !loading && <MetricsCharts metrics={metrics} />}
        </div>
      )}

      {tab === "insights" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <InsightList
              title="Top Risks"
              items={analysis.top_risks}
              accentColor="var(--color-danger)"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              }
            />
            <InsightList
              title="Growth Opportunities"
              items={analysis.growth_opportunities}
              accentColor="var(--color-success)"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m23 6-9.5 9.5-5-5L1 18" />
                  <path d="M17 6h6v6" />
                </svg>
              }
            />
            <InsightList
              title="Recommended KPIs"
              items={analysis.recommended_kpis}
              accentColor="var(--color-primary)"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9M13 17V5M8 17v-3" />
                </svg>
              }
            />
          </div>

          <ActionPlan items={analysis.action_plan_30_days} />

          {loading && <LoadingState label="Loading recommendations..." />}
          {recommendations && !loading && (
            <ExpandedRecommendations recommendations={recommendations.expanded_recommendations} />
          )}
        </div>
      )}

      {tab === "chat" && <ChatWindow analysis={analysis} />}
    </div>
  );
}
