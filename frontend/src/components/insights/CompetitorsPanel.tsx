import { useEffect, useState } from "react";
import { getCompetitors, ApiError } from "../../api/client";
import type { CompetitorAnalysisResponse } from "../../types/api";
import { cn } from "../../lib/cn";

function fmtMoney(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export function CompetitorPanel({ analysisId }: { analysisId: string }) {
  const [data, setData] = useState<CompetitorAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCompetitors(analysisId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load competitor data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18M12 3a9 9 0 0 0 0 18M3 12h18" />
        </svg>
        <h3 className="font-display text-base font-semibold">Competitor Snapshot</h3>
      </div>
      <p className="mb-5 text-xs text-[var(--text-muted)]">
        Real funding rounds from 911 actual Indian startups (2015–2017) — never invented
        companies, just the closest real ones to you.
      </p>

      {loading && (
        <div className="flex items-center gap-3 py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-primary" />
          <span className="text-sm text-[var(--text-muted)]">Finding your closest real peers...</span>
        </div>
      )}

      {error && !loading && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      {data && !loading && (
        <div className="space-y-5">
          {data.ai_degraded && (
            <p className="rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs text-[var(--text-muted)]">
              Showing a simplified positioning summary — AI narrative is temporarily limited.
            </p>
          )}

          {!data.matched ? (
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{data.positioning_summary}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-2xl font-semibold">{data.percentile_rank}th</span>
                <span className="text-xs text-[var(--text-muted)]">
                  percentile for funding raised among real {data.industry_bucket} startups
                  {data.market_stats && (
                    <>
                      {" "}
                      (median {fmtMoney(data.market_stats.median)} across {data.market_stats.n} rounds)
                    </>
                  )}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{data.positioning_summary}</p>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Closest real peers by funding
                </p>
                {data.peers.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 first:border-t-0 first:pt-0"
                  >
                    <span className="text-sm font-medium">
                      {p.name} <span className="text-xs font-normal text-[var(--text-muted)]">({p.year})</span>
                    </span>
                    <span className="text-xs tabular-nums">
                      {fmtMoney(p.amount_usd)}
                      <span
                        className={cn(
                          "ml-1.5 font-medium",
                          p.delta_usd >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                        )}
                      >
                        ({p.delta_usd >= 0 ? "+" : ""}
                        {fmtMoney(p.delta_usd)})
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {data.differentiation_tips.length > 0 && (
                <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Differentiation tips
                  </p>
                  <ul className="space-y-1.5">
                    {data.differentiation_tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--text-muted)]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-primary)]" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}