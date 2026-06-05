import { Sparkline } from "@bristle/ui";
import Link from "next/link";

import { CategoryChip } from "@/components/app/library/category-chip";
import type { CompareColumnVM } from "@/lib/compare-adapter";

import { CompareRemove } from "./compare-remove";

// One comparison column header — a problem card: Best-fit badge (the "strongest"
// column) + category chip + × remove, title (→ detail), momentum + sparkline.
export function CompareColumnHeader({ column }: { column: CompareColumnVM }) {
  const up = column.momentumPct >= 0;
  return (
    <div
      className={`rounded-card border bg-surface-card p-grid ${
        column.bestFit ? "border-accent-bristle" : "border-border-default"
      }`}
    >
      {column.bestFit ? (
        <span className="mb-1 inline-block rounded-pill bg-accent-bristle px-2 py-0.5 text-body-sm font-medium uppercase tracking-wide text-surface-card">
          Best fit
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <CategoryChip categoryKey={column.categoryKey} />
        <CompareRemove slug={column.slug} />
      </div>
      <Link
        href={`/app/problems/${column.slug}`}
        className="mt-snug block rounded-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        <h3 className="line-clamp-3 font-serif text-heading-h4 text-text-primary hover:text-accent-bristle">
          {column.title}
        </h3>
      </Link>
      <div className="mt-snug flex items-center gap-2 text-body-sm">
        <span className={`font-mono ${up ? "text-accent-bristle" : "text-status-warning"}`}>
          <span aria-hidden="true">{up ? "↑" : "↓"} </span>
          {up ? "+" : ""}
          {column.momentumPct}%
        </span>
        <span className="text-accent-bristle">
          <Sparkline values={column.sparkline} width={56} height={16} />
        </span>
      </div>
    </div>
  );
}
