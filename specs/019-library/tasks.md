# Tasks: Library (Faceted Browse) — Slice 4.4

**Feature**: `specs/019-library/` | **Branch**: `019-library`
**Inputs**: plan.md · research.md · data-model.md · contracts/ui-and-data.md · quickstart.md

> ## ⛔ DON'T-IMPLEMENT GUARD — READ FIRST
> DRAFT task list for shape-approval only. Do **not** run `/speckit.implement`, write code, or commit. Execution later, **batch-by-batch, one commit per task, STOP at each gate for founder review** (pattern: slices 013–018). Founder commits on explicit go.

---

## Execution model

5 batches → 5 STOP gates. One commit per task. Read-only browse over the slice-4.1 fixtures, inside the 4.2 shell.

| Batch | STOP | Theme | Tasks | Maps to |
|---|---|---|---|---|
| 0 | 1 | Route + read helper + **pure filter engine** (testable core) | T001–T006 | US1, US2, US3, US4 (foundation) |
| A | 2 | List/table primary view + header (search/sort/count) | T007–T013 | US1, US3, US4 |
| B | 3 | Facet rail + counts + active chips + Clear all | T014–T018 | US2 |
| C | 4 | Card-grid toggle + mobile drawer + empty state | T019–T024 | US1, US2, US3 |
| D | 5 | Polish + a11y + §8 note + gates + preview | T025–T029 | cross-cutting |

**Total: 29 tasks.**

### Count cross-check matrix (slice integrity)

| Thing | Count | Where |
|---|---|---|
| New route | 1 | `app/app/library/page.tsx` |
| New library components | 11 | `components/app/library/**` (library-view, library-header, library-search, library-sort, library-view-toggle, facet-rail, facet-group, active-filters, mobile-filter-drawer, results-table, results-grid) |
| Filter engine + param codec | 2 | `lib/library-filter.ts`, `lib/library-params.ts` |
| New read-only DB helper | 1 | `getLibraryProblems` (+ `LibraryProblem` type) |
| New third-party deps / env | **0** | hand-rolled table + filter engine (§9.5) |
| Schema / seed / migration | **0** | read-only over 4.1 |
| Client islands | **5** | `library-search`, `library-sort`, `library-view-toggle`, `facet-group` checkboxes, `mobile-filter-drawer` |

---

## Standing constraints (apply to EVERY task)

- **Pure engine = sandbox-verifiable (the headline of this slice).** `filterLibrary` is a pure server-side function; **STOP-1 MUST include the tsx probe output** exercising every facet (category/source/momentum/signal), search, each sort, and the drill-down counts + `total === results.length` over the seeded 15. This is the part we verify rigorously rather than by preview eyeball.
- **No `getAppUser`.** The Library is global (all 8 categories, display-only per A4) — no user-scoped data, **no seam**, and **no change at the Tier-5.5 flip** (it was never user-scoped). The auth gate stays in `app/app/layout.tsx`.
- **§9.5 no new dep.** Hand-rolled `<table>` + hand-rolled filter engine — no table/filter/query library.
- **5-source facet delta.** Source facet = the 5 live badges via `@bristle/shared` `resolveBadge`/`SOURCE_BADGES` (GitHub, Hacker News, Stack Exchange, App Store, **Forums**) — **no Product Hunt / Google Play**. Counts = problems carrying that source. The comp lists 6 (incl. PH/GP) — **flag the divergence at STOP-5**.
- **Real counts, no scale literal.** Every facet count = results that value yields; header "N results" = the matching set; `total === results.length` (FR-004). **No** "142,318 indexed / 87 active". Counts recompute as facets/search narrow. **Drill-down semantics**: `facetCounts[G][v]` over (all-other-groups + search) ∩ `v`; the result list applies all groups. **0-count values render gray/disabled** (not broken); a no-match set renders a **dry empty state**.
- **A1 dual-view.** List/table is primary (new component, matches page 3); grid is the toggle, **reusing `ProblemCardFull` + `toProblemCardProps`**; both render the **same** filtered/sorted set; view persists in `?view=` — **no `localStorage`** (§9.6).
- **Reuse (A9), no duplication.** Sort via `dashboard-sort.ts` `sortProblems`/`isSortKey`; badges/category via `resolveBadge`/`SOURCE_BADGES`/`CATEGORY_LABELS` + the 8-key catalog; the 4.2 `toProblemCardProps`.
- **RSC-first, URL-state.** The page is a Server Component reading `searchParams`; filtering/sorting/counting happen server-side; client islands only update the URL (`router.replace`, `scroll:false`). Tokens-only, kebab files, lucide 1.5px, plain voice.

