import type { BenchmarkComparison } from "../../types/api";

export function BenchmarkPanel({ benchmarks }: { benchmarks: BenchmarkComparison[] }) {
  if (benchmarks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
          <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />
        </svg>
        <h3 className="font-display text-base font-semibold">How you compare</h3>
      </div>
      <p className="mb-5 text-xs text-[var(--text-muted)]">
        Your numbers against typical ranges for your stage — ballpark figures, not
        investment-grade research, but a useful reality check.
      </p>
      <div className="space-y-4">
        {benchmarks.map((b) => (
          <div key={b.metric} className="border-t border-[var(--border-subtle)] pt-4 first:border-t-0 first:pt-0">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-sm font-medium">{b.metric}</span>
              <span className="text-xs text-[var(--text-muted)]">
                You: <span className="font-medium text-[var(--text-primary)]">{b.your_value}</span>
                {" · "}Typical: {b.benchmark_value}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{b.comparison}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
