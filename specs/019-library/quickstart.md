# Quickstart: Slice 4.4 (Library)

Read-only faceted browse over the slice-4.1 fixtures, inside the 4.2 shell. No new env/deps/schema/seed. One read-only `packages/db` helper; everything else is `apps/web`. URL-param-driven, RSC-first.

## 0. Route + read helper + pure engine (Batch 0 / STOP 1)
```bash
# packages/db: getLibraryProblems(): Promise<LibraryProblem[]>  (Problem + hasWtpSignal + hasExistingSolution + searchText) + export
# lib/library-params.ts: parseLibraryQuery / toSearchParams (?category=&source=&momentum=&signal=&q=&sort=&view=)
# lib/library-filter.ts: filterLibrary(rows, query) → {results, facetCounts, total}  (PURE, server-side)
# app/app/library/page.tsx: RSC — await searchParams → getLibraryProblems → filterLibrary → minimal render (count + raw list)
pnpm --filter web typecheck && lint && build
# Verify (HTTP): anonymous /app/library → 307 /login?callbackUrl=/app/library
# Foreground tsx probe of filterLibrary over the 15: category=payments → only payments; source=forum; momentum gte100;
#   signal=validated (→3); q="webhook"; sort=wtp reorders; drill-down facet counts; total == results.length.
```

## 1. List/table primary view + header (Batch A / STOP 2)
```bash
# components/app/library: results-table.tsx (semantic <table>; Problem·Category·Mentions·Momentum·Sources·Updated·›;
#   row → /app/problems/[slug]) + library-header.tsx (title, library-search island, library-sort island, "N results · sorted by X")
# A8: decide the checkbox column (omit, or inert visual-only) — flag the call.
pnpm build
# ?q=webhook and ?sort=wtp deep-links filter + reorder server-side; rows link to the 4.3 detail.
```

## 2. Facet rail + counts + chips (Batch B / STOP 3)
```bash
# facet-rail.tsx + facet-group.tsx (Category 8 / Source 5 / Momentum 4 / Signals 3 + live counts; checkbox island → ?param)
#   + active-filters.tsx (chips + Clear all)
pnpm build
# Each facet filters + combines (intersection across, union within); counts are drill-down; Clear all resets facets.
```

## 3. Card-grid toggle + mobile drawer + empty state (Batch C / STOP 4)
```bash
# results-grid.tsx (ProblemCardFull via toProblemCardProps, /app link) + library-view-toggle (?view=) + mobile-filter-drawer.tsx
#   + no-match empty state
pnpm build
# ?view=grid swaps to cards over the SAME filtered set; mobile "Filters" opens the rail sheet; no-match → empty state, count 0.
```

## 4. Polish + gates + preview (Batch D / STOP 5)
```bash
pnpm typecheck && lint && build           # 4/4
# Light/dark; responsive (rail→drawer, table scroll/stack, grid reflow); a11y (table semantics, labeled checkboxes,
#   accessible sort/toggle, focus rings). CLAUDE.md §8 doc note.
# Push → preview. Founder-run: the populated page vs page 3 (sandbox can't hold a session).
```

## 5. Done-when
SC-001…008: /app/library gated + in shell + all 15 default (8 categories); each facet filters + combinable + Clear all + counts == results; search by title/source/quote; sort reorders the whole set; result count == rows; rows/cards → /app/problems/[slug] via the 4.2 adapter (forum badge); 5-source facet (no PH/GP); page-3 light/dark + mobile drawer; gates green; diff = apps/web + one read-only packages/db helper (no schema/seed).

## 6. Process oddities
dev==prod single Supabase (read-only); the filter engine is a PURE function → unusually sandbox-testable via tsx probe; the populated page is founder-run on preview (sandbox can't auth); anonymous /app/library→login + deep-link callbackUrl ARE HTTP-verifiable; RSC-first (islands = search/sort/view-toggle/facet-checkbox/mobile-drawer); HTTPS-token push. Follow-up TF-026: real pagination when live data scales the set.
