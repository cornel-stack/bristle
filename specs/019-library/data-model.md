# Data Model: Slice 4.4 (Library)

**Read-only.** No new tables/columns/migrations/seed. One new read-only projection helper feeds a pure filter engine; everything else is on the `Problem` row already.

## 1. Read source

| Source | Shape | Used by |
|---|---|---|
| `getLibraryProblems()` **(NEW, read-only)** | `LibraryProblem[]` (all 15) | the filter engine (the single browse source) |

`LibraryProblem = Problem & { hasWtpSignal: boolean; hasExistingSolution: boolean; searchText: string }`.

Assembled from four read-only reads inside the helper:
- `problems` — the 15 rows (already carry `category`, `sources[]`, `momentumPct`, `mentionCount60d`, `firstSeenAt`, `updatedAt`, `demandStatus`, `title`, `slug`, `topQuote`, `quoteSource`, `sparkline`).
- `wtp_signals.problem_id` → `hasWtpSignal` (presence; the `getWtpCountsByProblem` pattern).
- `existing_solutions.problem_id` → `hasExistingSolution` (presence).
- `problem_quotes.quote_text` grouped by `problem_id` → folded into `searchText`.

`searchText` = `lowercase( title + " " + sourceLabels(sources) + " " + allQuoteText )`, where `sourceLabels` resolves each key via `resolveBadge` (so "github" / "hacker news" / "stack overflow" / "forums" match). Precomputed in the helper so the engine is a pure substring match.

## 2. Facet → field mapping (all on the projection)

| Facet group | Values | Field | Predicate |
|---|---|---|---|
| Category | 8 (catalog keys; incl. `email` = "Email / Comms") | `problem.category` | `category ∈ selected` |
| Source | 5 badges (`resolveBadge` of `sources[]`) | `problem.sources[]` | resolved badges intersect selected |
| Momentum | gte100 / p25to99 / flat / new | `momentumPct`, `firstSeenAt` | `>=100` / `25–99` / `<25` / first-seen ≤30d |
| Signals | has-wtp / has-solution / validated | `hasWtpSignal`, `hasExistingSolution`, `demandStatus` | flag true / flag true / `=== "validated"` |
| Search | free text | `searchText` | `searchText.includes(q.toLowerCase())` |

Combination: **intersection across groups, union within a group**. Sort over the filtered set via `sortProblems(results, sort, wtpCounts)`.

## 3. Table columns → Problem fields (A1 list view)

| Column | Field | Render |
|---|---|---|
| (☐) | — | A8: omit, or inert visual-only if unbalanced |
| Problem | `title` (+ row link `slug`) | text; `<tr>`/row is the link to `/app/problems/[slug]` |
| Category | `category` | §4.1a-tinted chip (`CATEGORY_LABELS`) |
| Mentions | `mentionCount60d` | number |
| Momentum | `momentumPct` | `↑ +{n}%` |
| Sources | `sources[]` | `SourceIcon` per resolved badge |
| Updated | `updatedAt` | `relativeTime()` (now-relative, TF-023) |
| › | — | chevron |

Grid view: `toProblemCardProps(problem)` → `ProblemCardFull` (reused), wrapped in a `/app/problems/[slug]` link.

## 4. Query model (URL ↔ typed)

`LibraryQuery = { categories: string[]; sources: BadgeKey[]; momentum: MomentumBucket[]; signals: SignalKey[]; q: string; sort: SortKey; view: "list" | "grid" }`. Parsed from `searchParams` (`,`-joined multi-value); `sort` via `isSortKey` (default `momentum`); `view` default `list`; unknowns ignored.

## 5. Engine output

`filterLibrary(rows, query) → { results: Problem[]; facetCounts: Record<group, Record<value, number>>; total: number }`. `total === results.length` (FR-004). `facetCounts` are drill-down (research §4).

## 6. Key entities (read-only, from 4.1)

`Problem`, `Category` (8-key catalog), `ProblemSource` (presence via row `sources[]`), `WtpSignal` (presence), `ExistingSolution` (presence), `ProblemQuote` (search text), `demand_status`. No user entity — the Library is global (no `getAppUser`).

## 7. Completeness (SC trace)

Every facet/column/search target → a field on `LibraryProblem` → a 4.1 fixture. The only new read is the projection helper (read-only). Counts are derived (no stored aggregates). Genuine-0 WTP → has-WTP facet excludes it. No schema/seed change.
