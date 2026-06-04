# Feature Specification: Problem Detail (Authenticated)

**Feature Branch**: `018-problem-detail`

**Created**: 2026-06-04

**Status**: Draft

**Slice**: 4.3 (Tier 4 — App with Fixtures), second authenticated screen

**Input**: User description: "Slice 4.3 — the Problem Detail page at `/app/problems/[slug]`, rendering everything `design/Core_app.pdf` page 2 shows for a single problem, inside the slice-4.2 app shell. Read-only UI over the slice-4.1 fixtures via `packages/db` read helpers (`getProblemDetail` already returns the problem + all child sets). No schema or seed changes. Reuse/extend the slice-2.6 public sample-report detail layout — share components, don't duplicate. Closes TF-021 (re-point dashboard cards to this authenticated route)."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Read a problem's full report inside the app (Priority: P1)

A signed-in builder clicks a problem card on the dashboard and lands on that problem's detail page. They see the editorial header (breadcrumb, category, demand status, first-seen/updated, title, momentum, sources, and a "N quotes · N sources · N willingness-to-pay mentions" summary) and the full evidence-backed report — synthesis, frequency, the quotes themselves, existing solutions, willingness-to-pay, related problems, and recent activity — all drawn from the seeded fixtures, rendered inside the persistent app shell (sidebar + top bar).

**Why this priority**: This is the slice. It is the second authenticated screen and the place where the product's core promise — "a problem worth solving, with evidence, not vibes" — is delivered as an editorial artifact. Without it the dashboard cards lead nowhere inside the app.

**Independent Test**: Sign in (preview, real account), open `/app/problems/stripe-webhook-reliability` (the hero), and confirm the header plus all seven content regions render fully populated from fixtures, inside the shell, in light and dark.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open `/app/problems/[slug]` for any of the 15 seeded problems, **Then** the page renders inside the 4.2 shell with the full header and all seven content regions populated from that problem's fixtures.
2. **Given** the hero problem (Stripe webhook reliability), **When** the detail page loads, **Then** every region is exhaustively populated (synthesis paragraphs, frequency series, full quote list, solutions, WTP, personas, related, activity) — the showcase state.
3. **Given** an anonymous visitor, **When** they request `/app/problems/[slug]`, **Then** they are redirected to sign-in (the existing `/app` gate), never seeing problem data.
4. **Given** an unknown slug, **When** requested, **Then** the app returns its not-found treatment rather than a broken page.

---

### User Story 2 — Move between the seven tabs (Priority: P2)

On the detail page the report is organized into seven tabs — Synthesis, Frequency, Evidence (with a count), Solutions (with a count), WTP (with a count), Related, and Activity. The reader switches tabs with mouse or keyboard, and can link directly to a tab (e.g. share a URL that opens straight to Evidence).

**Why this priority**: The tabbed structure is how a skeptical reader navigates the evidence without scrolling past what they don't need. Deep-linkable tabs make a specific piece of evidence shareable. It builds on US1's rendered content.

**Independent Test**: Load the page, tab through all seven panels by keyboard, and load `…?tab=evidence` directly to confirm it opens on the Evidence panel.

**Acceptance Scenarios**:

1. **Given** the detail page, **When** the user activates each of the seven tabs, **Then** the corresponding panel's content shows and the others are hidden, with the Evidence/Solutions/WTP tab labels showing their fixture counts.
2. **Given** keyboard-only navigation, **When** the user moves focus to the tab strip and uses arrow/enter keys, **Then** tabs are reachable and operable without a mouse, with a visible focus ring.
3. **Given** a URL with `?tab=evidence` (or any of the seven tab keys), **When** the page loads, **Then** it opens with that tab active; an absent or unrecognized value falls back to the default tab.

---

### User Story 3 — Orient with the persistent right rail (Priority: P2)

Alongside the tabs, a right rail stays visible across all tabs: a SOURCES donut over the five live sources with a legend, a willingness-to-pay summary panel, a "Who's complaining" persona breakdown with proportion bars, and a related-problems list.

**Why this priority**: The rail is the at-a-glance evidence frame that stays put while the reader explores tabs — it answers "where is this coming from, who's saying it, is anyone willing to pay" without a tab switch.

**Independent Test**: On the hero problem, confirm the rail renders the donut (five source slices summing to the source count), the WTP panel, the persona bars, and the related list — and that it stays put when tabs change.

**Acceptance Scenarios**:

