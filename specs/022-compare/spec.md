# Feature Specification: Compare (Side-by-Side Grid)

**Feature Branch**: `022-compare`

**Created**: 2026-06-05

**Status**: Draft

**Slice**: 4.7 (Tier 4) — sixth authenticated screen. **A READ slice** (not a write slice — there is no comparisons table; a comparison is a URL of slugs).

**Input**: User description: "Slice 4.7 — Compare at `/app/compare`: a side-by-side grid comparing up to 4 problems (derived quantitative rows + the qualitative `compare_card` scorecards + Bristle's Read), inside the 4.2 shell. Compare-set state lives in the URL (`?compare=slugs`) — shareable, deep-linkable, RSC-rendered, no DB write."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Compare problems side-by-side (Priority: P1)

A signed-in builder opens Compare with up to 4 problems selected and sees a grid: each column is a problem (card header), the rows are the derived quantitative metrics (mentions, sources, WTP, personas, solutions, time-since-first-seen) + the 5 qualitative scorecards + Bristle's Read verdict — aligned so the problems read against each other.

**Why this priority**: This is the slice. It's the first render of `compare_card` anywhere, and the place a builder decides *which* problem to build against.

**Independent Test**: Open `/app/compare?compare=stripe-webhooks-vercel-cold-starts,llm-streaming-cdn-buffering,pgvector-index-degradation-2m,expo-ota-ios-18-4` and confirm 4 columns, the quantitative rows (47/38/29/31 mentions, etc.), the 5 scorecards (tone-colored), Bristle's Read (Strongest / Build-able / Watch / Skip), and a "Best fit" marker on the Strongest column.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open `/app/compare?compare=…` (≤4 slugs), **Then** the grid renders one column per problem with the derived quantitative rows + the 5 scorecards + Bristle's Read, inside the 4.2 shell.
2. **Given** anonymous, **When** they request `/app/compare`, **Then** they are redirected to sign-in.
3. **Given** a column header, **When** "Remove" (×) is activated, **Then** the column leaves the grid and the URL updates (`?compare=` without that slug).
4. **Given** a problem column, **When** its `compare_card` validates against the contract, **Then** the scorecards render value + tone and Bristle's Read renders the verdict + prose; **the Best-fit marker** is on the column whose verdict is "strongest".
5. **Given** the quantitative rows, **When** rendered, **Then** every value is **derived from the relational tables** (sources count, WTP count·median, top persona·%, solution count·direct, mentions·60d, days-since-first-seen) — none from `compare_card`.

---

### User Story 2 — Build + share the comparison (Priority: P1)

The user adds a problem to the grid (a picker), removes one (×), and shares the comparison (the URL is the artifact). Empty (0 selected) and single (1 selected) states guide them to a valid comparison (≥2).

**Why this priority**: The grid is only useful once you can assemble + reshape the set; the URL makes it shareable. These are the read-slice interactions (URL mutations, no DB write).

**Independent Test**: From 0 selected → empty state + "Add a problem"; add one → prompt "add at least one more"; add a second → the grid renders; remove via ×; the URL reflects the set throughout; copy/share the URL → it reopens the same grid.

**Acceptance Scenarios**:

1. **Given** 0 selected, **When** the page loads, **Then** an empty state renders with a way to add a problem.
2. **Given** 1 selected, **When** rendered, **Then** a prompt to add at least one more shows (a comparison wants ≥2).
3. **Given** a picker, **When** a problem is added, **Then** it joins the grid (URL `?compare=` gains the slug), capped at 4 (the picker disables at 4).
4. **Given** a comparison, **When** the URL is shared/opened elsewhere, **Then** the same grid renders (deep-linkable; **no DB write** — the URL is the only state).

---

### User Story 3 — Enter Compare from Library + Saved (Priority: P2)

The user reaches Compare from the two deferred entry points: the Saved board's "New comparison" button, and the Library's row selection + "Compare selected".

**Why this priority**: Closes the two stubs (4.5 "New comparison" was visual-only; 4.4 omitted the row-checkbox, marked "4.7 wires Compare"). Compare is fully usable without them (US2 picker), so P2.

**Acceptance Scenarios**:

