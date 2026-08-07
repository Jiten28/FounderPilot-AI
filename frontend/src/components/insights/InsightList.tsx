export function InsightList({
  title,
  items,
  accentColor,
  icon,
}: {
  title: string;
  items: string[];
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="animate-fade-slide-in rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${accentColor} 16%, transparent)`, color: accentColor }}
        >
          {icon}
        </span>
        <h3 className="font-display text-sm font-semibold">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--text-primary)]">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: accentColor }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