1. **Given** the detail page, **When** it renders, **Then** the rail shows the donut + legend over the five live sources, the WTP panel, the persona breakdown, and the related list.
2. **Given** the donut, **When** rendered, **Then** its slice values sum to the problem's total source/quote count shown in the header summary (the donut and the "N sources" claim agree).
3. **Given** a problem with no willingness-to-pay signal (e.g. the pgvector problem), **When** the rail renders, **Then** the WTP panel shows a genuine empty/zero state — not a broken or blank panel.
4. **Given** the user switches tabs, **When** the active panel changes, **Then** the right rail content remains unchanged and visible.

---

### User Story 4 — Reach detail from the dashboard, and see the action bar (Priority: P3)

From the dashboard, a problem card now links to the **authenticated** detail route. On the detail header, the action buttons (Save, Compare, Alert me, Export) render per the design.

**Why this priority**: This closes the loop opened in slice 4.2 (TF-021: dashboard cards temporarily pointed at the public `/problems/[slug]`). The action buttons are placed now so the header matches the design; their write behaviors belong to later slices.

**Independent Test**: From the dashboard, click a card and confirm the URL is `/app/problems/[slug]` (not the public route) and the page renders in the shell; confirm the four action buttons appear on the header. Separately confirm the public `/problems/[slug]` sample still renders unchanged.

**Acceptance Scenarios**:

1. **Given** the dashboard, **When** the user clicks a problem card, **Then** they navigate to `/app/problems/[slug]` and the detail renders inside the shell.
2. **Given** the public sample report, **When** visited at `/problems/[slug]`, **Then** it still renders exactly as before (this slice does not touch it).
3. **Given** the detail header, **When** rendered, **Then** Save, Compare, Alert me, and Export render per the design; activating Compare / Alert me / Export performs no write this slice (their behaviors ship in later slices). See Assumption A3 for the Save button's read-only state.

---

### Edge Cases

- **No WTP signal** (genuine zero): the WTP tab and the rail's WTP panel render a real "no willingness-to-pay signal yet" state, not an error or empty box. (pgvector is the seeded zero case.)
- **Label-only related entry**: a related-problem row that points at an unseeded problem (no target slug) renders as text with no link; a row with a target slug renders as a link to that problem's detail. No dead/404 links.
- **Source the design shows but we don't carry**: the donut, source-badge row, and "N sources" count show only the five live sources — Product Hunt and Google Play (shown on the PDF page-2 donut) are not rendered (the standing 5-source design-delta).
- **Quote with a rating instead of engagement**: app-store quotes show a star rating where forum/HN/GitHub quotes show reactions/points/reputation — the evidence row adapts to the engagement shape present.
- **Long quote**: an over-length quote collapses with a "show more" affordance rather than overflowing.
- **Unknown / unrecognized `?tab=` value**: falls back to the default tab.
- **Anonymous request**: redirected to sign-in by the existing gate.
- **Unknown slug**: not-found treatment.
- **Reduced motion**: any tab/chart transition respects `prefers-reduced-motion`.

---

## Requirements *(mandatory)*

### Functional Requirements

**Route, gating, shell**

- **FR-001**: The system MUST serve an authenticated problem-detail page at `/app/problems/[slug]` for every one of the 15 seeded problems, rendered inside the slice-4.2 app shell (sidebar + top bar).
- **FR-002**: The page MUST be gated by the existing `/app` authentication: anonymous requests redirect to sign-in; the page resolves whose-data through the established `getAppUser()` seam (demo user in v1.0), never a hardcoded identity.
- **FR-003**: The system MUST return the app's not-found treatment for an unknown slug.

**Header**

