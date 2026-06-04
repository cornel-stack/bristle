# Contracts: Slice 4.4 (Library) — UI + data

Internal contracts only (no external API). Pins the route, the read helper, the param codec, and the filter engine.

## 1. Route

- **Path**: `/app/library` → `apps/web/src/app/app/library/page.tsx`
- **Type**: async Server Component. `searchParams: Promise<Record<string, string | string[] | undefined>>` (Next 15; awaited).
- **Flow**: `const sp = await searchParams` → `const query = parseLibraryQuery(sp)` → `const rows = await getLibraryProblems()` → `const { results, facetCounts, total } = filterLibrary(rows, query)` → `<LibraryView query={query} results={results} facetCounts={facetCounts} total={total} />` inside `app/app/layout.tsx`.
- **Gating**: inherited from the layout (`auth()` + middleware `/app/:path*`). **No middleware/auth edit.** Anonymous → `/login?callbackUrl=/app/library`. **No `getAppUser`** (global page).

## 2. Read helper (`packages/db`)

```ts
// Read-only. All 15 problems + the three facet/search inputs not on the Problem row.
export interface LibraryProblem extends Problem {
  hasWtpSignal: boolean;
  hasExistingSolution: boolean;
  searchText: string; // lowercase: title + resolved source labels + all quote text
}
export async function getLibraryProblems(): Promise<LibraryProblem[]>;
```

Exported from `packages/db/src/index.ts` (fn + type). Built from `problems` + `wtp_signals` presence + `existing_solutions` presence + `problem_quotes` text. No schema change. This is the slice's entire `packages/db` delta.

## 3. Param codec (`apps/web/src/lib/library-params.ts`)

```ts
export type MomentumBucket = "gte100" | "p25to99" | "flat" | "new";
export type SignalKey = "wtp" | "solution" | "validated";
export interface LibraryQuery {
  categories: string[];     // category keys (8-catalog)
  sources: BadgeKey[];      // the 5 live badges
  momentum: MomentumBucket[];
  signals: SignalKey[];
  q: string;
  sort: SortKey;            // reused from dashboard-sort (default "momentum")
  view: "list" | "grid";   // default "list"
}
export function parseLibraryQuery(sp: Record<string, string | string[] | undefined>): LibraryQuery;
export function toSearchParams(q: Partial<LibraryQuery>): URLSearchParams;
```

Multi-value params `,`-joined (`?category=payments,devtools`). Client islands compute a delta against the current query and `router.replace(\`${pathname}?${toSearchParams(next)}\`, { scroll: false })`.

## 4. Filter engine (`apps/web/src/lib/library-filter.ts`) — pure

```ts
export interface FacetCounts {
  category: Record<string, number>;
  source: Record<string, number>;   // by BadgeKey
  momentum: Record<MomentumBucket, number>;
  signal: Record<SignalKey, number>;
}
export function filterLibrary(
  rows: LibraryProblem[],
  query: LibraryQuery,
): { results: Problem[]; facetCounts: FacetCounts; total: number };
```

- **Predicates**: category ∈; source badges intersect (via `resolveBadge`); momentum bucket; signals flags; `searchText.includes(q)`.
- **Combine**: intersection across groups, union within group. `results` applies all groups + search, then `sortProblems(results, query.sort, wtpCounts)`.
- **Counts**: drill-down — `facetCounts[G][v]` over (all-other-groups + search) ∩ value `v`. `total = results.length`.
- Pure (no I/O); called server-side from the page.

## 5. Client islands (the only client JS)

| Island | Updates | Note |
|---|---|---|
| `library-search` | `?q=` | debounced `router.replace` |
| `library-sort` | `?sort=` | select; `isSortKey` |
| `library-view-toggle` | `?view=` | list/grid |
| `facet-group` checkboxes | `?category=` / `?source=` / `?momentum=` / `?signal=` | toggle a value |
| `mobile-filter-drawer` | open/close (local) + wraps `<FacetRail/>` | "Filters · N" |

Everything else (table, grid, rail markup, counts, chips, empty state) is server-rendered.

## 6. Reuse (A9) — no duplication

`sortProblems` + `isSortKey` (`dashboard-sort.ts`); `toProblemCardProps` + `ProblemCardFull` (grid); `resolveBadge` / `SOURCE_BADGES` / `CATEGORY_LABELS` / `isSourceKey` (`@bristle/shared`); the 8-key catalog. No parallel sort/badge/category mapping.

## 7. Result link + empty state

Every row/card → `/app/problems/[slug]` (4.3). No-match → dry empty state ("No problems match these filters."), `total = 0`. Default (no params) → all 15, sorted momentum, list view.
