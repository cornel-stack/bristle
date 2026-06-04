import type { Problem } from "@bristle/db";
import {
  CATEGORY_LABELS,
  isSourceKey,
  resolveBadge,
  type BadgeKey,
  type CategoryKey,
} from "@bristle/shared";
import type {
  CategoryColor,
  ProblemCardFullProps,
  SourceKey,
} from "@bristle/ui";

// Presentation adapter: a slice-4.1 `Problem` row → the canonical `ProblemCardFull`
// props (slice 1.3). Source keys route through the 4.1 registry's `resolveBadge`
// (the SINGLE source→badge truth — no parallel mapping); this map only turns the
// resolved badge into the card's icon key. `forum→forum` works since T007 added the
// mark. SO/SE both resolve to the one `stackexchange` badge → the card's `so`.
const BADGE_TO_CARD_KEY: Record<BadgeKey, SourceKey> = {
  github: "gh",
  hackernews: "hn",
  stackexchange: "so",
  appstore: "ap",
  forums: "forum",
};

function toCardSource(dbKey: string): SourceKey | null {
  if (!isSourceKey(dbKey)) return null; // off-registry (cannot occur post-seed)
  return BADGE_TO_CARD_KEY[resolveBadge(dbKey).badgeKey];
}

export function toProblemCardProps(p: Problem): ProblemCardFullProps {
  const sources = p.sources
    .map(toCardSource)
    .filter((s): s is SourceKey => s !== null);
  return {
    title: p.title,
    category: CATEGORY_LABELS[p.category as CategoryKey] ?? p.category,
    categoryColor: p.category as CategoryColor,
    momentum: p.momentumPct,
    sparkline: p.sparkline,
    topQuote: p.topQuote,
    quoteSource: toCardSource(p.quoteSource) ?? "gh",
    sources: [...new Set(sources)], // SO+SE could collapse to a dup
    lastSeenIso: p.lastSeenAt.toISOString(),
  };
}
