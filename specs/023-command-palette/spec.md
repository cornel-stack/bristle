# Feature Specification: Command Palette (⌘K)

**Feature Branch**: `023-command-palette`

**Created**: 2026-06-05

**Status**: Draft

**Slice**: 4.8 (Tier 4) — the global command palette. Makes the 4.2 shell's visual-only ⌘K affordance functional.

**Input**: User description: "Slice 4.8 — ⌘K opens a centered overlay from any authenticated page; grouped results (Problems / Categories / Actions); keyboard-navigable (↑↓ / Enter / Esc); action shortcuts. DoD: ⌘K → type 'stripe' → see problems → Enter navigates → Esc closes."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open, search, navigate (Priority: P1)

From any authenticated page, the user presses ⌘K (or clicks the topbar Search affordance), a centered overlay opens with a search input; typing filters real problems + categories into grouped results; ↑↓ moves the highlight across groups, Enter navigates to the highlighted result, Esc closes.

**Why this priority**: This is the slice — the DoD. The palette is the keyboard-first way to jump anywhere in the app.

**Independent Test**: On the dashboard, ⌘K → type "stripe" → see a Problems group with the matching problems → ↓ to one → Enter → lands on `/app/problems/[slug]`; ⌘K again → Esc → closes.

**Acceptance Scenarios**:

1. **Given** any authenticated page, **When** ⌘K is pressed (or the topbar Search is clicked), **Then** the centered palette overlay opens with focus in the input.
2. **Given** the open palette, **When** the user types a term, **Then** results filter to matching problems + categories + contextual actions, grouped with per-group counts and a total ("N results across M groups").
3. **Given** results, **When** ↑/↓ is pressed, **Then** the highlight moves across all visible items (spanning groups); **Enter** navigates to the highlighted item; **Esc** closes (returning focus to the trigger).
4. **Given** a highlighted problem, **When** Enter, **Then** it navigates to `/app/problems/[slug]`; a category → `/app/library?category=<key>`; an action → its navigation target.
5. **Given** anonymous, **When** they reach the app, **Then** the palette is not present (the shell — and its palette — is gated).

---

### User Story 2 — Action shortcuts + states (Priority: P2)

With a problem highlighted, keyboard shortcuts run its actions (compare, save); the contextual Actions group offers query-scoped commands; empty / no-match states render cleanly.

**Why this priority**: The shortcuts + actions are the palette's power-user payoff; they build on US1.

**Acceptance Scenarios**:

