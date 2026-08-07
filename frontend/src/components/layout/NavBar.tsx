import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

export function NavBar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M9 22 L16 9 L23 22" stroke="white" strokeWidth="2.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx="16" cy="16.5" r="2.2" fill="#00D9A3" />
            </svg>
          </span>
          <span className="font-display text-[17px] font-semibold tracking-tight">
            FounderPilot <span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
              </svg>
            )}
          </button>
          <Link
            to="/form"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
          >
            Start Analysis
          </Link>
        </div>
      </div>
    </header>
  );
}
