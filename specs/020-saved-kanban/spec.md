# Feature Specification: Saved (Kanban Board)

**Feature Branch**: `020-saved-kanban`

**Created**: 2026-06-04

**Status**: Draft

**Slice**: 4.5 (Tier 4 — App with Fixtures), fourth authenticated screen — **the first write slice**

**Input**: User description: "Slice 4.5 — the Saved Kanban board at `/app/saved`: the demo user's saved problems organized into collections, fully interactive in-session, inside the 4.2 shell. Tier-defining decision: the write-persistence model."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — See the saved board (Priority: P1)

A signed-in builder opens Saved and sees their saved problems organized as a Kanban board — four collection columns (Next product, Q3 brief candidates, Read later, For Jules to review), each with a name, a color dot, and its real card count, holding compact problem cards (title, category, momentum, source badges) that link to the detail.

**Why this priority**: The board is the surface; without it the saved problems have no home. It must render the designed nine cards across four columns.

**Independent Test**: Sign in, open `/app/saved`, confirm 4 columns with **3 / 2 / 3 / 1** cards (the seeded 9), the header reads "28 of 50 · organized into 4 collections", and a card links to `/app/problems/[slug]`.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open `/app/saved`, **Then** the board renders the 4 seeded collections (name + color + real count) with their compact cards, inside the 4.2 shell.
2. **Given** anonymous, **When** they request `/app/saved`, **Then** they are redirected to sign-in.
3. **Given** a card, **When** activated, **Then** it navigates to `/app/problems/[slug]`.
4. **Given** the header, **When** rendered, **Then** it shows "28 of 50" (the usage-meter literal) + the real collection count (4); column counts are the real seeded cards (3/2/3/1).

---

### User Story 2 — Reorganize the board (Priority: P1)

The user moves a card to another collection (and reorders within one), removes a saved card (unsave), and creates / renames a collection. The board responds immediately and stays interactive for the whole session.

**Why this priority**: A Kanban that can't be reorganized isn't one. These are the slice's interactions — and the first writes in the product.

**Independent Test**: Move a card from "Read later" to "Next product" → it appears there and the counts update; unsave a card → it leaves the board; create a collection → a new empty column appears; rename one → its header updates. Reload → the board resets to the designed 9 (per the write model).

**Acceptance Scenarios**:

1. **Given** a card, **When** the user moves it to another collection, **Then** it leaves its source column and appears in the target, and both column counts + the board update.
2. **Given** a card, **When** the user removes (unsaves) it, **Then** it leaves the board and the counts update.
3. **Given** the board, **When** the user creates a new collection, **Then** an empty column appears; **When** they rename a collection, **Then** its header updates.
4. **Given** any reorganize action, **When** the page is reloaded, **Then** the board returns to the seeded baseline (the write model — US-scenario for §Assumptions A1).
5. **Given** reorganize controls, **When** operated by keyboard, **Then** they are fully reachable and operable (move via an accessible menu; no pointer-only path).

---

### Edge Cases

