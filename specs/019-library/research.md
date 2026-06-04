# Research: Slice 4.4 (Library) — decisions

Read-only browse over the slice-4.1 fixtures. Decisions grounded by reading the schema + the 4.2 reuse surface.

## 1. Result view — list/table primary + card-grid toggle (A1)

- **Decision**: Build the **list/table** as the primary view (a new semantic `<table>` row component matching page 3) plus a **grid/list view toggle**; the grid view reuses the slice-4.2 `ProblemCardFull` + `toProblemCardProps`. Both render the same filtered/sorted set; the choice persists in the URL (`?view=`, default `list`).
- **Rationale**: Page 3's primary result view is a table with an explicit grid/list toggle — the visual contract. The brief's "canonical ProblemCards" maps to the toggle's grid view, satisfying the card-reuse intent without contradicting the comp.
- **Alternatives rejected**: card grid only (diverges from the comp's primary view); table only (drops the comp's toggle + the card reuse).

## 2. Read layer — one read-only projection helper (A10)

- **Decision**: `getLibraryProblems(): Promise<LibraryProblem[]>`, `LibraryProblem = Problem & { hasWtpSignal, hasExistingSolution, searchText }`. The `Problem` row already carries everything the table columns + category/source/momentum/demand facets need (`category`, `sources[]`, `momentumPct`, `mention_count_60d`, `first_seen_at`, `updated_at`, `demand_status`, `title`, `slug`). The helper adds only the three things not on the row: WTP presence, existing-solution presence, and concatenated quote text (for search).
- **Rationale**: One read-only helper = one filter source; avoids ×15 `getProblemDetail` calls (heavy) and avoids scattering three side-reads into `apps/web`. `searchText` is precomputed (title + source labels + quote text, lowercased) so the engine stays a pure string match.
- **Alternatives rejected**: reuse `getDashboardProblems()` + 3 side reads in the page (more wiring, splits the read across layers); `getProblemDetail` per problem (15× over-fetch).
- **`getAppUser` not needed**: the Library is global (all 8 categories, no per-user scoping, no saved-state per A4). The auth gate stays in the layout. This is the one Tier-4 read screen that doesn't touch the seam.

## 3. Filter / sort / count engine — pure + server-side (A3)

- **Decision**: `filterLibrary(rows, query) → {results, facetCounts, total}` — a pure module run on the server from the RSC. Intersection-across-groups / union-within-group; momentum buckets by `momentumPct` (+ `first_seen_at` for "new <30d"); search = case-insensitive substring over `searchText`; sort via the reused `sortProblems` over the **full** filtered set.
- **Rationale**: Pure + server-side = RSC-first (tiny client bundle), deterministic, and **unusually sandbox-testable** (a tsx probe exercises every facet/search/sort/count path over the seeded 15 without a browser). Reusing `sortProblems` honors the no-duplication rule.
- **Alternatives rejected**: client-side filtering of the fetched 15 (ships the data + logic to the client, breaks deep-linking); a filter/table library (new dep, §9.5).

## 4. Count semantics — drill-down (pinned)

- **Decision**: For facet group **G**, `facetCounts[G][v]` = count over (all groups **except** G + search) ∩ rows-with-`v`; the **result list** applies **all** groups. `total` = `results.length`.
- **Rationale**: Standard faceted-search behavior — checking one value in G leaves its siblings' counts meaningful (computed without G applied to itself), so the user can widen within a group; the result list still narrows. Guarantees FR-004 (count == rows shown) because `total` is literally `results.length`.
- **Alternatives rejected**: global counts (ignore other facets — misleading once anything else is active); fully-applied counts (a checked value would zero its own siblings).

## 5. URL as state (A3, §9.6)

- **Decision**: All of facets / search / sort / view live in `searchParams`; thin client islands serialize a delta and `router.replace(…, {scroll:false})`. No `localStorage`/`sessionStorage`.
- **Rationale**: Deep-linkable + shareable filtered views; RSC reads the canonical state; honors §9.6. Search input debounces before writing `?q=`.

## 6. Standing deltas + scope (A2/A5/A6/A7/A8)

- **Counts (A2)**: real everywhere; **no** scale literal ("142,318 indexed" / "87 active" dropped).
- **Pagination (A5)**: render all matching; **TF-026** logged for Tier-5 (the comp's 12/page is vestigial at 15).
- **Source facet (A6)**: 5 live badges via `resolveBadge` (GitHub, Hacker News, Stack Exchange, App Store, Forums); no PH/Google Play. Forums is present though absent from the comp's list. Flag at STOP-5.
- **Signals (A7)**: 3 facets — has-WTP (`wtp_signals` row), has-existing-solution (`existing_solutions` rows), validated-demand (`demand_status="validated"`, 3 fixtures). All live counts.
- **Row checkboxes (A8)**: omit unless the table reads unbalanced → then inert visual-only column; 4.7 wires Compare. Decided at Batch A.

## 7. Verification split

- **Sandbox**: anonymous `/app/library` (+ `?category=` deep links) → 307 `/login`; `pnpm build`; **tsx probe of `filterLibrary`** over the seeded 15 (facets, search, sort, drill-down counts, total); integrity diff.
- **Founder-run (preview)**: the populated page vs page 3 (table, facet counts, card-grid toggle, mobile drawer, light/dark).
