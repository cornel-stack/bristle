# Implementation Plan: Library (Faceted Browse) — Slice 4.4

**Branch**: `019-library` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-library/spec.md`

> **DON'T-IMPLEMENT GUARD** — design-artifact plan only (plan.md + research.md + data-model.md + contracts/ + quickstart.md). No application code, no `/speckit.tasks`, no `/speckit.implement`. Hold for founder review.

## Summary

Build the Library faceted-browse page at `/app/library` — the third Tier-4 screen — rendering **all 15** slice-4.1 fixtures (all 8 categories) inside the slice-4.2 app shell. The page is a **Server Component** that reads `searchParams`, reads the full fixture projection through one new read-only `packages/db` helper, then **filters / sorts / counts server-side** via a pure engine and renders. The **primary view is a list/table** (matching `Core_app.pdf` page 3) with a **grid/list view toggle** whose grid view **reuses the slice-4.2 `ProblemCardFull` + `toProblemCardProps`**. Facets (category / source / momentum / signals), search, sort, and view all **serialize to the URL** (`?category=&source=&momentum=&signal=&q=&sort=&view=`) so views are deep-linkable; thin client islands only update the URL. Counts are **real and consistent** everywhere (facet count = results that value yields; "N results" = the matching set); the comp's scale aggregates are dropped. No per-user scoping (the Library is global over the fixtures — `getAppUser` not needed). No schema/seed change.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 15 App Router, React 19, Node 24.

**Primary Dependencies**: `next`, `react`, `@bristle/ui` (`ProblemCardFull`, `SourceIcon`), `@bristle/db` (Drizzle read helpers), `@bristle/shared` (`resolveBadge`, `SOURCE_BADGES`, `CATEGORY_LABELS`, `isSourceKey`), `lucide-react`, `next-themes`. **No new dependency** (no table/filter lib — hand-rolled, §9.5).

**Storage**: Supabase Postgres (read-only) via Drizzle; dev == prod single instance.

**Testing**: typecheck + lint + build gates; foreground `tsx` probe of the pure filter engine over the 15 (sandbox). Populated-page visual is founder-run on preview.

**Target Platform**: Web (Vercel), Editorial Light + Dark, mobile-responsive.

**Project Type**: Turborepo monorepo — `apps/web` + `packages/{db,ui,shared}`.

**Performance Goals**: Server Components first; filtering/sorting/counting server-side; client JS minimized to URL-updating controls. < 180KB initial JS, LCP < 2.5s, Lighthouse 90+.

**Constraints**: read-only diff (`apps/web` + one read-only `packages/db` helper); no schema/seed/migration; URL-param-driven (no `localStorage`/`sessionStorage`, §9.6); 5-source facet delta; reuse 4.2 sort/adapter/registry (no duplication); real counts (no scale literal); render-all (no pagination).

**Scale/Scope**: 15 fixtures × 4 facet groups (8+5+4+3 values) + search + 4 sorts + 2 views; 1 route, ~10 new components, 1 filter engine, 1 read-only helper.

## Constitution Check

*GATE: pass before Phase 0; re-check after Phase 1.*

| Rule | Status | Note |
|---|---|---|
| §3 stack (RSC-first, Tailwind tokens, next-themes, lucide, Drizzle, TS strict) | ✅ | RSC page + thin URL-updating islands; hand-rolled table. |
| §4 design system (tokens, §4.1a tints, type, motion, a11y) | ✅ | Category chips use §4.1a tints; tokens-only. |
| §5 conventions (kebab files, DB via Drizzle in packages/db, no localStorage, Zod shared) | ✅ | State in URL, not storage; reads via `@bristle/db`. |
| §6 voice | ✅ | Dry empty state ("No problems match these filters."). |
| §9.4 build exactly the slice | ✅ | Compare checkboxes deferred (A8); Add-category deferred (4.9). |
| §9.5 no new library without proposal | ✅ | Zero new deps; hand-rolled table + filter engine. |
| §9.6 no localStorage/sessionStorage | ✅ | View + facets + sort + search live in the URL. |

**Result**: PASS. No violations; Complexity Tracking not required.

## Project Structure

```text
apps/web/src/
├── app/app/library/
│   └── page.tsx                       # NEW — RSC: await searchParams → getLibraryProblems() → filterLibrary() → render
├── components/app/library/            # NEW (kebab-case)
│   ├── library-view.tsx               # composer: header + facet rail + results (list|grid) + empty state
│   ├── library-header.tsx             # title + search island + sort island + view-toggle island + "N results · sorted by X"
│   ├── library-search.tsx             # CLIENT island — search input → ?q= (debounced router.replace)
│   ├── library-sort.tsx               # CLIENT island — sort select → ?sort=
│   ├── library-view-toggle.tsx        # CLIENT island — list|grid → ?view=
│   ├── facet-rail.tsx                 # facet groups (server-rendered) + active-chip summary + Clear all
│   ├── facet-group.tsx                # one group's labeled checkboxes + counts (checkbox = CLIENT island updating ?param)
│   ├── active-filters.tsx             # active-filter chips + Clear all (clears the facet params)
│   ├── mobile-filter-drawer.tsx       # CLIENT island — "Filters · N" → sheet wrapping <FacetRail/>
│   ├── results-table.tsx              # NEW list/table (semantic <table>); row → /app/problems/[slug]
│   └── results-grid.tsx               # grid view — reuses ProblemCardFull via toProblemCardProps
├── lib/
│   ├── library-filter.ts              # NEW pure engine: filterLibrary(rows, query) → {results, facetCounts, total}
│   └── library-params.ts              # NEW: parse/serialize searchParams ↔ typed LibraryQuery (multi-value)
packages/db/src/
├── queries.ts                         # EDIT — add read-only getLibraryProblems()
└── index.ts                           # EDIT — export it + the LibraryProblem type
CLAUDE.md                              # EDIT — §8 doc-only note + SPECKIT pointer
```

**Structure Decision**: New `app/app/library` route under the gated `/app` group; all library UI under `components/app/library/**`; the pure filter engine + param codec in `apps/web/src/lib`. One new read-only `packages/db` helper feeds the engine.

## Architecture decisions

### Route + gating (FR-001, A3)
`app/app/library/page.tsx` — async Server Component. Next 15: `searchParams: Promise<{...}>` (awaited). Reads `getLibraryProblems()` (all 15 + facet projection), parses `searchParams` via `library-params.ts` into a typed `LibraryQuery`, runs `filterLibrary()` server-side, renders `<LibraryView>` inside `app/app/layout.tsx` (already gated; `/app/:path*` matcher covers `/app/library` — **no middleware/auth change**). **`getAppUser` is NOT called** — the Library is global over the fixtures (all 8 categories, not the watched set; no saved-state per A4), so there's no which-user resolution. (If a saved indicator is ever added, the seam returns — the only place that'd need it.)

### Read layer (A10) — one read-only helper
`getLibraryProblems(): Promise<LibraryProblem[]>` where `LibraryProblem = Problem & { hasWtpSignal: boolean; hasExistingSolution: boolean; searchText: string }`. Built from four read-only reads assembled in the helper: the 15 `problems` rows; the set of `problem_id`s with a `wtp_signals` row (the `getWtpCountsByProblem` pattern); the set with `existing_solutions` rows; and `problem_quotes.quote_text` grouped per problem. `searchText` is precomputed lowercase = `title + resolved source labels + all quote text` (so search matches title / source name / quote text, FR-011). Read-only; no schema change. The `Problem` row already carries `category`, `sources[]`, `momentumPct`, `mentionCount60d`, `firstSeenAt`, `updatedAt`, `demandStatus`, `title`, `slug` — so category/source/momentum/demand facets + every table column need **no extra joins**; only WTP-presence, solution-presence, and full quote text are added.

### Filter / sort / count engine (FR-005..012) — pure + server-side
`filterLibrary(rows: LibraryProblem[], q: LibraryQuery): { results: Problem[]; facetCounts: FacetCounts; total: number }` in `library-filter.ts` — pure, no I/O, runs on the server.
- **Predicates per group**: category (`row.category ∈ q.categories`), source (`row.sources` resolved via `resolveBadge` intersects `q.sources`), momentum bucket (below), signals (`hasWtpSignal` / `hasExistingSolution` / `demandStatus==="validated"`), search (`row.searchText.includes(q.q.toLowerCase())`).
- **Combination**: **intersection across groups, union within a group** (FR-009). `results` = rows passing every active group + search.
- **Momentum buckets**: `>=100` → `gte100`; `25..99` → `p25to99`; `<25` (incl. ≤0) → `flat`; `new` → `firstSeenAt` within 30 days of now (recency, orthogonal — a row may match `new` *and* a percent bucket; union within the group).
- **Sort**: reuse `dashboard-sort.ts` `sortProblems(results, q.sort, wtpCounts)` over the **full** filtered set (no truncation). `wtpCounts` derived from the projection (problemId → mention count; 0 when absent).
- **Counts** (semantics pinned below): `total = results.length`; `facetCounts[group][value]` = count of rows matching (**all other groups + search**) **and** that value.

### Param codec (A3)
`library-params.ts`: `parseLibraryQuery(searchParams) → LibraryQuery` and `toSearchParams(query) → URLSearchParams`. Multi-value groups use `,`-joined params (`?category=payments,devtools`). `sort` validated via `isSortKey` (default `momentum`); `view` ∈ `{list, grid}` (default `list`); unknown values ignored. Used by the page (parse) + every client island (serialize a delta then `router.replace(pathname?…, {scroll:false})`).

### Result views (A1)
- **List/table (primary)**: `results-table.tsx` — semantic `<table>` with `<thead>`/`<th scope="col">` and a `<tbody>` row per problem; columns **Problem** (title; the row is a link to `/app/problems/[slug]`) · **Category** (§4.1a-tinted chip) · **Mentions** (`mention_count_60d`) · **Momentum** (`+{momentumPct}%`, ↑) · **Sources** (badges via `SourceIcon`+`resolveBadge`) · **Updated** (`relativeTime(updatedAt)`) · chevron. **A8 checkbox column**: decided at the table-build batch — omit unless the layout looks unbalanced, in which case render a visual-only inert column (flagged; 4.7 wires Compare).
- **Card grid (toggle)**: `results-grid.tsx` — `ProblemCardFull` via `toProblemCardProps(problem)`, each wrapped in a `<Link href="/app/problems/[slug]">` (the 4.2 dashboard pattern, now pointing at the authenticated detail). Same filtered/sorted `results`.

### Facet rail + chips + mobile (FR-005..009)
`facet-rail.tsx` server-renders four `facet-group.tsx` (Category 8 / Source 5 / Momentum 4 / Signals 3) — each value a labeled checkbox + its live count; the checkbox is a thin client control toggling its param. `active-filters.tsx` summarizes active values as removable chips + **Clear all** (drops the facet params; keeps `q`/`sort`/`view`). On mobile the rail is hidden and `mobile-filter-drawer.tsx` ("Filters · N") opens it in a sheet.

### Count semantics (pinned)
Drill-down counts: for facet group **G**, base set = rows passing **all groups except G** + search; `facetCounts[G][v]` = |base set ∩ rows-with-`v`|. The **result list** applies **all** groups (incl. G). This keeps sibling checkboxes in G non-zero after you check one (intuitive faceted behavior) while the result list narrows to the union you picked. `total` (header "N results") = `results.length`, always equal to the rendered row/card count (FR-004).

### Charts / bundle / motion
No charts. Islands = `library-search`, `library-sort`, `library-view-toggle`, `facet-group` checkboxes, `mobile-filter-drawer` — all thin URL-updaters. Reduced-motion handled by the global CSS reset (slice 4.3). Tokens give light/dark.

## Batching (STOP-gated; one commit per task; read-only slice)

- **Batch 0 → STOP 1 — Route + read helper + pure engine (the core).** `getLibraryProblems()` + export; `library-params.ts`; `library-filter.ts`; `app/app/library/page.tsx` rendering a minimal result count + raw list (pre-styling) to prove the pipeline. **Gate**: anonymous `/app/library` → 307 `/login`; foreground tsx probe of `filterLibrary` over the 15 (category/source/momentum/signal filters, search, sort, drill-down counts, total); typecheck/lint/build.
- **Batch A → STOP 2 — List/table primary view + header.** `results-table.tsx` + `library-header.tsx` (title, `library-search`, `library-sort`, "N results · sorted by X") wired to URL params; the A8 checkbox-column call made + flagged. **Gate**: build; `?q=`/`?sort=` deep-links filter+reorder server-side; row links to `/app/problems/[slug]`.
- **Batch B → STOP 3 — Facet rail + counts + chips + Clear all.** `facet-rail.tsx` + `facet-group.tsx` (category/source/momentum/signals + counts) + `active-filters.tsx` + Clear all, all URL-driven. **Gate**: each facet filters + drill-down counts correct (probe + build); combinable; Clear all resets.
- **Batch C → STOP 4 — Card-grid toggle + mobile drawer + empty state.** `results-grid.tsx` (reuse `ProblemCardFull`) + `library-view-toggle` (`?view=`) + `mobile-filter-drawer.tsx` + the no-match empty state. **Gate**: toggle swaps views over the same set; mobile drawer opens the rail; empty state on a no-match query.
- **Batch D → STOP 5 — Polish + a11y + gates + preview.** Light/dark parity; responsive (rail→drawer, table horizontal-scroll/stack, grid reflow); a11y (table semantics, labeled facet checkboxes, accessible sort/toggle, focus rings); CLAUDE.md §8 doc note; typecheck/lint/build; push → preview. **Gate**: founder preview checklist vs page 3.

## Slice-integrity manifest

- **NEW**: `app/app/library/page.tsx`; `components/app/library/**`; `lib/library-filter.ts` + `lib/library-params.ts`; `packages/db` `getLibraryProblems` (read-only) + `LibraryProblem` type.
- **EDIT**: `packages/db/src/queries.ts` + `index.ts` (export helper/type); `CLAUDE.md` §8 doc note + SPECKIT pointer.
- **UNCHANGED**: Tier-3 auth + `middleware.ts`; 4.1 schema/seed/migration; 4.2 shell / `dashboard-sort.ts` / `toProblemCardProps` / source registry; 4.3 detail; public routes; canonical `ProblemCardFull` logic; `getDashboardProblems` / `getProblemDetail`.

## Risks & follow-ups

- **TF-026 (new)** — real pagination / infinite scroll for the result list when live data scales the set past one page (vestigial at 15; the comp shows 12/page + pages 1–8). Out of scope here.
- **A8 checkbox column** — decided at Batch A: omit, or render an inert visual-only column if the table looks unbalanced; 4.7 wires Compare. Flag the call at STOP-2.
- **Source-facet comp divergence** — the comp lists 6 sources (incl. Product Hunt / Google Play); we render the 5 live badges (+ Forums, absent from the comp). Flag at STOP-5.
- **`getAppUser` not needed here** — the Library is global; if a saved indicator is later added (A4 reversed), the seam returns. Noted.
- **`getDashboardProblems` naming** — already returns all 15; we add a dedicated `getLibraryProblems` (projection) rather than overload it, keeping each read's shape clear.

## Process oddities (carry-forward)

- **Sandbox-verifiable**: anonymous `/app/library` (and `…?category=…` deep links) → 307 `/login?callbackUrl=…`; `pnpm build`; the **pure filter engine via tsx probe** over the seeded 15 (this slice's logic is unusually sandbox-checkable since it's a pure function); the integrity diff.
- **Founder-run on preview** (real login): the populated page — list/table, facet counts, card-grid toggle, mobile drawer — vs page 3.
- **dev == prod single Supabase** — reads only; no writes/migration. **HTTPS-token push** for the preview branch.

### STOP-5 — check against `design/Core_app.pdf` page 3 (founder, preview, light + dark + mobile)
1. Header: "Library" title, "Search problems by keyword", "Filters · N", grid/list view toggle, "N results · sorted by momentum" (real N; **no** "142,318 indexed / 87 active").
2. List/table: Problem · Category (tinted chip) · Mentions · Momentum (↑+X%) · Sources (badges) · Updated (now-relative) · chevron; row → `/app/problems/[slug]`.
3. Facet rail: Category (8, incl. Email / Comms) · Source (**5** badges — no PH/Google Play; Forums present) · Momentum (4 buckets) · Signals (3) — each with a live count; active-chip summary + Clear all.
4. Facets filter + combine; counts update; search narrows; sort reorders the **whole** set; result count == rows shown.
5. View toggle → card grid (reused `ProblemCardFull`) over the same set; deep-link `?view=grid`.
6. Mobile: rail → "Filters" drawer/sheet; table scrolls/stacks; grid reflows.
7. Empty state on a no-match query; default view shows all 15.
8. Keyboard: facet checkboxes, sort, toggle reachable; focus rings; table semantics.

## Complexity Tracking

No constitution violations — section intentionally empty.
