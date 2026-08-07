import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeStartup, ApiError } from "../api/client";
import type { StartupInput, Stage } from "../types/api";
import { ErrorBanner, LoadingState } from "../components/PageState";

const STAGES: Stage[] = ["Pre-seed", "Seed", "Series A", "Growth"];

type FormState = {
  startup_name: string;
  industry: string;
  revenue: string;
  expenses: string;
  employees: string;
  monthly_users: string;
  stage: Stage;
  funding_raised: string;
  problem_faced: string;
};

const INITIAL_STATE: FormState = {
  startup_name: "",
  industry: "",
  revenue: "",
  expenses: "",
  employees: "",
  monthly_users: "",
  stage: "Pre-seed",
  funding_raised: "",
  problem_faced: "",
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-primary";

export function IntakeForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.startup_name.trim()) next.startup_name = "Required";
    if (!form.industry.trim()) next.industry = "Required";
    if (form.revenue === "" || Number(form.revenue) < 0) next.revenue = "Enter a valid amount";
    if (form.expenses === "" || Number(form.expenses) < 0) next.expenses = "Enter a valid amount";
    if (form.employees === "" || Number(form.employees) < 1) next.employees = "Must be at least 1";
    if (form.monthly_users === "" || Number(form.monthly_users) < 0) next.monthly_users = "Enter a valid number";
    if (form.funding_raised === "" || Number(form.funding_raised) < 0) next.funding_raised = "Enter a valid amount";
    if (!form.problem_faced.trim()) next.problem_faced = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    const payload: StartupInput = {
      startup_name: form.startup_name.trim(),
      industry: form.industry.trim(),
      revenue: Number(form.revenue),
      expenses: Number(form.expenses),
      employees: Number(form.employees),
      monthly_users: Number(form.monthly_users),
      stage: form.stage,
      funding_raised: Number(form.funding_raised),
      problem_faced: form.problem_faced.trim(),
    };

    setSubmitting(true);
    try {
      const result = await analyzeStartup(payload);
      navigate(`/results/${result.analysis_id}`, { state: { analysis: result } });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong analyzing your startup.";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitting) {
    return <LoadingState label="Analyzing your startup — this can take a few seconds..." />;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Tell us about your startup</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Every field feeds directly into your health score and AI insights — no guessing.
      </p>

      {apiError && (
        <div className="mt-6">
          <ErrorBanner message={apiError} onRetry={() => setApiError(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Startup name" required>
            <input
              className={inputClass}
              value={form.startup_name}
              onChange={(e) => update("startup_name", e.target.value)}
              placeholder="e.g. Northwind Labs"
            />
            {errors.startup_name && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.startup_name}</p>}
          </Field>

          <Field label="Industry" required>
            <input
              className={inputClass}
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="e.g. Fintech, SaaS, D2C"
            />
            {errors.industry && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.industry}</p>}
          </Field>
        </div>

        <Field label="Stage" required>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAGES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => update("stage", s)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  form.stage === s
                    ? "border-primary bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Monthly revenue (USD)" required>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.revenue}
              onChange={(e) => update("revenue", e.target.value)}
              placeholder="12000"
            />
            {errors.revenue && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.revenue}</p>}
          </Field>

          <Field label="Monthly expenses (USD)" required>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.expenses}
              onChange={(e) => update("expenses", e.target.value)}
              placeholder="9000"
            />
            {errors.expenses && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.expenses}</p>}
          </Field>

          <Field label="Team size" required>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.employees}
              onChange={(e) => update("employees", e.target.value)}
              placeholder="4"
            />
            {errors.employees && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.employees}</p>}
          </Field>

          <Field label="Monthly active users" required>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.monthly_users}
              onChange={(e) => update("monthly_users", e.target.value)}
              placeholder="3200"
            />
            {errors.monthly_users && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.monthly_users}</p>}
          </Field>

          <Field label="Total funding raised (USD)" required>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.funding_raised}
              onChange={(e) => update("funding_raised", e.target.value)}
              placeholder="50000"
            />
            {errors.funding_raised && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.funding_raised}</p>}
          </Field>
        </div>

        <Field label="Biggest problem you're facing right now" required>
          <textarea
            className={`${inputClass} min-h-[110px] resize-y`}
            value={form.problem_faced}
            onChange={(e) => update("problem_faced", e.target.value)}
            placeholder="e.g. Struggling to convert free trial users into paying customers..."
          />
          {errors.problem_faced && <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.problem_faced}</p>}
        </Field>

        <button
          type="submit"
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          Analyze My Startup →
        </button>
      </form>
    </div>
  );
}
