import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
      <h1 className="font-display text-6xl font-semibold text-primary">404</h1>
      <p className="mt-3 text-[var(--text-muted)]">This page doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
      >
        Back to home
      </Link>
    </div>
  );
}
