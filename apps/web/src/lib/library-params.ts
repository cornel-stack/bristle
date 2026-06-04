// URL <-> typed query codec for the Library (slice 4.4). Facets/search/sort/view
// all live in the URL (deep-linkable, shareable; no localStorage §9.6). Multi-value
// groups are comma-joined (?category=payments,devtools). The allowed value lists
// derive from the shared registry/catalog — no parallel vocab.

import { CATEGORY_LABELS, SOURCE_BADGES, type BadgeKey } from "@bristle/shared";

import { isSortKey, type SortKey } from "./dashboard-sort";

export type MomentumBucket = "gte100" | "p25to99" | "flat" | "new";
export type SignalKey = "wtp" | "solution" | "validated";
export type LibraryView = "list" | "grid";

// Display labels for the sort control + "sorted by X" line (one source).
export const SORT_LABELS: Record<SortKey, string> = {
  momentum: "momentum",
  frequency: "frequency",
  newest: "newest",
  wtp: "willingness-to-pay",
};

export interface LibraryQuery {
  categories: string[];
  sources: BadgeKey[];
  momentum: MomentumBucket[];
  signals: SignalKey[];
  q: string;
  sort: SortKey;
  view: LibraryView;
}

export const MOMENTUM_VALUES: MomentumBucket[] = ["gte100", "p25to99", "flat", "new"];
export const SIGNAL_VALUES: SignalKey[] = ["wtp", "solution", "validated"];
const BADGE_VALUES = SOURCE_BADGES.map((b) => b.badgeKey);
const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS);

type SP = Record<string, string | string[] | undefined>;

function first(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function multi(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const s = Array.isArray(raw) ? raw.join(",") : raw;
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function only<T extends string>(values: string[], allowed: readonly T[]): T[] {
  const set = new Set<string>(allowed);
  return [...new Set(values)].filter((v): v is T => set.has(v));
}

export function parseLibraryQuery(sp: SP): LibraryQuery {
  const sortRaw = first(sp.sort);
  return {
    categories: only(multi(sp.category), CATEGORY_VALUES),
    sources: only(multi(sp.source), BADGE_VALUES),
    momentum: only(multi(sp.momentum), MOMENTUM_VALUES),
    signals: only(multi(sp.signal), SIGNAL_VALUES),
    q: (first(sp.q) ?? "").trim(),
    sort: isSortKey(sortRaw) ? sortRaw : "momentum",
    view: first(sp.view) === "grid" ? "grid" : "list",
  };
}

// Serialize a query to a clean URLSearchParams — defaults (momentum sort, list
// view, empty groups) are omitted so the canonical URL stays bare.
export function toSearchParams(q: Partial<LibraryQuery>): URLSearchParams {
  const p = new URLSearchParams();
  if (q.categories?.length) p.set("category", q.categories.join(","));
  if (q.sources?.length) p.set("source", q.sources.join(","));
  if (q.momentum?.length) p.set("momentum", q.momentum.join(","));
  if (q.signals?.length) p.set("signal", q.signals.join(","));
  if (q.q) p.set("q", q.q);
  if (q.sort && q.sort !== "momentum") p.set("sort", q.sort);
  if (q.view === "grid") p.set("view", "grid");
  return p;
}
