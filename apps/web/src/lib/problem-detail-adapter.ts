// Boundary adapter (slice 4.3): the SINGLE place DB rows from getProblemDetail
// become view models for the detail page. Reused public leaves (DonutChart,
// SourcesCard, ProblemMomentumChip) take this output unmodified; the wrapped
// in-app components (evidence, source-badge row, related, frequency) consume the
// richer view models the public leaves can't represent. All formatting lives
// here — panels stay presentational.
//
// Source keys route through @bristle/shared `resolveBadge` (the single source→
// badge truth); BADGE_TO_ICON only turns a resolved badge into the @bristle/ui
// icon key (exported so the header reuses it — one copy, no parallel mapping).

import type { ProblemDetail } from "@bristle/db";
import {
  CATEGORY_LABELS,
  isSourceKey,
  resolveBadge,
  type BadgeKey,
  type CategoryKey,
} from "@bristle/shared";
import type { SourceKey as IconKey } from "@bristle/ui";

import { relativeTime } from "@/lib/relative-time";

export const BADGE_TO_ICON: Record<BadgeKey, IconKey> = {
  github: "gh",
  hackernews: "hn",
  stackexchange: "so",
  appstore: "ap",
  forums: "forum",
};

// Display labels for the donut legend + evidence filter chips. stackexchange is
// labelled "Stack Overflow" (slice-4.2 D6 — the fixtures use `so`; resolveBadge's
// own badge label is the wider "Stack Exchange").
const BADGE_DISPLAY_LABEL: Record<BadgeKey, string> = {
  github: "GitHub",
  hackernews: "Hacker News",
  stackexchange: "Stack Overflow",
  appstore: "App Store",
  forums: "Forums",
};

const DEMAND_LABEL: Record<string, string> = {
  validated: "Validated demand",
  trending: "Trending demand",
  emerging: "Emerging demand",
};

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

// The evidence filter buckets the design's chips collapse to: GH · HN · SO ·
// Other (appstore/forums/anything else).
export type EvidenceGroup = "gh" | "hn" | "so" | "other";

function badgeGroup(badge: BadgeKey): EvidenceGroup {
  if (badge === "github") return "gh";
  if (badge === "hackernews") return "hn";
  if (badge === "stackexchange") return "so";
  return "other";
}

function compactNum(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);
}

function priceRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `$${min}–$${max}/mo`;
  if (min != null) return `$${min}+/mo`;
  if (max != null) return `up to $${max}/mo`;
  return null;
}

export type FrequencyWindow = "7d" | "30d" | "90d" | "all";
const WINDOW_DAYS: Record<Exclude<FrequencyWindow, "all">, number> = { "7d": 7, "30d": 30, "90d": 90 };

export interface FrequencyPointVM {
  date: string;
  count: number;
}
export interface EvidenceVM {
  id: string;
  handle: string;
  icon: IconKey;
  group: EvidenceGroup;
  engagement: string | null;
  rating: number | null;
  text: string;
  relativeTime: string | null;
  isWtp: boolean;
  statedPrice: number | null;
}
export interface EvidenceFilterVM {
  key: "all" | EvidenceGroup;
  label: string;
  count: number;
}
export interface SolutionVM {
  id: string;
  name: string;
  priceRange: string | null;
  matchType: string;
  description: string | null;
}
export interface WtpVM {
  mentionCount: number;
  priceRange: string | null;
  median: number | null;
  note: string | null;
}
export interface PersonaVM {
  id: string;
  label: string;
  count: number;
  pct: number;
}
export interface RelatedVM {
  id: string;
  label: string;
  href: string | null;
}
export interface DonutRowVM {
  name: string;
  count: number;
}

export interface DetailViewModel {
  title: string;
  categoryLabel: string;
  demand: { label: string; validated: boolean } | null;
  firstSeenLabel: string | null;
  updatedLabel: string | null;
  momentum: { delta: string; windowDays: number };
  sourceIcons: IconKey[];
  summary: { quotes: number; sources: number; wtpMentions: number };
  isSaved: boolean;
  synthesis: string | null;
  donutRows: DonutRowVM[];
  quoteTotal: number;
  sourceCount: number;
  frequency: {
    data: Record<FrequencyWindow, FrequencyPointVM[]>;
    thresholdDate: string | null;
    totalMentions: number;
    priorDeltaPct: number;
  };
  evidence: EvidenceVM[];
  evidenceFilters: EvidenceFilterVM[];
  solutions: SolutionVM[];
  wtp: WtpVM | null;
  personas: PersonaVM[];
  related: RelatedVM[];
}

function isoDate(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
}