---

## Phase / Batch 0 — Route + read helper + pure engine → **STOP 1**

**Goal:** the data + logic pipeline works end-to-end behind a minimal render. **Independent test:** the tsx probe shows correct results/counts for every facet/search/sort over the 15; anonymous `/app/library` → login.

- [ ] **T001** Add read-only `getLibraryProblems(): Promise<LibraryProblem[]>` to `packages/db/src/queries.ts` — `LibraryProblem = Problem & { hasWtpSignal, hasExistingSolution, searchText }`; assemble from `problems` + `wtp_signals` presence + `existing_solutions` presence + `problem_quotes` text; `searchText = lowercase(title + resolveBadge labels of sources + all quote text)`. Read-only; no schema change.
- [ ] **T002** Export `getLibraryProblems` + the `LibraryProblem` type from `packages/db/src/index.ts`. **Sequential after T001 (same package).**
- [ ] **T003** [P] Create `apps/web/src/lib/library-params.ts` — `LibraryQuery` type + `parseLibraryQuery(searchParams)` + `toSearchParams(query)`; multi-value `,`-joined (`?category=&source=&momentum=&signal=&q=&sort=&view=`); `sort` via `isSortKey` (default `momentum`); `view` `list|grid` (default `list`); unknowns ignored.
- [ ] **T004** [P] Create `apps/web/src/lib/library-filter.ts` — **pure** `filterLibrary(rows, query) → {results, facetCounts, total}`: predicates (category ∈ / source badges intersect via `resolveBadge` / momentum `gte100·p25to99·flat·new<30d` / signals `hasWtp·hasSolution·demandStatus==="validated"` / `searchText.includes`); intersection-across-groups + union-within-group; sort via reused `sortProblems(results, sort, wtpCounts)`; **drill-down** `facetCounts`; `total === results.length`.
- [ ] **T005** Create the route `apps/web/src/app/app/library/page.tsx` — async RSC, Next 15 `searchParams: Promise<…>`; `parseLibraryQuery` → `getLibraryProblems()` → `filterLibrary()` → **minimal render** (result count + raw title list, pre-styling) inside `app/app/layout.tsx`. **No `getAppUser`**; no middleware/auth edit.
- [ ] **T006** **STOP 1 gate** — `pnpm --filter web typecheck && lint && build`; anonymous `GET /app/library` → 307 `/login?callbackUrl=/app/library`; **foreground tsx probe of `filterLibrary`** over the 15 (every facet, search, each sort, drill-down counts, `total===results.length`). **The STOP-1 report MUST paste the probe output.** Hold for review.

---

## Phase / Batch A — List/table primary view + header → **STOP 2**

**Goal:** the styled list/table + header (search/sort/count) over the filtered set, URL-driven. **Independent test:** `?q=`/`?sort=` deep-links filter + reorder; rows link to the detail.

- [ ] **T007** [P] [US1] Create `apps/web/src/components/app/library/results-table.tsx` — semantic `<table>` (`<thead>`/`<th scope="col">` + `<tbody>` row/problem): **Problem** (title; the row links `/app/problems/[slug]`) · **Category** (§4.1a-tinted chip, `CATEGORY_LABELS`) · **Mentions** (`mentionCount60d`) · **Momentum** (`↑ +{momentumPct}%`) · **Sources** (`SourceIcon` per `resolveBadge` badge) · **Updated** (`relativeTime(updatedAt)`) · chevron. **A8**: decide the checkbox column — omit, or inert visual-only if unbalanced — **flag the call at STOP-2**.
- [ ] **T008** [P] [US1] Create `apps/web/src/components/app/library/library-header.tsx` — "Library" title + "N results · sorted by X" (real `total`, **no** scale literal); slots for search + sort + view-toggle.
- [ ] **T009** [P] [US3] Create the client island `apps/web/src/components/app/library/library-search.tsx` (`"use client"`) — search input → `?q=` via debounced `router.replace` (`scroll:false`).
- [ ] **T010** [P] [US4] Create the client island `apps/web/src/components/app/library/library-sort.tsx` (`"use client"`) — sort control (Momentum/Frequency/Newest/WTP, `isSortKey`) → `?sort=`.
- [ ] **T011** [US1] Create `apps/web/src/components/app/library/library-view.tsx` — composer: `<LibraryHeader>` (with search + sort) + a facet-rail placeholder (Batch B) + `<ResultsTable>`.
- [ ] **T012** [US1] Wire `page.tsx` to render `<LibraryView query results facetCounts total />` (replace the Batch-0 minimal render).
- [ ] **T013** **STOP 2 gate** — `typecheck && lint && build`; `?q=webhook` filters + `?sort=wtp` reorders the whole set server-side; rows link to `/app/problems/[slug]`; **report the A8 checkbox-column call**. Hold for review.

