// Sticky-rail card composing the DonutChart + a breakdown list. Takes the
// minimal projection (sourcesBreakdown + total) rather than the full
// SampleProblemFull — keeps the prop surface tight and lets the parent
// (ProblemLayout) pass `problem.sourcesBreakdown` and `problem.quoteCount`
// after narrowing on stubBody.

import type { SampleProblemSourceRow } from "./types";
import { DonutChart } from "./donut-chart";

interface SourcesCardProps {
  rows: ReadonlyArray<SampleProblemSourceRow>;
  total: number;
}

export function SourcesCard({ rows, total }: SourcesCardProps) {
  const ariaLabel =
    `Sources breakdown: ` +
    rows
      .map((r) => {
        const pct = total === 0 ? 0 : Math.round((r.count / total) * 100);
        return `${r.name} ${r.count} quotes (${pct}%)`;
      })
      .join(", ");

  return (
    <section className="rounded-card border border-border-default bg-surface-card p-grid">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        Sources &middot; {total} quotes
      </p>
      <div className="mt-grid">
        <DonutChart rows={rows} total={total} ariaLabel={ariaLabel} />
      </div>
      <ul className="mt-grid space-y-snug">
        {rows.map((row) => {
          const pct = total === 0 ? 0 : Math.round((row.count / total) * 100);
          return (
            <li key={row.name} className="flex items-baseline justify-between text-body-sm">
              <span className="text-text-primary">{row.name}</span>
              <span className="font-mono text-text-secondary">
                {row.count} &middot; {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
