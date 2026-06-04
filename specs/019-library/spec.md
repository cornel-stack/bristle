# Feature Specification: Library (Faceted Browse)

**Feature Branch**: `019-library`

**Created**: 2026-06-04

**Status**: Draft

**Slice**: 4.4 (Tier 4 — App with Fixtures), third authenticated screen

**Input**: User description: "Slice 4.4 — the Library / browse view at `/app/library`: faceted browse / filter / search over all 15 slice-4.1 fixtures (all 8 categories, not the dashboard's top-six or 7-watched), inside the slice-4.2 app shell. Read-only over the fixtures via `packages/db` read helpers. No schema or seed changes. Reuse the 4.2 shell, card adapter + canonical ProblemCard, the 4.2 sort logic, and the 4.1 source registry. Cards link to `/app/problems/[slug]` (4.3)."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the whole problem set (Priority: P1)

A signed-in builder opens the Library and sees **every** seeded problem — all 15, across all 8 categories (including Email / Comms, which the dashboard's watched view hides) — in a scannable result view inside the app shell, sorted by momentum by default, with a running result count.

**Why this priority**: The Library is the canonical "see everything" surface — the dashboard shows a curated top-six; this is where the user browses the full corpus. Without it, there's no way to reach the 8th category or the problems below the dashboard fold.

**Independent Test**: Sign in, open `/app/library`, confirm all 15 problems render (default sort momentum), the result count reads "15", and the Email / Comms problem (SES bounce) is present.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open `/app/library`, **Then** all 15 problems render inside the 4.2 shell, default-sorted by momentum, with a result count of 15.
2. **Given** an anonymous visitor, **When** they request `/app/library`, **Then** they are redirected to sign-in.
3. **Given** the result view, **When** a problem row/card is activated, **Then** it navigates to `/app/problems/[slug]` (the 4.3 detail).

---

### User Story 2 — Narrow the set with facets (Priority: P1)

The user filters the corpus with a facet rail: **Category** (8, each with a count), **Source** (the 5 live badges, each with a count), **Momentum** (4 buckets: +100%+, +25–99%, flat/declining, new <30d, each with a count), and **Signals** (has-WTP / has-existing-solution / validated-demand, each with a count). Facets combine, and a single action clears them all.

**Why this priority**: Faceted filtering is the core job of a browse surface — "show me the validated-demand payments problems from GitHub." It's the screen's reason to exist beyond a flat list.

**Independent Test**: Check Category=Payments → only payments problems show and the count updates; add Source=GitHub → the set narrows further; "Clear all" → back to 15.

**Acceptance Scenarios**:

1. **Given** the facet rail, **When** the user selects a category facet, **Then** only problems in that category show and the result count updates to match.
2. **Given** multiple facets selected across groups, **When** applied, **Then** the result set is the intersection across groups (a problem must match each active group) and the union within a group (any selected value in that group).
3. **Given** the Signals "has WTP" facet, **When** enabled, **Then** genuine-0-WTP problems (e.g. pgvector) drop out.
4. **Given** active facets, **When** "Clear all" is used, **Then** all facets reset and the full 15 return.
5. **Given** any facet, **When** rendered, **Then** its count equals the number of results that facet value yields, and the facets show only the 5 live sources (no Product Hunt / Google Play) and all 8 categories.

---

### User Story 3 — Search the set (Priority: P2)

The user types a keyword; the result set narrows to problems whose **title, source, or quote text** matches, combined with any active facets and the current sort.

**Why this priority**: Search is the fast path when the user knows roughly what they're after; it complements facets.

**Independent Test**: Search "webhook" → only matching problems show; the result count reflects the matches; clearing the search restores the facet-filtered set.

**Acceptance Scenarios**:

1. **Given** the search field, **When** the user enters a term, **Then** the set narrows to problems matching the term in title, source, or quote text, and the count updates.
2. **Given** an active search + active facets, **When** both apply, **Then** the result is the intersection of both.
3. **Given** a search with no matches, **When** applied, **Then** an empty-state message shows (not a broken/blank area) and the count reads 0.

---

### User Story 4 — Sort the filtered set (Priority: P2)

The user changes the sort (Momentum / Frequency / Newest / Willingness-to-pay); the **entire filtered/searched set** reorders — not a truncated slice.

**Why this priority**: Sort lets the user prioritize the browse by the dimension they care about. It must reorder the full matching set (the dashboard's top-six truncation is wrong here).

**Independent Test**: With all 15 shown, switch sort to WTP → WTP-signal problems lead; switch to Newest → most-recently-first-seen leads; the full set reorders each time.

**Acceptance Scenarios**:

1. **Given** the result set, **When** the sort control changes, **Then** the full filtered set reorders by that key (reusing the 4.2 sort ordering), with no truncation.
2. **Given** a filtered subset, **When** the sort changes, **Then** only the subset reorders and the count is unchanged.

---

### Edge Cases

- **Result view shape (table vs cards)**: `design/Core_app.pdf` page 3 shows a **list/table** as the primary result view, with a **grid/list view toggle** — not a card grid. The brief says "canonical ProblemCards." Reconciled in Assumption **A1**.
- **Established-scale numbers vs the real 15**: the comp shows large aggregates ("142,318 problems indexed", "87 active", facet counts like Devtools 142, Sources 62/38/26, Signals 33/58/12, "Showing 12 of 87"). We have 15 fixtures. Reconciled in **A2** (live counts everywhere; the indexed headline is an optional static literal).
- **Source facet delta**: the comp lists 6 sources incl. Product Hunt / Google Play; we render the 5 live registry badges (GitHub, Hacker News, Stack Exchange, App Store, Forums) — no PH/GP. (**A6**.)
- **Signals facet breadth**: the comp shows 3 signal options; the brief named only "has WTP". Reconciled in **A7** (render all 3, each data-backed).
- **Row selection checkboxes**: the comp's table rows carry a selection checkbox (feeds Compare, slice 4.7). Out of scope here (**A8**).
- **No matches** (search/facets): explicit empty state, count 0.
- **"New (under 30 days)" bucket**: a recency facet (by first-seen), grouped under Momentum per the comp; orthogonal to the percent buckets, so a problem may match both.
- **Mobile**: the facet rail collapses to a drawer/sheet.

---

## Requirements *(mandatory)*

### Functional Requirements

**Route, gating, shell**

- **FR-001**: The system MUST serve a Library page at `/app/library`, gated by the existing `/app` auth, rendered inside the slice-4.2 app shell.
- **FR-002**: By default (no facets, no search) the Library MUST show **all 15** seeded problems across **all 8** categories, sorted by momentum.

**Header**

- **FR-003**: The header MUST present: the title, a search field, a sort control (Momentum / Frequency / Newest / Willingness-to-pay), and a result count that reflects the currently shown set.
- **FR-004**: The result count and the count of rendered results MUST always agree (no chip/total that disagrees with what's shown).

**Facets**

- **FR-005**: A **Category** facet MUST list all 8 categories, each with the count of matching problems; selecting categories filters the set.
- **FR-006**: A **Source** facet MUST list the 5 live registry badges (GitHub, Hacker News, Stack Exchange, App Store, Forums — resolved via the source registry; no Product Hunt / Google Play), each with a count; selecting sources filters to problems carrying those sources.
- **FR-007**: A **Momentum** facet MUST offer 4 options — +100% or higher, +25% to +99%, flat or declining, new (under 30 days) — each with a count; selecting them filters the set.
- **FR-008**: A **Signals** facet MUST offer has-WTP-signal, has-existing-solution, and validated-demand, each with a count; selecting them filters the set (enabling has-WTP drops genuine-0-WTP problems).
- **FR-009**: Facets MUST combine as intersection-across-groups / union-within-group, and a single **Clear all** action MUST reset every facet (and is offered only when at least one is active).
- **FR-010**: Each facet value's count MUST equal the number of results that value yields against the real fixtures.

**Search**

- **FR-011**: A search input MUST filter the set by matching the term against problem **title, source, and quote text**, combined with active facets.

**Sort + results**

- **FR-012**: The sort control MUST reorder the **entire** filtered/searched set using the slice-4.2 sort ordering (Momentum / Frequency / Newest / WTP) — never a top-N truncation.
- **FR-013**: Results MUST render every matching problem (no hidden truncation); each result links to `/app/problems/[slug]`.
- **FR-014**: Each result MUST present the problem's title, category, mentions, momentum, source badges (via the 4.2 card adapter / registry — forum badge included), and updated time (now-relative per TF-023).
- **FR-015**: A no-match result set MUST render an explicit empty state.

**Data + integration**

- **FR-016**: All content MUST come from the slice-4.1 fixtures via read-only `packages/db` helpers. The slice MUST NOT change schema, migrations, or seed. If a required field is absent, work STOPS and the gap is surfaced.
- **FR-017**: The slice MUST reuse the slice-4.2 sort logic, the slice-4.2 card adapter + canonical ProblemCard (for the card/grid presentation), and the slice-4.1 source registry — no parallel/duplicate sort, badge, or category mapping.

**Presentation**

- **FR-018**: The page MUST match `design/Core_app.pdf` page 3 within tolerance in Editorial Light and Dark, and be mobile-responsive — the facet rail collapses to a drawer/sheet.

### Key Entities *(read-only, from slice 4.1)*

- **Problem**: title, slug, category, `momentum_pct`, `mention_count_60d`, `first_seen_at` / `updated_at`, per-row `sources`, top quote — the row/card subject and the basis for category/source/momentum facets and sort.
- **Category**: the 8-key catalog (label, tint) — the Category facet.
- **Problem Source**: per-source presence/counts — the Source facet + badges.
- **WTP Signal** (nullable), **Existing Solution** (presence), **demand_status** (=validated) — the three Signals facets.
- **Problem Quote**: quote text — a search target.
- **User (demo)**: resolved by the `getAppUser()` seam (for any saved-state, A4); determines whose data, not whether gated.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/app/library` renders, gated, inside the 4.2 shell, showing all 15 problems by default (0 missing; all 8 categories represented).
- **SC-002**: Each facet (category, source, momentum, signals) filters correctly and combinably; "Clear all" returns the full 15; every facet count equals its result count.
- **SC-003**: Search narrows the set by title / source / quote text and the count updates; a no-match search shows an empty state with count 0.
- **SC-004**: Changing the sort reorders the entire filtered set (verified: WTP-first and Newest-first orderings differ and include all matching results, not a top-6 slice).
- **SC-005**: The header result count always equals the number of results shown, across any facet/search/sort combination.
- **SC-006**: Every result links to `/app/problems/[slug]`; cards/badges render via the 4.2 adapter (forum badge included); the source facet shows exactly the 5 live badges.
- **SC-007**: The page matches `design/Core_app.pdf` page 3 within tolerance in light + dark and is usable on mobile (facet rail → drawer/sheet).
- **SC-008**: Gates pass; the change set is confined to `apps/web` + read-only `packages/db` helpers — no schema/migration/seed change.

---

## Assumptions

> Defaults chosen per the design + prior-slice precedent; **[DECISION — confirm]** items are surfaced before `/speckit.plan`.

- **A1 — Result view: list/table primary + card-grid toggle (default).** Page 3's primary result view is a **list/table** (columns: problem · category · mentions · momentum · sources · updated · chevron) with a **grid/list view toggle**, not a card grid. The brief says "canonical ProblemCards." Default: build the **list/table as the primary view** (matching the comp — a new in-app row component) **and** a **card-grid toggle that reuses the slice-4.2 `ProblemCardFull` + adapter**. This honors both the visual contract and the card-reuse intent. **[DECISION — confirm]** (A) list primary + card-grid toggle [recommended, matches comp]; (B) card grid only [matches the brief's wording, diverges from page 3]; (C) list/table only [no card reuse].
- **A2 — Counts: live and consistent everywhere; "indexed" as an optional static headline.** Every facet count, the result count, and the total reflect the **real matching set over the 15**. The comp's large aggregates ("142,318 indexed", "87 active", Devtools 142, etc.) are not rendered as functional counts — at most, "**142,318 problems indexed**" is kept as a **separate non-functional headline literal** (like the dashboard's "87 problems match" literal), clearly distinct from the live "N results". **[DECISION — confirm]** keep the indexed headline literal, or drop it for honesty.
- **A3 — Filter mechanism: URL-param-driven (default).** Facets/search/sort serialize to the URL query (`?category=…&source=…&q=…&sort=…`) so filtered views are deep-linkable and shareable, with minimal client JS (a small client island for the inputs). **[DECISION — confirm]** URL-param RSC vs. a single client-side filter island over the fetched 15.
- **A4 — Cards display-only (default), like the dashboard.** Library rows/cards do **not** reflect saved state this slice (the comp's rows show no saved affordance; the Save action lives on the detail + Saved screen). The `getSavedProblemIds` helper exists if you want a saved indicator. **[DECISION — confirm]** display-only vs. show a saved indicator.
- **A5 — Pagination: render all matching (default).** The comp shows "Showing 12 of 87" + pages 1–8 (12/page). At 15 fixtures, default is to **render all matching results** with no pagination control (the result count carries the "how many"). **[DECISION — confirm]** render-all [recommended] vs. a real 12-per-page pagination (2 pages for 15) to mirror the comp's control.
- **A6 — 5-source facet delta holds.** The Source facet lists the 5 live registry badges (GitHub, Hacker News, Stack Exchange, App Store, Forums); the comp's Product Hunt / Google Play are not rendered, and Forums (absent from the comp's list) is included — the standing delta.
- **A7 — Signals facet = 3, all data-backed.** The comp shows three signal options; the brief named only WTP. Default: render all three — **has WTP signal** (a `wtp_signals` row exists), **has existing solution** (`existing_solutions` rows exist), **validated demand** (`demand_status = validated`) — with live counts. **[DECISION — confirm]** all three vs. WTP only.
- **A8 — Row selection checkboxes out of scope.** The comp's per-row checkbox feeds Compare (slice 4.7); not built here (omit, or render visual-only and inert). Default: omit until 4.7.
- **A9 — Reuse confirmed (A1 of the brief's reuse list).** Sort via `dashboard-sort.ts` `sortProblems`; badges/category via the 4.2 adapter + `@bristle/shared` registry; categories via the 8-key catalog. No duplication.
- **A10 — Read helper(s).** The Library needs the full 15 (a `getLibraryProblems()` / reuse of an existing all-problems read) plus the facet inputs (categories with counts, per-source presence, WTP/solution/demand flags, quote text for search). These are read-only `packages/db` helpers (or reuse of existing ones); no schema change. Exact read shape pinned at plan time.

## Dependencies

- Slice 4.1 (016) fixtures + categories catalog — the data + facet sources.
- Slice 4.2 (017) app shell, `getAppUser()` seam, sort lib, card adapter, source registry — the frame + reused logic.
- Slice 4.3 (018) `/app/problems/[slug]` — the card/row link target.
- `design/Core_app.pdf` page 3 — the visual contract.
