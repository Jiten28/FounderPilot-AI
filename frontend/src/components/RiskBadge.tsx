import type { RiskLevel, Priority, Impact } from "../types/api";
import { cn } from "../lib/cn";

const LEVEL_STYLES: Record<string, string> = {
  Low: "bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)] text-[var(--color-success)]",
  Medium: "bg-[color-mix(in_srgb,var(--color-warning)_18%,transparent)] text-[var(--color-warning)]",
  High: "bg-[color-mix(in_srgb,var(--color-danger)_16%,transparent)] text-[var(--color-danger)]",
  Immediate: "bg-[color-mix(in_srgb,var(--color-danger)_16%,transparent)] text-[var(--color-danger)]",
};

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel | Priority | Impact;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        LEVEL_STYLES[level] ?? "bg-[var(--surface-raised)] text-[var(--text-muted)]",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}
