import { useEffect, useState } from "react";
import { whatIf, ApiError } from "../../api/client";
import type { AnalysisResult, WhatIfResponse } from "../../types/api";
import { cn } from "../../lib/cn";

function fmtMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

function Delta({ current, original }: { current: number; original: number }) {
  const diff = current - original;
  if (diff === 0) return null;
  const up = diff > 0;
  return (
    <span className={cn("ml-1.5 text-xs font-medium", up ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>
      {up ? "+" : ""}
      {diff}
    </span>
  );
}

export function WhatIfSliders({ analysis }: { analysis: AnalysisResult }) {
  const original = analysis.original_input;
  const [revenue, setRevenue] = useState(original.revenue);
  const [expenses, setExpenses] = useState(original.expenses);
  const [employees, setEmployees] = useState(original.employees);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdited = revenue !== original.revenue || expenses !== original.expenses || employees !== original.employees;

  // Debounced re-score: fires ~350ms after the last slider move, not on every
  // pixel of drag — keeps this cheap even though it's a real network call.
  useEffect(() => {
    if (!isEdited) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await whatIf({ ...original, revenue, expenses, employees });
        setResult(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't recompute — try again.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenue, expenses, employees]);

  function reset() {
    setRevenue(original.revenue);
    setExpenses(original.expenses);
    setEmployees(original.employees);
    setResult(null);
  }

  const displayHealth = result?.health_score ?? analysis.health_score;
  const displayRunway = result?.runway_months ?? analysis.runway_months;
  const displayFunding = result?.funding_readiness_score ?? analysis.funding_readiness_score;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
            <path d="M4 21V14M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </svg>
          <h3 className="font-display text-base font-semibold">What if?</h3>
        </div>
        {isEdited && (
          <button onClick={reset} className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-primary)]">
            Reset
          </button>
        )}
      </div>
      <p className="mb-5 text-xs text-[var(--text-muted)]">
        Drag to see how a hire, a cut, or new revenue would move your score — instantly, no AI call needed.
      </p>

      <div className="space-y-5">
        <SliderField
          label="Monthly revenue"
          value={revenue}
          display={fmtMoney(revenue)}
          min={0}
          max={Math.max(original.revenue * 3, 20000)}
          step={500}
          onChange={setRevenue}
        />
        <SliderField
          label="Monthly expenses"
          value={expenses}
          display={fmtMoney(expenses)}
          min={0}
          max={Math.max(original.expenses * 3, 20000)}
          step={500}
          onChange={setExpenses}
        />
        <SliderField
          label="Employees"
          value={employees}
          display={String(employees)}
          min={1}
          max={Math.max(original.employees + 10, 15)}
          step={1}
          onChange={setEmployees}
        />
      </div>

      {error && <p className="mt-4 text-xs text-[var(--color-danger)]">{error}</p>}

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--border-subtle)] pt-5">
        <MiniStat label="Health" value={displayHealth} suffix="/100" loading={loading}>
          {result && <Delta current={displayHealth} original={analysis.health_score} />}
        </MiniStat>
        <MiniStat
          label="Runway"
          value={displayRunway >= 999 ? "∞" : displayRunway}
          suffix={displayRunway >= 999 ? "" : "mo"}
          loading={loading}
        />
        <MiniStat label="Funding readiness" value={displayFunding} suffix="/100" loading={loading}>
          {result && <Delta current={displayFunding} original={analysis.funding_readiness_score} />}
        </MiniStat>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-medium tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

function MiniStat({
  label,
  value,
  suffix,
  loading,
  children,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  loading: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl bg-[var(--surface-raised)] p-3 text-center transition-opacity", loading && "opacity-60")}>
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="font-display text-lg font-semibold tabular-nums">
        {value}
        {suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}
        {children}
      </p>
    </div>
  );
}
