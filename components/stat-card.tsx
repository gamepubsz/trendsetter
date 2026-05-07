import type { KpiMetric } from "@/lib/types";

export function StatCard({ metric }: { metric: KpiMetric }) {
  return (
    <article className="card stat-card">
      <span className="muted">{metric.label}</span>
      <strong>{metric.value}</strong>
      <span className={`delta delta-${metric.direction}`}>{metric.change}</span>
    </article>
  );
}