export function adaptProblemDetail(
  detail: ProblemDetail,
  isSaved: boolean,
): DetailViewModel {
  const { problem, sources, quotes, solutions, wtp, personas, related, frequency } = detail;

  // --- source aggregates (donut + filter chips + badge row) ------------------
  const byBadge = new Map<BadgeKey, number>();
  for (const s of sources) {
    if (!isSourceKey(s.sourceKey)) continue;
    const badge = resolveBadge(s.sourceKey).badgeKey;
    byBadge.set(badge, (byBadge.get(badge) ?? 0) + s.quoteCount);
  }
  const quoteTotal = sources.reduce((n, s) => n + s.quoteCount, 0);
  const sourceCount = sources.length;

  const donutRows: DonutRowVM[] = [...byBadge.entries()]
    .map(([badge, count]) => ({ name: BADGE_DISPLAY_LABEL[badge], count }))
    .sort((a, b) => b.count - a.count);

  const sourceIcons: IconKey[] = [...byBadge.keys()].map((b) => BADGE_TO_ICON[b]);

  // --- evidence filter chips: All · GH · HN · SO · Other ---------------------
  const groupCount: Record<EvidenceGroup, number> = { gh: 0, hn: 0, so: 0, other: 0 };
  for (const [badge, count] of byBadge) groupCount[badgeGroup(badge)] += count;
  const evidenceFilters: EvidenceFilterVM[] = (
    [
      { key: "all", label: "All", count: quoteTotal },
      { key: "gh", label: "GH", count: groupCount.gh },
      { key: "hn", label: "HN", count: groupCount.hn },
      { key: "so", label: "SO", count: groupCount.so },
      { key: "other", label: "Other", count: groupCount.other },
    ] satisfies EvidenceFilterVM[]
  ).filter((f) => f.key === "all" || f.count > 0);

  // --- evidence rows ---------------------------------------------------------
  const evidence: EvidenceVM[] = quotes.map((q) => {
    const badge = isSourceKey(q.sourceKey) ? resolveBadge(q.sourceKey).badgeKey : null;
    return {
      id: q.id,
      handle: q.authorHandle,
      icon: badge ? BADGE_TO_ICON[badge] : "gh",
      group: badge ? badgeGroup(badge) : "other",
      engagement:
        q.engagementValue != null
          ? `${compactNum(q.engagementValue)}${q.engagementLabel ? ` ${q.engagementLabel}` : ""}`
          : null,
      rating: q.rating,
      text: q.quoteText,
      relativeTime: q.postedAt ? relativeTime(q.postedAt) : null,
      isWtp: q.isWtpSignal,
      statedPrice: q.statedPriceUsd,
    };
  });

  // --- frequency windows (reuse buildLinePath downstream) --------------------
  const points: FrequencyPointVM[] = frequency
    .map((p) => ({ date: isoDate(p.observedOn), count: p.mentionCount }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = points.at(-1)?.date ?? null;
  const within = (days: number): FrequencyPointVM[] => {
    if (!latest) return [];
    const cutoff = new Date(`${latest}T00:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const min = cutoff.toISOString().slice(0, 10);
    return points.filter((p) => p.date >= min);
  };
  const thresholdRow = frequency.find((p) => p.isThresholdMarker);

  const frequencyData = {
    "7d": within(WINDOW_DAYS["7d"]),
    "30d": within(WINDOW_DAYS["30d"]),
    "90d": within(WINDOW_DAYS["90d"]),
    all: points,
  };

  return {
    title: problem.title,
    categoryLabel: CATEGORY_LABELS[problem.category as CategoryKey] ?? problem.category,
    demand: problem.demandStatus
      ? {
          label: DEMAND_LABEL[problem.demandStatus] ?? problem.demandStatus,
          validated: problem.demandStatus === "validated",
        }
      : null,
    firstSeenLabel: problem.firstSeenAt ? MONTH_DAY.format(problem.firstSeenAt) : null,
    updatedLabel: problem.updatedAt ? relativeTime(problem.updatedAt) : null,
    momentum: { delta: `+${problem.momentumPct}%`, windowDays: 14 },
    sourceIcons,
    summary: { quotes: quoteTotal, sources: sourceCount, wtpMentions: wtp?.mentionCount ?? 0 },
    isSaved,
    synthesis: problem.synthesis,
    donutRows,
    quoteTotal,
    sourceCount,
    frequency: {
      data: frequencyData,
      thresholdDate: thresholdRow ? isoDate(thresholdRow.observedOn) : null,
      totalMentions: problem.mentionCount60d ?? points.reduce((n, p) => n + p.count, 0),
      priorDeltaPct: problem.momentumPct,
    },
    evidence,
    evidenceFilters,
    solutions: solutions.map((s) => ({
      id: s.id,
      name: s.name,
      priceRange: s.priceRange,
      matchType: s.matchType,
      description: s.description,
    })),
    wtp: wtp
      ? {
          mentionCount: wtp.mentionCount,
          priceRange: priceRange(wtp.priceMinUsd, wtp.priceMaxUsd),
          median: wtp.medianUsd,
          note: wtp.note,
        }
      : null,
    personas: personas.map((p) => ({
      id: p.id,
      label: p.label,
      count: p.count,
      pct: p.percentage ?? 0,
    })),
    related: related.map((r) => ({
      id: r.id,
      label: r.label,
      href: r.targetSlug ? `/app/problems/${r.targetSlug}` : null,
    })),
  };
}
