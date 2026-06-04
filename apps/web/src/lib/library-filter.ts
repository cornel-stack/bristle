// The Library's pure filter/sort/count engine (slice 4.4). No I/O — called
// server-side from the RSC, and unusually sandbox-testable (a tsx probe exercises
// every facet/search/sort/count path over the seeded 15). Combination is
// intersection-across-groups + union-within-group; facet counts are DRILL-DOWN
// (a value's count is computed against the OTHER active groups + search, so a
// checked value never zeroes its own siblings); total === results.length.

import type { LibraryProblem, Problem } from "@bristle/db";
import { isSourceKey, resolveBadge, type BadgeKey } from "@bristle/shared";

import { sortProblems } from "./dashboard-sort";
import {
  MOMENTUM_VALUES,
  SIGNAL_VALUES,
  type LibraryQuery,
  type MomentumBucket,
  type SignalKey,
} from "./library-params";

export interface FacetCounts {
  category: Record<string, number>;
  source: Record<string, number>;
  momentum: Record<MomentumBucket, number>;
  signal: Record<SignalKey, number>;
}

const NEW_MS = 30 * 24 * 60 * 60 * 1000;

// Per-row derived facet membership (computed once per call).
interface Derived {
  row: LibraryProblem;
  badges: Set<BadgeKey>;
  buckets: Set<MomentumBucket>;
  signals: Set<SignalKey>;
}

function deriveRow(row: LibraryProblem, now: number): Derived {
  const badges = new Set<BadgeKey>();
  for (const k of row.sources) if (isSourceKey(k)) badges.add(resolveBadge(k).badgeKey);

  const buckets = new Set<MomentumBucket>();
  if (row.momentumPct >= 100) buckets.add("gte100");
  else if (row.momentumPct >= 25) buckets.add("p25to99");
  else buckets.add("flat");
  if (row.firstSeenAt && now - row.firstSeenAt.getTime() <= NEW_MS) buckets.add("new");

  const signals = new Set<SignalKey>();
  if (row.hasWtpSignal) signals.add("wtp");
  if (row.hasExistingSolution) signals.add("solution");
  if (row.demandStatus === "validated") signals.add("validated");

  return { row, badges, buckets, signals };
}

// Per-group predicates — empty group = no constraint; non-empty = union within.
function catPass(d: Derived, q: LibraryQuery): boolean {
  return q.categories.length === 0 || q.categories.includes(d.row.category);
}
function srcPass(d: Derived, q: LibraryQuery): boolean {
  return q.sources.length === 0 || q.sources.some((s) => d.badges.has(s));
}
function momPass(d: Derived, q: LibraryQuery): boolean {
  return q.momentum.length === 0 || q.momentum.some((m) => d.buckets.has(m));
}
function sigPass(d: Derived, q: LibraryQuery): boolean {
  return q.signals.length === 0 || q.signals.some((s) => d.signals.has(s));
}
function searchPass(d: Derived, q: LibraryQuery): boolean {
  return q.q === "" || d.row.searchText.includes(q.q.toLowerCase());
}

function countBy<T extends string>(
  base: Derived[],
  values: readonly T[],
  has: (d: Derived, v: T) => boolean,
): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const v of values) out[v] = base.filter((d) => has(d, v)).length;
  return out;
}

export function filterLibrary(
  rows: LibraryProblem[],
  query: LibraryQuery,
  now: number = Date.now(),
): { results: Problem[]; facetCounts: FacetCounts; total: number } {
  const derived = rows.map((r) => deriveRow(r, now));

  // Results apply ALL groups + search.
  const matched = derived.filter(
    (d) =>
      catPass(d, query) &&
      srcPass(d, query) &&
      momPass(d, query) &&
      sigPass(d, query) &&
      searchPass(d, query),
  );

  // Drill-down counts: each group's base set applies every OTHER group + search.
  const baseExcept = (skip: "cat" | "src" | "mom" | "sig"): Derived[] =>
    derived.filter(
      (d) =>
        (skip === "cat" || catPass(d, query)) &&
        (skip === "src" || srcPass(d, query)) &&
        (skip === "mom" || momPass(d, query)) &&
        (skip === "sig" || sigPass(d, query)) &&
        searchPass(d, query),
    );

  const categoryValues = [...new Set(rows.map((r) => r.category))].sort();
  const badgeValues = [...new Set(derived.flatMap((d) => [...d.badges]))];

  const facetCounts: FacetCounts = {
    category: countBy(baseExcept("cat"), categoryValues, (d, v) => d.row.category === v),
    source: countBy(baseExcept("src"), badgeValues, (d, v) => d.badges.has(v)),
    momentum: countBy(baseExcept("mom"), MOMENTUM_VALUES, (d, v) => d.buckets.has(v)),
    signal: countBy(baseExcept("sig"), SIGNAL_VALUES, (d, v) => d.signals.has(v)),
  };

  const wtpCounts: Record<string, number> = {};
  for (const r of rows) wtpCounts[r.id] = r.wtpMentionCount;

  const results = sortProblems(
    matched.map((d) => d.row),
    query.sort,
    wtpCounts,
  );

  return { results, facetCounts, total: results.length };
}
