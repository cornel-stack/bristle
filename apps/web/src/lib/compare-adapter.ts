// Compare boundary adapter (slice 4.7) — the single seam: a problem's full detail
// → one grid column. The QUANTITATIVE rows derive from the relational tables
// (never from compare_card); the QUALITATIVE scorecards + Bristle's Read come from
// compare_card, validated against CompareCardSchema at the boundary (the 4.3
// problem-detail-adapter pattern). Pure.

import type { ProblemDetail } from "@bristle/db";
import {
  CATEGORY_LABELS,
  CompareCardSchema,
  isSourceKey,
  resolveBadge,
  type CategoryKey,
  type CompareCard,
} from "@bristle/shared";

const LIVE_SOURCE_COUNT = 5; // the 5 live registry badges (no PH/Google Play)
const DAY_MS = 86_400_000;

export interface CompareColumnVM {
  slug: string;
  title: string;
  categoryKey: string;
  categoryLabel: string;
  momentumPct: number;
  sparkline: number[];
  // derived quantitative
  mentions60d: number | null;
  sources: { count: number; of: number };
  wtp: { count: number; median: number | null } | null;
  persona: { label: string; pct: number } | null;
  solutions: { count: number; qualifier: string };
  daysSinceFirstSeen: number | null;
  // qualitative (compare_card)
  card: CompareCard | null;
  bestFit: boolean;
}

export function adaptCompareColumn(detail: ProblemDetail, now: number = Date.now()): CompareColumnVM {
  const { problem, sources, wtp, personas, solutions } = detail;

  const distinctBadges = new Set(
    sources.map((s) => s.sourceKey).filter(isSourceKey).map((k) => resolveBadge(k).badgeKey),
  );

  const topPersona = personas[0] ?? null;

  const directCount = solutions.filter((s) => s.matchType === "direct").length;
  const adjacentCount = solutions.filter((s) => s.matchType === "adjacent").length;
  const qualifier =
    directCount > 0
      ? `${directCount} direct`
      : adjacentCount > 0
        ? `${adjacentCount} adjacent`
        : `${directCount} direct`;

  const parsed = CompareCardSchema.safeParse(problem.compareCard);
  const card = parsed.success ? parsed.data : null;

  return {
    slug: problem.slug,
    title: problem.title,
    categoryKey: problem.category,
    categoryLabel: CATEGORY_LABELS[problem.category as CategoryKey] ?? problem.category,
    momentumPct: problem.momentumPct,
    sparkline: problem.sparkline,
    mentions60d: problem.mentionCount60d,
    sources: { count: distinctBadges.size, of: LIVE_SOURCE_COUNT },
    wtp: wtp ? { count: wtp.mentionCount, median: wtp.medianUsd } : null,
    persona: topPersona ? { label: topPersona.label, pct: topPersona.percentage ?? 0 } : null,
    solutions: { count: solutions.length, qualifier },
    daysSinceFirstSeen: problem.firstSeenAt
      ? Math.max(0, Math.floor((now - problem.firstSeenAt.getTime()) / DAY_MS))
      : null,
    card,
    bestFit: card?.bristlesRead.verdict === "strongest",
  };
}
