import type { Problem } from "@bristle/db";
import { isSourceKey, resolveBadge } from "@bristle/shared";
import { SourceIcon } from "@bristle/ui";
import Link from "next/link";

import { CategoryChip } from "@/components/app/library/category-chip";
import { BADGE_TO_ICON } from "@/lib/problem-detail-adapter";
import { relativeTime } from "@/lib/relative-time";

// Compact Saved-board card — a NEW in-app component (the shared ProblemCardCompact
// renders a sparkline + quote this card doesn't have, and is a live Tier-2 leaf —
// wrap, don't edit). Category chip + momentum, title (links to the detail),
// source badges + now-relative time. Reuses the Library CategoryChip + the shared
// BADGE_TO_ICON (single source→icon truth).
function sourceIconKeys(p: Problem) {
  return [
    ...new Set(p.sources.filter(isSourceKey).map((k) => BADGE_TO_ICON[resolveBadge(k).badgeKey])),
  ];
}

export function SavedCard({ problem }: { problem: Problem }) {
  const up = problem.momentumPct >= 0;
  return (
    <article className="rounded-card border border-border-default bg-surface-card p-grid">
      <div className="flex items-start justify-between gap-2">
        <CategoryChip categoryKey={problem.category} />
        <span className={`font-mono text-body-sm ${up ? "text-accent-bristle" : "text-status-warning"}`}>
          <span aria-hidden="true">{up ? "↑" : "↓"} </span>
          {up ? "+" : ""}
          {problem.momentumPct}%
        </span>
      </div>
      <Link
        href={`/app/problems/${problem.slug}`}
        className="mt-snug block rounded-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        <h3 className="line-clamp-2 font-serif text-heading-h4 text-text-primary hover:text-accent-bristle">
          {problem.title}
        </h3>
      </Link>
      <div className="mt-grid flex items-center justify-between text-body-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          {sourceIconKeys(problem).map((key) => (
            <SourceIcon key={key} source={key} className="size-4" />
          ))}
        </span>
        <span>{problem.updatedAt ? relativeTime(problem.updatedAt) : ""}</span>
      </div>
    </article>
  );
}