1. **Given** the Saved board, **When** "New comparison" is activated, **Then** it navigates to `/app/compare`.
2. **Given** the Library, **When** rows are selected and "Compare selected" is activated, **Then** it navigates to `/app/compare?compare=<selected slugs>` (≤4).
3. **Given** the public/other surfaces, **When** unaffected, **Then** they render unchanged (the wiring touches only the two sanctioned shipped slices — see A2 diff).

---

### Edge Cases

- **0 / 1 selected** — empty state / "add one more" prompt (a comparison needs ≥2).
- **> 4 in the URL** — capped at 4 (extra slugs ignored/trimmed; the picker disables at 4).
- **Unknown slug in the URL** — skipped (the grid shows the known ones; no broken column).
- **`compare_card` invalid/absent** (contract parse fails) — the column's scorecards/Read render a graceful empty cell, not a crash.
- **Genuine-0 derived cells** — e.g. pgvector WTP "0 · —", Expo solutions "—" — render honestly, not blank.
- **5-source delta** — the Sources row reads "X of 5" (the 5 live registry badges), not the comp's "of 6" (no Product Hunt / Google Play).
- **Now-relative time** — "days since first seen" computed from now-relative `first_seen_at` (TF-023).
- **Save view / Export PDF** — render but don't act (no saved-comparisons table; Export → Tier 6).
- **Mobile** — the grid scrolls horizontally.

---

## Requirements *(mandatory)*