- **Write persistence** — what survives a reload, and what the seam-shared demo user means for a shared DB. Resolved in **A1** (the tier-defining decision).
- **Cross-screen consistency** — 4.3's Save button reads `user_saved_problems` from the DB; an in-session unsave here won't reflect there. Resolved in **A1** (both render the seeded truth on load; ephemeral mutations are per-page).
- **Empty collection** — a new (or emptied) column renders its empty "+ Add problem" affordance, not a broken column.
- **Column counts vs the comp** — the comp's column headers show larger numbers (8/5/11/4); we render the **real** seeded counts (3/2/3/1) per the 4.1 STOP-4 decision (carried, not open).
- **Deferred actions** — Export all (Tier 6), New comparison (Compare 4.7) render but don't act this slice.
- **Mobile** — columns scroll horizontally (or stack); cards reflow.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Serve `/app/saved`, gated by the existing `/app` auth, inside the 4.2 shell; resolve the board for the `getAppUser()`-seam user.
- **FR-002**: Render the user's collections as columns (name, color dot, real card count), ordered by the seeded collection order, each holding its saved problems in order.
- **FR-003**: The header MUST show "Saved problems", "**28 of 50**" (the `usage_meters` literal) + "organized into N collections" (real N), plus the action buttons (Export all, New comparison, New collection) per the design.
- **FR-004**: Each card is compact — title, category chip (§4.1a tint), momentum, source badges (5-source registry) — and links to `/app/problems/[slug]` (now-relative time per TF-023).
- **FR-005**: The user MUST be able to **move** a card to another collection and reorder within a collection, via a keyboard-accessible mechanism.
- **FR-006**: The user MUST be able to **remove (unsave)** a card from the board.
- **FR-007**: The user MUST be able to **create** a new collection and **rename** an existing one.
- **FR-008**: All reorganize interactions MUST be **non-persistent this slice** — applied to in-session board state and reset to the seeded baseline on reload (the write model, A1). The slice MUST NOT write to the database.
- **FR-009**: Deferred actions (Export all, New comparison) render but perform no action.
- **FR-010**: Read all data from the slice-4.1 fixtures via read-only `packages/db` helpers; **no schema/seed change** (if a write genuinely needs a new field, STOP and flag).
- **FR-011**: Reuse the source registry + category tints; **do not edit any shared/public component** — the compact Saved card is a new in-app component (the shared `ProblemCardCompact` doesn't match the minimal Saved card and is used by the live Tier-2 landing).
- **FR-012**: Match `design/Core_app.pdf` page 4 within tolerance, light + dark, mobile-responsive.

### Key Entities *(read-only, from slice 4.1)*

- **SavedCollection**: `name`, `color`, `position` — a board column.
- **UserSavedProblem**: links a problem to a collection with an order `position` — a card placement.
- **Problem**: the card subject (title, category, momentum, sources, updated).
- **UsageMeter** (`saved_problems` 28/50): the header literal.
- **User (demo)**: the seam-resolved board owner (the Saved board *is* user-scoped — `getAppUser` is used).

---

## Success Criteria *(mandatory)*

- **SC-001**: `/app/saved` renders, gated, in the 4.2 shell — 4 columns, 3/2/3/1 cards (the seeded 9), header "28 of 50 · 4 collections".
- **SC-002**: A card moves between/within collections, unsaves, and the board + counts update immediately; new/rename collection works — all in-session.
- **SC-003**: Reorganize is keyboard-operable (accessible move mechanism; no pointer-only path).
- **SC-004**: Reload resets the board to the seeded baseline (no DB write occurred); cards link to `/app/problems/[slug]`.
- **SC-005**: Matches page 4 within tolerance, light + dark, mobile-responsive.
- **SC-006**: Gates green; diff = `apps/web` + read-only `packages/db` helper(s); no schema/seed change; no shared/public component edited.

---

## Assumptions

> **A1 is the tier-defining decision** (write-persistence) and is surfaced for the founder; the rest are defaults.

- **A1 — Write-persistence model: ephemeral / in-session (recommended).** The board hydrates from the DB on load into in-memory React state; every interaction (move / unsave / new / rename) mutates that client state only; **nothing persists** — reload resets to the seeded 9. **Rationale**: the seam resolves every session to the *same* demo user, so real DB writes would mutate one shared board across all reviewers and drift the designed showcase until a re-seed. Ephemeral keeps every reviewer's board clean and the design intact; real per-user persistence is wired at **Tier 5.5** alongside the read swap (the write analogue of the read seam). **Cross-screen**: 4.3's Save reads the DB; ephemeral saves here won't reflect there — *both screens render the seeded truth on load, and ephemeral mutations stay per-page* (no shared cross-route client store). **[DECISION — confirm]** ephemeral (rec) vs real-DB writes (durable but drifts the shared demo board) vs read-only display (fails the interactive intent). This sets the write pattern for 4.6/4.7/4.9.
- **A2 — Reorganize interaction: accessible "Move to…" menu, no new dep (recommended).** Each card carries a keyboard-accessible "Move to collection" menu; selecting a target moves the card. **No drag-and-drop dependency.** **[DECISION — confirm]** move-menu (rec — accessible, no dep) vs hand-rolled HTML5 DnD (no dep but poor a11y/touch) vs a DnD library (best pointer UX but a **new dependency → escalation**). A pointer-DnD nicety could layer on the menu later without a dep.
- **A3 — "+ Add problem": ephemeral add-picker (minor).** "+ Add problem" opens a small picker of problems not already in that column and adds one to the in-session board. Alternative: render it but inert. Default: the ephemeral picker (cheap with in-memory state; makes the board feel real).
- **A4 — Real column counts, meter-literal header (carried, not open).** Column headers show the real seeded counts (3/2/3/1); "28 of 50" is the `usage_meters` literal (already on the dashboard KPI). Per the 4.1 STOP-4 decision.
- **A5 — `getAppUser` is used here.** The Saved board *is* user-scoped (the demo user's saves), so the page resolves the seam — normal usage, not a seam change; the Tier-5.5 flip makes it the real user.
- **A6 — Deferred buttons.** Export all (Tier 6), New comparison (Compare 4.7), Upgrade-for-unlimited (link) render but don't act.

## Dependencies

- Slice 4.1 fixtures (`saved_collections` + `user_saved_problems`, seeded 4/9) + `usage_meters` (28/50).
- Slice 4.2 shell, `getAppUser` seam, card adapter, source registry, category tints.
- Slice 4.3 `/app/problems/[slug]` (card link target) + `getSavedProblemIds` (the DB-read Save state it owns).
- `design/Core_app.pdf` page 4 — the visual contract.
