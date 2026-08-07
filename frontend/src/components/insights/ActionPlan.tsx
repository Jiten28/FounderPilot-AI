import type { ActionPlanItem, Priority } from "../../types/api";
import { RiskBadge } from "../RiskBadge";

const ORDER: Priority[] = ["Immediate", "High", "Medium", "Low"];

export function ActionPlan({ items }: { items: ActionPlanItem[] }) {
  const grouped = ORDER.map((priority) => ({
    priority,
    tasks: items.filter((item) => item.priority === priority),
  })).filter((g) => g.tasks.length > 0);

  return (
    <div className="animate-fade-slide-in rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <h3 className="mb-4 font-display text-sm font-semibold">30-Day Action Plan</h3>
      <div className="space-y-5">
        {grouped.map((group) => (
          <div key={group.priority}>
            <div className="mb-2.5">
              <RiskBadge level={group.priority} />
            </div>
            <ul className="space-y-2">
              {group.tasks.map((task, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-3 text-sm leading-relaxed"
                >
                  {task.task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
