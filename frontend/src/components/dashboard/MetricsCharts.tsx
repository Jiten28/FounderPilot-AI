import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MetricsResponse } from "../../types/api";

function ProjectedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
      Projected
    </span>
  );
}

function ChartCard({
  title,
  projected,
  children,
}: {
  title: string;
  projected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-slide-in rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {projected && <ProjectedBadge />}
      </div>
      <div className="h-56 w-full">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--text-primary)",
};

export function MetricsCharts({ metrics }: { metrics: MetricsResponse }) {
  const revenueVsExpenses = metrics.labels.map((label, i) => ({
    label,
    Revenue: metrics.revenue[i],
    Expenses: metrics.expenses[i],
  }));
  const burnData = metrics.labels.map((label, i) => ({
    label,
    Burn: metrics.burn[i],
  }));
  const usersData = metrics.labels.map((label, i) => ({
    label,
    Users: metrics.users[i],
  }));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ChartCard title="Revenue vs. Expenses" projected={metrics.projected}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueVsExpenses}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={44} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
            <Line type="monotone" dataKey="Revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Expenses" stroke="var(--color-danger)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Burn" projected={metrics.projected}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={burnData}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={44} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="Burn" fill="var(--color-danger)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Active Users" projected={metrics.projected}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={usersData}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={44} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="Users" stroke="#8B8D9B" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
