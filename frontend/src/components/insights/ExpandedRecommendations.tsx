import type { ExpandedRecommendation } from "../../types/api";
import { RiskBadge } from "../RiskBadge";

export function ExpandedRecommendations({
  recommendations,
}: {
  recommendations: ExpandedRecommendation[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="animate-fade-slide-in rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <h3 className="mb-4 font-display text-sm font-semibold">Deeper Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4"
          >
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <h4 className="text-sm font-medium">{rec.title}</h4>
              <RiskBadge level={rec.impact} className="shrink-0" />
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{rec.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