- **FR-001**: Serve `/app/compare`, gated, inside the 4.2 shell; resolve the `getAppUser()` user (the gate; the data is global problem data).
- **FR-002**: The compare-set is read from the URL `?compare=slug1,slug2,…` (≤4); the page is a Server Component that reads it, fetches each problem's compare data, and renders. **No DB write** (there is no comparisons table; the URL is the only state).
- **FR-003**: Render a grid: one column per selected problem (card header — category chip, title, momentum + sparkline, × remove), with the rows below.
- **FR-004**: Render the **derived quantitative rows** from the relational tables: Mentions·60d; Sources ("X of 5", distinct live badges); WTP signals (count · median); Personas (top persona · %); Existing solutions (count + direct/adjacent qualifier); Time since first seen (days). **None from `compare_card`.**
- **FR-005**: Render the **5 qualitative scorecards** from `compare_card` (validatedDemand, hasDirectSolution, personaFit, buildEffort, defensibility) — value + tone color — validated against `CompareCardSchema` at the read boundary.
- **FR-006**: Render **Bristle's Read** per column (verdict badge — Strongest / Build-able / Watch / Skip — + prose); mark the "strongest" column as **Best fit**.
- **FR-007**: A picker adds a problem to the set (URL gains the slug), capped at 4; the × removes a column (URL loses the slug).
- **FR-008**: Render the **empty (0)** and **single (1)** states with an entry to reach a valid (≥2) comparison.
- **FR-009**: Wire the two deferred entry points (A2): Saved "New comparison" → `/app/compare`; Library row-select + "Compare selected" → `/app/compare?compare=…`.
- **FR-010**: Read via the existing read helpers (reuse `getProblemDetail` ≤4×); **no schema/seed change; no new read helper required**. If a comparison genuinely needs persistence, that is a new table → **STOP** (the URL-param model avoids it).
- **FR-011**: Route `compare_card` + the derived metrics → the grid through a **new compare adapter** (the single formatting seam, like `problem-detail-adapter`), validating the JSONB against the Zod contract.
- **FR-012**: Reuse the shell + seam + registry/tints; **do not edit any shared/public leaf** — except the two **sanctioned** entry-affordance touches in the shipped 4.4 (Library) + 4.5 (Saved) slices (A2).
- **FR-013**: Deferred (render, don't act): Save view, Export PDF, Share (or Share copies the deep-link — A4).
- **FR-014**: Match `design/Core_app.pdf` page 6 within tolerance, light + dark, mobile-responsive (horizontal grid scroll).

### Key Entities *(read-only, from slice 4.1)*

- **Problem** (+ `compare_card` JSONB): the column subject + the qualitative scorecards/Read source.
- **ProblemSource / WtpSignal / ProblemPersona / ExistingSolution**: the derived quantitative rows.
- **CompareCard** (Zod contract): 5 scorecard cells {value, tone} + bristlesRead {verdict, prose}.

---

## Success Criteria *(mandatory)*

- **SC-001**: `/app/compare?compare=` renders, gated, in the shell — a column per ≤4 problems with the 6 derived quantitative rows + 5 scorecards + Bristle's Read; Best-fit marks the strongest.
- **SC-002**: Every quantitative cell is derived from the relational tables (verified: matches the rows, not `compare_card`); scorecards/Read come from `compare_card` validated against the contract.
- **SC-003**: Add (picker, ≤4) / remove (×) update the URL; 0 → empty state, 1 → "add one more"; the URL is shareable/deep-linkable; **no DB write** (grep-clean).
- **SC-004**: Saved "New comparison" → `/app/compare`; Library select + "Compare selected" → `/app/compare?compare=…`; the diff to those two shipped slices is exactly as manifested; no other surface changes.
- **SC-005**: Genuine-0 cells (pgvector WTP, Expo solutions) render honestly; Sources reads "X of 5"; days-since now-relative.
- **SC-006**: Matches page 6 within tolerance, light + dark, mobile (horizontal scroll); gates green; diff = `apps/web` (Compare + the 2 sanctioned touches) — **no schema/seed/migration, no new `packages/db` helper, no new dep**.

---

## Assumptions

- **A1 — Compare is a READ slice; compare-set state in the URL (`?compare=slugs`).** Confirmed reframe — there is no comparisons table (`compare_card` is a JSONB column, not a comparisons entity), so a comparison can't persist without a schema change (which STOPs). URL-param RSC fits the settled read-dichotomy (like the Library), is shareable/deep-linkable, and writes nothing. **[confirm]** URL-param RSC (rec) vs ephemeral `useState`. Either way **no DB write**.
- **A2 — Entry wiring touches two shipped slices (show the exact diff).** Three entry paths: (1) the **within-Compare picker** (primary — Compare stands alone); (2) **Saved** "New comparison" `<button>` → `<Link href="/app/compare">` (trivial, slice 4.5); (3) **Library** row-select — add the row checkbox column (the A8-deferred one) + a "Compare selected (N)" bar → `/app/compare?compare=…` (the larger touch, slice 4.4; selection via `?select=` URL-param, a thin checkbox island). **[confirm]** wire all three (rec — completes the A8 deferral + both design entries) vs. wire (1)+(2) only and defer the Library checkbox. Selection is checkbox/picker, **not drag** (consistent with the 4.5 no-DnD call) — though the comp says "drag".
- **A3 — Row set + compare adapter (confirm against the contract).** Rows = **6 derived quantitative** (Mentions·60d, Sources X-of-5, WTP count·median, top Persona·%, Existing solutions count·direct, Time-since-first-seen days) + **5 scorecards** (the `CompareCardSchema` cells) + **Bristle's Read**. A new `compare-adapter.ts` is the single formatting seam: `ProblemDetail → CompareColumnVM`, validating `compare_card` via `CompareCardSchema.safeParse` at the boundary. **Read = reuse `getProblemDetail` ≤4×** (it already returns the problem + sources + wtp + personas + solutions + the `compare_card` column) — no new `packages/db` helper. **[confirm]**
- **A4 — Share / Save view / Export.** Save view (no comparisons table) + Export PDF (Tier 6) render **visual-only**. Share: default **copies the current deep-link URL** (a tiny client action — honest, since the URL *is* the shareable comparison). **[confirm]** Share copies link (rec) vs visual-only.
- **A5 — Best fit** = the column whose `bristlesRead.verdict === "strongest"`; scorecard tone → chip color; verdict → card tone. Pixel nuances (e.g. the comp's ✓ for positive validated-demand) are mine.
- **A6 — `getAppUser`** is the gate (the page is user-gated but the data is global problem data — like the Library's auth gate; no per-user scoping).

## Dependencies

- Slice 4.1 fixtures (`compare_card` on all 15 + `CompareCardSchema` in `@bristle/shared`; the relational child tables for the derived rows).
- Slice 4.2 shell + seam + registry/tints; `getProblemDetail` (4.1) reused.
- Slice 4.3 `problem-detail-adapter` (the boundary-seam model the compare adapter follows).
- Slice 4.4 Library (the row-select entry) + 4.5 Saved (the "New comparison" entry) — the two sanctioned touches.
- `design/Core_app.pdf` page 6.
