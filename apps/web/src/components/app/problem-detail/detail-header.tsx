import type { ProblemDetail } from "@bristle/db";
import {
  CATEGORY_LABELS,
  isSourceKey,
  resolveBadge,
  type BadgeKey,
  type CategoryKey,
} from "@bristle/shared";
import { SourceIcon, type SourceKey as IconKey } from "@bristle/ui";

import { ProblemMomentumChip } from "@/components/problem/problem-momentum-chip";
import { relativeTime } from "@/lib/relative-time";

import { DetailActionBar } from "./detail-action-bar";

// Detail header — breadcrumb + action bar, then chips + provenance, then the
// title, momentum, source badges, and the "N quotes · N sources · N WTP" summary.
// Reads raw `detail` for these static fields this batch; the boundary adapter
// (T010) consolidates the derived values + the badge→icon map in Batch A.
//
// `BADGE_TO_ICON` mirrors the card adapter's map — it only turns a resolved
// badge into the @bristle/ui icon key (resolveBadge stays the single source→badge
// truth). TODO(T010): hoist this into the boundary adapter so there is ONE copy.
const BADGE_TO_ICON: Record<BadgeKey, IconKey> = {
  github: "gh",
  hackernews: "hn",
  stackexchange: "so",
  appstore: "ap",
  forums: "forum",
};

const DEMAND_LABEL: Record<string, string> = {
  validated: "Validated demand",
  trending: "Trending demand",
  emerging: "Emerging demand",
};

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function DetailHeader({
  detail,
  isSaved,
}: {
  detail: ProblemDetail;
  isSaved: boolean;
}) {
  const { problem, sources, wtp } = detail;
  const categoryLabel =
    CATEGORY_LABELS[problem.category as CategoryKey] ?? problem.category;
  const demandLabel = problem.demandStatus
    ? DEMAND_LABEL[problem.demandStatus] ?? problem.demandStatus
    : null;
  const isValidated = problem.demandStatus === "validated";

  const quoteTotal = sources.reduce((n, s) => n + s.quoteCount, 0);
  const sourceCount = sources.length;
  const wtpMentions = wtp?.mentionCount ?? 0;

  const iconKeys = [
    ...new Set(
      sources
        .map((s) => s.sourceKey)
        .filter(isSourceKey)
        .map((k) => BADGE_TO_ICON[resolveBadge(k).badgeKey]),
    ),
  ];

  return (
    <header className="flex flex-col gap-4 border-b border-border-default pb-section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <nav aria-label="Breadcrumb" className="min-w-0 text-body-sm text-text-secondary">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>Library</li>
            <li aria-hidden="true">/</li>
            <li>{categoryLabel}</li>
            <li aria-hidden="true">/</li>
            <li className="truncate font-medium text-text-primary">{problem.title}</li>
          </ol>
        </nav>
        <DetailActionBar isSaved={isSaved} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-body-sm text-text-secondary">
        <span className="rounded-pill bg-surface-raised px-2 py-0.5 font-medium text-text-primary">
          {categoryLabel}
        </span>
        {demandLabel ? (
          <span
            className={
              isValidated
                ? "rounded-pill bg-surface-raised px-2 py-0.5 font-medium text-accent-validated"
                : "rounded-pill bg-surface-raised px-2 py-0.5 font-medium text-text-secondary"
            }
          >
            {demandLabel}
          </span>
        ) : null}
        {problem.firstSeenAt ? (
          <span>First seen {MONTH_DAY.format(problem.firstSeenAt)}</span>
        ) : null}
        {problem.updatedAt ? (
          <>
            <span aria-hidden="true">·</span>
            <span>Updated {relativeTime(problem.updatedAt)}</span>
          </>
        ) : null}
      </div>

      <h1 className="font-serif text-heading-h1 text-text-primary">{problem.title}</h1>

      <div className="flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
        <ProblemMomentumChip
          momentum={{ delta: `+${problem.momentumPct}%`, windowDays: 14 }}
        />
        {iconKeys.length > 0 ? (
          <span className="flex items-center gap-1.5">
            {iconKeys.map((key) => (
              <SourceIcon key={key} source={key} className="size-4 text-text-secondary" />
            ))}
          </span>
        ) : null}
        <span>
          {quoteTotal} quotes &middot; {sourceCount} sources &middot; {wtpMentions}{" "}
          willingness-to-pay mentions
        </span>
      </div>
    </header>
  );
}