- **FR-004**: The header MUST show: a breadcrumb (Library / category / title), the category chip(s), a demand-status chip derived from the problem's `demand_status`, "First seen … · Updated … ago" with now-relative timestamps (per the TF-023 seed re-anchoring), the title, the momentum delta with its sparkline, the source-badge row, and a "N quotes · N sources · N willingness-to-pay mentions" summary line.
- **FR-005**: The header MUST present four action buttons — Save, Compare, Alert me, Export — per the design. None performs a data write this slice (see Assumption A3 for Save's read-only state).

**Seven tabs**

- **FR-006**: The page MUST present seven tabs — Synthesis, Frequency, Evidence, Solutions, WTP, Related, Activity — where Evidence, Solutions, and WTP show their fixture counts in the tab label.
- **FR-007**: Tabs MUST be operable by mouse and keyboard with a visible focus ring, and MUST be deep-linkable via a `?tab=` query value (the default tab is shown when the value is absent or unrecognized).
- **FR-008**: **Synthesis** MUST render the problem's synthesis prose.
- **FR-009**: **Frequency** MUST render the seeded frequency series over a "last 90 days" now-relative window with a validation-threshold marker, range toggles, and a "N mentions · +X% vs prior period" caption.
- **FR-010**: **Evidence** MUST render the quote list with source-filter chips (All + per-source counts); each quote shows the author handle, its engagement (reactions / points / reputation, or a star rating for app-store sources), the quote text, a relative timestamp, a willingness-to-pay chip where the quote is flagged, and a "show more" affordance for long quotes.
- **FR-011**: **Solutions** MUST render the existing-solution cards (name, price range, a match-type chip — direct / adjacent / partial — and description).
- **FR-012**: **WTP** MUST render the willingness-to-pay summary (mention count, price range, median, and stated prices/notes), including a genuine zero state when there is no signal.
- **FR-013**: **Related** MUST render the related-problem entries: an entry that targets a known problem links to that problem's detail; a label-only entry renders without a link.
- **FR-014**: **Activity** MUST render this problem's recent activity log.

**Right rail**

- **FR-015**: A right rail MUST persist across all tabs, containing: a SOURCES donut + legend over the five live sources, a willingness-to-pay summary panel, a "Who's complaining" persona breakdown with proportion bars, and a related-problems list.
- **FR-016**: The donut's slice values MUST agree with the header's source/quote summary (they describe the same underlying counts), and MUST render only the five live sources.

**Data + integration**

- **FR-017**: All page content MUST come from the slice-4.1 fixtures via read-only `packages/db` helpers. The slice MUST NOT change the database schema, migrations, or seed data. If a required field proves absent, the work STOPS and the gap is surfaced rather than silently adding data.
- **FR-018**: The dashboard problem cards MUST link to `/app/problems/[slug]` (closing TF-021); the public `/problems/[slug]` sample report MUST remain unchanged.
- **FR-019**: Where the design's detail components already exist from the public sample report (slice 2.6), the slice MUST reuse/extend them rather than duplicate them (see Assumption A2 for the reuse boundary).

**Presentation quality**

- **FR-020**: The page MUST match `design/Core_app.pdf` page 2 within tolerance in both Editorial Light and Editorial Dark, and MUST be mobile-responsive (header reflow, tabs usable, rail stacks).
- **FR-021**: All charts/visualizations (frequency chart, sources donut, header sparkline) MUST be hand-rolled (no new charting dependency, per the constitution's no-new-library rule), reusing the existing public-detail chart primitives where possible.

### Key Entities *(read-only, from slice 4.1)*

- **Problem**: the subject row — title, slug, category, demand status, momentum, first-seen/updated timestamps, synthesis prose, per-row source keys.
- **Problem Source**: per-source quote/mention counts feeding the donut, the source-badge row, and the "N sources" summary (five live sources).
- **Problem Quote**: an evidence item — author handle, engagement or rating, text, timestamp, optional WTP flag, ordering position.
- **Existing Solution**: a competing/adjacent product — name, price range, match type, description.
- **WTP Signal**: the willingness-to-pay rollup — mention count, price range, median, stated prices/notes (absent for some problems).
- **Problem Persona**: a "who's complaining" segment with a proportion for the rail bars.
- **Problem Related**: a related-problem link — a label plus an optional target (known problem → link; otherwise label-only).
- **Problem Frequency Point**: a dated mention count in the now-relative 90-day window, with a validation threshold.
- **Problem Activity**: a recent event on this problem (threshold crossed / quotes added / saved …).
- **User (demo)**: resolved by the `getAppUser()` seam — determines whose read-only Save state shows (Assumption A3), not whether the page is gated.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/app/problems/[slug]` renders, gated, inside the 4.2 shell for all 15 seeded problems (0 broken routes).
- **SC-002**: All seven tabs render fully populated from fixtures for every problem; the hero problem is exhaustively populated across every region.
- **SC-003**: Every tab is reachable and operable by keyboard alone, and each of the seven `?tab=` deep links opens its panel directly.
- **SC-004**: The right rail renders the donut (five sources), WTP panel, personas, and related list on every problem; the donut's slice values sum to the header's source/quote count.
- **SC-005**: Genuine-zero states render as designed (the no-WTP problem shows an explicit empty state, not a broken panel) for 100% of zero-data cases.
- **SC-006**: Related entries that target a known problem link to its detail; label-only entries render with no link — 0 dead links across all problems.
- **SC-007**: 100% of dashboard problem cards link to `/app/problems/[slug]` (TF-021 closed), and the public `/problems/[slug]` sample renders unchanged.
- **SC-008**: The page matches `design/Core_app.pdf` page 2 within tolerance in light and dark and is usable down to a mobile viewport (founder-run visual check).
- **SC-009**: Quality gates pass (typecheck, lint, build), and the change set is confined to `apps/web` plus read-only `packages/db` helpers — no schema, migration, or seed change.

---

## Assumptions

> These are the founder-decision points flagged in the slice brief. Defaults are chosen per the design and prior-slice precedent; each is surfaced for confirmation before `/speckit.plan`.

- **A1 — Tab interaction model (default: swapped ARIA tab panels, not scroll-spy).** The brief specifies seven keyboard-navigable tabs with `?tab=` deep links; that semantics maps to a tablist with swapped panels (one panel visible at a time), distinct from the Tier-2 FAQ/legal **scroll-spy** anchors (which highlight sections on one long scroll). Default: build a true tablist. **[DECISION — confirm]** swapped panels vs. scroll-spy section anchors; check `design/Core_app.pdf` page 2 for which the comp shows.
- **A2 — Reuse boundary with the slice-2.6 public sample report (default: reuse the presentational leaves via a DB→props adapter; build a new in-app tabbed container).** The public report (`apps/web/src/components/problem/*`) is a **scroll layout over a hardcoded `SAMPLE_PROBLEMS` TS store**, wrapped in public chrome (TopNav/SiteFooter/SampleBanner). This slice is **tabbed, DB-backed, inside the app shell**. Default: reuse the leaf components that are presentational and data-shaped-compatible (frequency chart, donut + donut-math, evidence quote/list, sources card, related-problems card, momentum chip, source badge, frequency-math) by feeding them through a `getProblemDetail` → props adapter at the boundary; do **not** reuse `problem-layout.tsx` (public chrome) — build a new app-context layout + tab container. Where a leaf's prop contract diverges from the DB row shape, the divergence is surfaced (not silently edited). **[DECISION — confirm]** reuse-leaves-with-adapter vs. build-fresh.
- **A3 — Action-button state (default: Save reflects read-only "already saved"; Compare/Alert/Export are visual-only).** The brief permits buttons to "reflect read-only state like whether the demo user already saved this problem." The seed has `user_saved_problems` for the demo user, so a read-only Saved/Save state is derivable. Default: Save shows saved-vs-unsaved from a **new read-only** helper (e.g. `getSavedProblemIds(userId)` or `isProblemSaved`); Compare, Alert me, and Export render but reflect no state and perform no write. **[DECISION — confirm]** reflect Save state (adds one read-only helper) vs. all four pure-visual (zero new helper).
- **A4 — `getProblemDetail` needs NO extension (verified).** It already returns the full child sets — `{ problem, sources, quotes, solutions, wtp, personas, related, frequency }` — not counts. Related links also need no extension: `problem_related.target_slug` is stored inline (FK'd entry → has a target slug → links; label-only entry → null slug → no link). The only *possible* new read-only helper is the Save-state lookup under A3 — surfaced there, not here.
- **A5 — 5-source design-delta holds.** Donut, source-badge row, and "N sources" show only the five live sources (github / hackernews / stack-exchange / app-store / forums). Product Hunt and Google Play appear on the PDF page-2 donut but are not carried; the donut renders five slices.
- **A6 — Now-relative timestamps.** "First seen … · Updated …", quote times, the activity log, and the frequency 90-day window read the TF-023-anchored seed (relative to seed time), so they read as recent on the preview.
- **A7 — Charts hand-rolled, no new dependency.** The frequency chart, sources donut, and header sparkline reuse the existing hand-rolled SVG primitives (public-detail `frequency-chart` / `donut-chart` and the dashboard sparkline pattern); no charting library is added.
- **A8 — Slice-integrity / diff scope.** New: `apps/web` route `app/app/problems/[slug]` + in-app detail components + (per A3) one read-only `packages/db` helper. Edit: the dashboard card link target (TF-021) and CLAUDE.md §8 doc-only note. Unchanged: Tier-3 auth, the public `/problems/[slug]` route and its components, the 4.1 schema/seed, and the canonical ProblemCard logic.
- **A9 — Verification split.** Anonymous `/app/problems/[slug]` → sign-in redirect, the build, the data-layer reads, and the diff scope are verifiable in the sandbox; pixel fidelity vs. page 2 (light + dark + mobile) and the signed-in walk are founder-run on the Vercel preview with a real login (the sandbox can't hold a signed-in session).

## Dependencies

- Slice 4.1 (016) fixtures + `getProblemDetail` — the read source (present).
- Slice 4.2 (017) app shell, `getAppUser()` seam, and dashboard cards — the frame and the TF-021 re-point target (present).
- Slice 2.6 (012) public sample-report detail components — the reuse source (present).
- `design/Core_app.pdf` page 2 — the visual contract.