---

## Phase / Batch B — Facet rail + counts + chips + Clear all → **STOP 3**

**Goal:** the four facet groups filter + combine with live drill-down counts; chips + Clear all. **Independent test:** Category=Payments narrows + count updates; add Source=GitHub narrows further; Clear all → 15.

- [ ] **T014** [US2] Create the client island `apps/web/src/components/app/library/facet-group.tsx` (`"use client"`) — one group's labeled checkboxes + live counts; toggling a value updates its `?param`; **0-count values render gray/disabled** (not broken).
- [ ] **T015** [US2] Create `apps/web/src/components/app/library/facet-rail.tsx` — server-renders the 4 groups: **Category** (8, incl. Email / Comms) · **Source** (5 live badges via `SOURCE_BADGES` — no PH/GP, Forums present) · **Momentum** (4 buckets) · **Signals** (3: WTP / existing-solution / validated-demand), each fed its `facetCounts`.
- [ ] **T016** [P] [US2] Create `apps/web/src/components/app/library/active-filters.tsx` — active-filter chips (removable) + "Filters · N" summary + **Clear all** (drops the facet params; keeps `q`/`sort`/`view`).
- [ ] **T017** [US2] Wire `<FacetRail>` + `<ActiveFilters>` into `library-view.tsx` (replace the placeholder).
- [ ] **T018** **STOP 3 gate** — each facet filters + combines (intersection across, union within); drill-down counts correct + 0-count values gray; Clear all resets facets; **tsx probe re-run** + `typecheck && lint && build`. Hold for review.

---

## Phase / Batch C — Card-grid toggle + mobile drawer + empty state → **STOP 4**

**Goal:** the grid toggle over the same set, the mobile filter drawer, and the no-match empty state. **Independent test:** `?view=grid` shows cards over the same results; mobile "Filters" opens the rail; a no-match query shows the empty state.

- [ ] **T019** [P] [US1] Create `apps/web/src/components/app/library/results-grid.tsx` — grid view: `ProblemCardFull` via `toProblemCardProps(problem)`, each wrapped in `<Link href="/app/problems/[slug]">`; same filtered/sorted `results`.
- [ ] **T020** [P] [US1] Create the client island `apps/web/src/components/app/library/library-view-toggle.tsx` (`"use client"`) — list|grid → `?view=` (default `list`).
- [ ] **T021** [US1] In `library-view.tsx`, render `<ResultsTable>` or `<ResultsGrid>` by `query.view`; add the view-toggle to the header.
- [ ] **T022** [P] [US2] Create the client island `apps/web/src/components/app/library/mobile-filter-drawer.tsx` (`"use client"`) — "Filters · N" button → sheet wrapping `<FacetRail>` on mobile (rail hidden on mobile, drawer shown).
- [ ] **T023** [US3] Add the dry empty state ("No problems match these filters.") to `library-view.tsx` when `total === 0`.
- [ ] **T024** **STOP 4 gate** — `?view=grid` swaps to cards over the same set; mobile drawer opens the rail; no-match → empty state + count 0; default → all 15; `typecheck && lint && build`. Hold for review.

---

## Phase / Batch D — Polish + a11y + §8 + gates + preview → **STOP 5**

**Goal:** light/dark + responsive + a11y; gates green; preview for the page-3 walk. **Independent test:** the STOP-5 page-3 checklist (founder-run).