1. **Given** a highlighted problem, **When** the **compare** shortcut (⌘C / `\`) is pressed, **Then** it opens `/app/compare?compare=<slug>`.
2. **Given** a highlighted problem, **When** the **save** shortcut (⌘S / `S`) is pressed, **Then** it navigates to the problem detail (where the ephemeral Save lives — A2; no global write).
3. **Given** a non-empty query, **When** the Actions group renders, **Then** it offers genuine navigations (e.g. "Search the Library for '<query>'" → `/app/library?q=<query>`; "Open Library filtered to <Category>" when a category matches).
4. **Given** a query with no matches, **When** rendered, **Then** a "No results" state shows (not a broken/blank list).
5. **Given** the footer, **When** the palette is open, **Then** it shows the keyboard hints + the result count.

---

### Edge Cases

- **Global mount** — the palette works on every authenticated page (mounted in the shell layout), not just the dashboard.
- **⌘K vs Ctrl+K** — both (mac ⌘, others Ctrl) open it; the listener prevents the browser default.
- **Empty query** — shows a default set (recent/all problems + categories) or a prompt, not nothing.
- **Save shortcut has no global home** — it navigates to the detail (A2); it does **not** write or invent a global ephemeral store.
- **No localStorage** — open state is React state.
- **Real data only** — the index is the real 15 problems + 8 categories (no placeholder entries); custom categories (4.9) aren't indexed yet — the 8 canonical only.

---

## Requirements *(mandatory)*

- **FR-001**: A command palette MUST open from any authenticated page via ⌘K / Ctrl+K (preventing the browser default) and via the topbar Search affordance; it mounts in the 4.2 shell layout (gated).
- **FR-002**: The palette MUST render a centered overlay (`role="dialog"`, focus-trapped, Esc closes + restores focus to the trigger) with a search input.
- **FR-003**: Typing MUST filter the index into grouped results — **Problems** (title match), **Categories** (label match), **Actions** (contextual) — each with a count + a total line.
- **FR-004**: ↑/↓ MUST move a single highlight across all visible items (spanning groups); Enter navigates the highlighted item; Esc closes. The widget MUST be screen-reader accessible (combobox + listbox semantics).
- **FR-005**: Navigation targets MUST use the existing URL conventions: problem → `/app/problems/[slug]`; category → `/app/library?category=<key>`; actions → `/app/library?q=…` / `/app/library?category=…` / `/app/compare?compare=…` / the relevant screen.
- **FR-006**: A highlighted problem MUST support action shortcuts: **compare** (⌘C / `\`) → `/app/compare?compare=<slug>`; **save** (⌘S / `S`) → the problem detail (A2 — no global write).
- **FR-007**: The index MUST be the **real** 15 problems (title/slug/category) + 8 catalog categories (key/label/count), fetched server-side and passed to the client palette island.
- **FR-008**: Empty-query + no-match states MUST render cleanly; the footer MUST show the keyboard hints + result count.
- **FR-009**: Reuse the shell + registry/tints; the only **sanctioned** shared touch is the 4.2 shell (layout mount + topbar trigger — A3). **No DB write, no schema/seed change, no localStorage.**
- **FR-010**: The palette MUST be styled entirely with Bristle tokens (no imported widget look), whichever widget approach (A1) is chosen.
- **FR-011**: Match `design/Core_app.pdf` page 7 within tolerance, light + dark, responsive.

### Key Entities *(read-only)*

- **Command index**: problems {title, slug, category} + categories {key, label, count} — the searchable set.
- **Command action**: a contextual command {label, hint, navigate-target} built from the query.

---

## Success Criteria *(mandatory)*

- **SC-001**: ⌘K opens the palette from any authenticated page; Esc closes it (focus returns to the trigger).
- **SC-002**: Typing "stripe" shows the matching problems (Problems group) + any matching category + contextual actions, grouped with counts; ↑↓ highlights across groups; Enter navigates (problem → detail, category → library filter).
- **SC-003**: Compare shortcut → `/app/compare?compare=<slug>`; Save shortcut → the detail (no write); no-match → "No results".
- **SC-004**: The index is the real 15 + 8 (no placeholders); navigation uses the existing URL conventions; no `localStorage`.
- **SC-005**: Keyboard + screen-reader accessible; matches page 7 within tolerance, light + dark.
- **SC-006**: Gates green; diff = `apps/web` (the palette + the sanctioned shell touch) + one read-only `packages/db` index helper (+ the A1 dependency, *if* cmdk); no schema/seed/migration; no DB write.

---

## Assumptions

- **A1 — Palette widget: `cmdk` vs hand-rolled (THE decision).** The build plan says "Built with `cmdk`." The standing no-new-dep constraint has held across all of Tier 4. This is the one explicit exception on the table. **[DECISION — confirm]** Either way the palette is **styled entirely with our tokens** and the mount / trigger / index / navigation / actions are identical — only the widget internals differ. (See the consolidated review for the full trade + recommendation.)
- **A2 — Save shortcut routes to the detail (no global write).** Saving is ephemeral-per-page (no cross-route store, no DB write — the 4.5 model). A global palette-save can't persist, so the Save shortcut/action **navigates to the problem detail** (where the ephemeral Save lives). Compare actions are clean: they add the slug to `?compare=` and navigate (URL-param, global, no write). **No invented global save store.**
- **A3 — Shell touch (sanctioned) + index.** The palette was always meant to live in the shell; wiring it touches `app/app/layout.tsx` (fetch the index + mount `<CommandPalette>`) + `app-topbar.tsx` (the visual "Search…" → a client trigger that opens the palette). The index is a new read-only `packages/db` helper `getCommandIndex()` (problems slim + the 8 categories with counts) — read, no write. The diff to the shell is shown in the manifest.
- **A4 — Actions are navigations.** The Actions group items are genuine navigations (the palette is a launcher): "Search Library for '<query>'", "Open Library filtered to <Category>", and the design's "Create alert" / "Save …" route to the screen that owns that action (`/app/alerts` / the detail) — never a fake write.

## Dependencies

- Slice 4.2 shell (the mount + the topbar trigger) + `getAppUser` gate.
- Slices 4.3 / 4.4 / 4.7 URL conventions (`/app/problems/[slug]`, `?category=`, `?compare=`).
- The registry/tints; `CATEGORY_LABELS` + the `categories` catalog (8) for the category index.
- `design/Core_app.pdf` page 7.
- **`cmdk`** — *only if A1 = cmdk* (the one exception to the no-dep constraint).
