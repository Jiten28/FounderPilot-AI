import { cn } from "../../lib/cn";

type Tone = "success" | "warning" | "danger" | "primary";

const TONE_COLOR: Record<Tone, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  primary: "var(--color-primary)",
};

export function ScoreCard({
  label,
  value,
  suffix,
  tone,
  caption,
  icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone: Tone;
  caption?: string;
  icon?: React.ReactNode;
}) {
  const color = TONE_COLOR[tone];
  return (
    <div
      className="animate-fade-slide-in rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
        {icon && (
          <span className="text-[var(--text-muted)]" style={{ color }}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display tabular-nums text-4xl font-semibold sm:text-[42px]">
          {value}
        </span>
        {suffix && <span className="text-lg text-[var(--text-muted)]">{suffix}</span>}
      </div>
      {caption && <p className={cn("mt-2 text-xs text-[var(--text-muted)]")}>{caption}</p>}
    </div>
  );
}