- [ ] **T025** Light/dark parity (existing tokens); mobile-responsive (rail → drawer, table horizontal-scroll/stack, grid reflow).
- [ ] **T026** A11y — semantic table (`<thead>`/`<th scope>`, row link), labeled facet checkboxes, accessible sort + view-toggle, labeled search input, focus rings.
- [ ] **T027** `CLAUDE.md` §8 doc-only note — the `/app/library` browse + `getLibraryProblems` + the pure `filterLibrary` engine + the URL-param convention + the **no-seam** note + the **TF-026** pointer. **Documentation only — no rule change.**
- [ ] **T028** Gates + bundle — `pnpm typecheck && lint && build` 4/4; per-route First Load JS for `/app/library` (RSC-first; islands = search/sort/view-toggle/facet-checkbox/mobile-drawer).
- [ ] **T029** **STOP 5 gate** — push branch (HTTPS-token) → Vercel preview. **Verification split:** automated (sandbox) = anonymous `/app/library` + deep-link `callbackUrl` redirect + build + the `filterLibrary` tsx probe + gates + integrity diff; **founder-run** (preview) = the page-3 checklist below. Report the preview URL + the 8-item list; **flag the source-facet comp divergence** (comp 6 incl PH/GP; we render 5 + Forums). Hold for review.

### STOP-5 — check against `design/Core_app.pdf` page 3 (founder, preview, light + dark + mobile)
1. Header: "Library", "Search problems by keyword", "Filters · N", grid/list toggle, "N results · sorted by momentum" (real N; **no** "142,318 indexed / 87 active").
2. List/table: Problem · Category (tinted chip) · Mentions · Momentum (↑+X%) · Sources (badges) · Updated (now-relative) · chevron; row → `/app/problems/[slug]`.
3. Facet rail: Category (8, incl. Email / Comms) · Source (**5** badges — no PH/Google Play; Forums present) · Momentum (4) · Signals (3); each with a live count; chips + Clear all.
4. Facets filter + combine; counts update (0-count gray); search narrows; sort reorders the **whole** set; result count == rows shown.
5. View toggle → card grid (reused `ProblemCardFull`) over the same set; deep-link `?view=grid`.
6. Mobile: rail → "Filters" drawer/sheet; table scrolls/stacks; grid reflows.
7. Empty state on a no-match query; default shows all 15.
8. Keyboard: facet checkboxes, sort, view-toggle reachable; focus rings; table semantics.

---

## Dependencies & parallelism

- **Batch order strict** (0 → A → B → C → D); STOP-gated.
- **Batch 0:** T001 → T002 sequential (same package). T003 (`library-params`) ∥ T004 (`library-filter`) — separate files `[P]`. T005 depends on T001–T004.
- **Batch A:** T007/T008/T009/T010 are `[P]` (separate files); T011 (composer) depends on them; T012 wires the page.
- **Batch B:** T016 `[P]`; T014 → T015 (rail uses the group) → T017 (wire).
- **Batch C:** T019/T020/T022 `[P]`; T021 + T023 wire into `library-view`.
- The **engine (T004) + params (T003) + helper (T001)** are the spine — every view/facet task consumes them.

## Slice-integrity manifest

- **NEW**: `app/app/library/page.tsx`; `components/app/library/**` (11); `lib/library-filter.ts` + `lib/library-params.ts`; `packages/db` `getLibraryProblems` + `LibraryProblem` (read-only).
- **EDIT**: `packages/db/src/queries.ts` + `index.ts`; `CLAUDE.md` §8 doc note + SPECKIT pointer.
- **UNCHANGED**: Tier-3 auth + `middleware.ts`; 4.1 schema/seed/migration; 4.2 shell / `dashboard-sort.ts` / `toProblemCardProps` / source registry; 4.3 detail; public routes; `ProblemCardFull` logic; `getDashboardProblems` / `getProblemDetail`.

## Risks & follow-ups

- **TF-026 (new)** — real pagination / infinite scroll when live data scales the result set (vestigial at 15; comp shows 12/page). Out of scope.
- **A8 checkbox column** — decided at Batch A (omit vs inert visual-only); 4.7 wires Compare. Flag at STOP-2.
- **Source-facet comp divergence** — comp 6 (incl. PH/GP); we render 5 (+ Forums). Flag at STOP-5.
- **No-seam** — the Library never resolves a user; nothing changes at the Tier-5.5 flip.

## Process oddities (carry-forward)

- **Sandbox-verifiable** (unusually high for a UI slice): anonymous `/app/library` (+ deep-link `callbackUrl`) → 307 `/login`; `pnpm build`; the **pure `filterLibrary` tsx probe** over the 15; integrity diff. **Founder-run on preview**: the populated page vs page 3.
- **dev == prod single Supabase** — reads only. **HTTPS-token push** for the preview branch.

---

> Reminder: **DRAFT only.** No code, no `/speckit.implement`, no commit until the founder approves the shape and says go — then Batch 0, one commit per task, STOP at gate 1 (with the probe output).
