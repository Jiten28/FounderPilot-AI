export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-primary" />
      <p className="font-display text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[var(--color-danger)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </span>
        <p className="text-[var(--text-primary)]">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 self-start rounded-full border border-[var(--border-subtle)] px-4 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--color-danger)] sm:self-auto"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function DegradedNotice() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] px-4 py-2.5 text-xs text-[var(--text-primary)]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" className="shrink-0">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      Showing a simplified analysis — AI insights are temporarily limited.
    </div>
  );
}
