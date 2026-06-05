# Feature Specification: First-Run Tour

**Feature Branch**: `025-first-run-tour`

**Created**: 2026-06-05

**Status**: Draft

**Slice**: 3.7 (deferred Tier-3 slice, shipped as the **Tier-4 capstone**) — the spotlight onboarding tour that introduces the now-complete app (palette, cards, save, alerts). After it: tag **v0.4.0**.

**Input**: User description: "Build-plan 3.7 — a 5-step spotlight overlay on the dashboard explaining (per onboarding.pdf p.3) the command palette (⌘K), problem cards, the save action, and alerts. Bubble cards, Skip + End-tour options. Persists tour_completed. DoD: new user lands on dashboard → tour runs → can be skipped → state persists across sessions. Built in the Tier-4 shared-demo reality: ephemeral in-memory state (auto-runs once per session, resets on hard reload), the real cross-session persistence deferred to 5.5 / TF-028."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A first-time user gets a guided tour of the dashboard (Priority: P1)

A user lands on the dashboard for the first time this session. A dimmed spotlight overlay appears, walking them through five steps with bubble cards — the command palette, what a problem card is, the save action, alerts — then a closing step. They click **Next** through it (or **Back**), and finish on the last step. The tour does not appear again as they move around the app this session.

**Why this priority**: This is the slice — the DoD. Auto-run on first-run-of-session + a 5-step walk is the whole feature.

**Independent Test**: Hard-load `/app` → the tour auto-opens on step 1 → **Next** advances through 2…5 with the dimmed spotlight tracking each target and the bubble repositioning → **Back** steps back → the last step's primary button ends the tour → navigate Dashboard → Library → Dashboard and it does **not** re-open.

**Acceptance Scenarios**:

1. **Given** a fresh session, **When** the dashboard loads, **Then** the tour auto-opens on step 1 (the rest of the dashboard dimmed, the step's target spotlit, a bubble card positioned near it).
2. **Given** any step, **When** **Next →** is clicked (or the last step's end button), **Then** the tour advances (or completes and closes).
3. **Given** step ≥ 2, **When** **Back** is clicked, **Then** the tour returns to the previous step.
4. **Given** the bubble, **When** rendered, **Then** it shows "Tour · N of 5", a serif title, body copy, the mono ⌘ tip chip, 5 step-dots (current active), Back / Next, an × close, and an "End tour and explore on my own" footer link (per onboarding.pdf p.3).
5. **Given** the tour was completed or dismissed this session, **When** the user soft-navigates away from and back to the dashboard, **Then** the tour does **not** re-open.

---

### User Story 2 — The user can leave the tour at any time (Priority: P1)

The user can dismiss the tour at any step — via **Skip / End tour**, the × close, or **Esc** — and land on the real dashboard, undimmed. It does not re-open for the rest of the session.

**Why this priority**: "Can be skipped" is half the DoD. A tour you can't escape is a trap.

**Acceptance Scenarios**:

1. **Given** any step, **When** the × / "End tour and explore on my own" / **Esc** is activated, **Then** the overlay closes immediately and the dashboard is interactive.
2. **Given** a dismissal, **When** the user stays in the session (soft navigation), **Then** the tour stays dismissed.
3. **Given** a dismissal, **When** the user **hard-reloads**, **Then** the tour runs again (ephemeral — the session-only flag resets). *(This is the demo affordance; real per-user persistence is 5.5 — see A1.)*

---

### User Story 3 — The tour is keyboard- and screen-reader-navigable (Priority: P2)

The whole tour is operable without a mouse and announced to assistive tech.

**Acceptance Scenarios**:

1. **Given** the tour opens, **When** it renders, **Then** focus moves into the bubble (the dialog), Tab is trapped within it, and focus returns to a sensible element on close.
2. **Given** a step change, **When** it occurs, **Then** the new step's title/position is announced (`aria-live`), and Enter/Space operate Next/Back.
3. **Given** `prefers-reduced-motion`, **When** set, **Then** transitions are opacity-only / 0ms (no spotlight sliding).

---

### Edge Cases

- **Once per session, not per page-view** — the dismissed flag survives soft (SPA) navigations; it must NOT live in the tour island's own mount state (which would re-fire every Dashboard re-visit). It is an in-memory session-scoped flag (A1) — **no localStorage, no sessionStorage**.
- **Missing target** — if a spotlight target isn't in the DOM (e.g. an empty dashboard with no problem cards, or the topbar ⌘K trigger hidden at a narrow width), that step degrades gracefully: the bubble centers (no spotlight ring) rather than pointing at nothing; the tour never blocks on a missing anchor.
- **Resize / scroll mid-tour** — the spotlight + bubble reposition to the target's current rect (the only genuinely uncertain hand-roll bit — A2).
- **Reduced motion** — opacity-only.
- **No write anywhere** — no DB write, no server action, no storage; the tour is pure in-memory UI state (the Tier-4 ephemeral convention).
- **No schema/seed/migration** — the ephemeral tour writes nothing; **no `tour_completed` column is added** (it does not exist today — A1 note).

---

## Requirements *(mandatory)*

- **FR-001**: On a fresh session's first dashboard load, a 5-step spotlight tour MUST auto-open — the dashboard dimmed, the current step's target spotlit, and a bubble card positioned near it (onboarding.pdf p.3).
- **FR-002**: Each bubble MUST show "Tour · N of 5", a serif title, body copy, the mono ⌘ tip chip, 5 step-dots (current active), **Back** (hidden/disabled on step 1) + **Next →** (the last step's primary ends the tour), an × close, and an "End tour and explore on my own" footer link.
- **FR-003**: The user MUST be able to advance (**Next**), go **Back**, and **dismiss** at any step (× / End-tour / **Esc**); dismissal closes the overlay and leaves the dashboard interactive.
- **FR-004**: The tour MUST run **once per session** — the dismissed/completed flag survives soft navigations within the session and resets on a hard reload. **In-memory only** — no DB write, no server action, no localStorage, no sessionStorage (the Tier-4 ephemeral convention; A1).
- **FR-005**: The five steps MUST spotlight real on-screen targets: the command palette (⌘K) trigger, a problem card, the save affordance, and alerts — plus a closing step (the exact mapping per A4; design depicts only step 2 — the problem card).
- **FR-006**: Target anchoring MUST use small **in-app** data-attribute/ref touches on the components that own each target (the topbar ⌘K trigger, the first problem card's in-app wrapping link, the sidebar nav items) — **no shared/public leaf is edited** (the shared `@bristle/ui` `ProblemCardFull` is NOT touched; anchor its in-app wrapping `Link`).
- **FR-007**: The tour MUST be **one new client island, mounted on the dashboard route only** (the spotlight targets live in the 4.2 shell + dashboard). RSC-first everywhere else.
- **FR-008**: The overlay MUST reuse the existing dialog/focus-trap pattern (role=dialog, focus-in, Tab-trap, Esc, focus-return) shared by the mobile drawer / filter drawer / add-category modal. Keyboard-operable, `aria-live` step announcements, reduced-motion respected.
- **FR-009**: The spotlight MUST be **hand-rolled** — a dim overlay with a cutout, a positioned bubble, and a 5-step state machine — **no new dependency** (per the 4.8 dependency rule; A2). If bubble-against-target positioning proves genuinely fragile across the responsive dashboard, that is escalated as a dependency decision rather than silently shipped.
- **FR-010**: **No schema/seed/migration.** The slice writes nothing and adds no `tour_completed` column (A1 — the real-persist path is 5.5 / TF-028).
- **FR-011**: Match onboarding.pdf p.3 (bubble treatment, dim, spotlight ring), light + dark, mobile-responsive.

### Key Entities *(in-memory only — no table)*

- **Tour step** (static, 5): `{ index, title, body, tip?, targetKey? }` — `targetKey` null for the closing/centered step.
- **Tour session state** (in-memory): `{ dismissed: boolean, currentStep: number }` — `dismissed` is session-scoped (survives soft nav, resets on hard reload); writes nowhere.

---

## Success Criteria *(mandatory)*

- **SC-001**: Hard-load `/app` → the tour auto-runs on step 1; **Next/Back** walk all 5 steps with the spotlight tracking each target; the last step ends it.
- **SC-002**: × / End-tour / **Esc** dismiss at any step; after dismissal, soft-navigating away and back does **not** re-open it; a hard reload **does** (ephemeral).
- **SC-003**: Keyboard- + screen-reader-operable (focus-trap, `aria-live` step changes, Enter/Space on Back/Next, focus-return); reduced-motion = opacity-only; light + dark; mobile.
- **SC-004**: Matches onboarding.pdf p.3 (bubble layout, dim + spotlight ring, dots, tip chip).
- **SC-005**: Gates green; diff = `apps/web` in-app only (the tour island + the dashboard mount + the small anchor touches on topbar/problem-grid/sidebar-nav). **No schema/seed/migration, no new `packages/db` helper, no shared/public leaf edit, no new dep, no localStorage/sessionStorage** (grep-clean).

---

## Assumptions

- **A1 — Tour state is EPHEMERAL, session-scoped, in-memory (THE decision).** A session-scoped flag seeded "not yet seen" on load; the tour auto-runs once per session on the dashboard; Skip/End/×/Esc/step-5-complete set it dismissed; a hard reload resets it. **No DB write, no server action, no localStorage, no sessionStorage.** Consistent with the Tier-4 ephemeral-write convention (4.5/4.6/4.9). **Why not real-persist now**: the seam resolves every session to the SAME demo user (who is not new), so a real `tour_completed` write would hide the tour from every reviewer after the first until a manual re-seed — and **no `tour_completed` column exists today** (unlike slice 024's pre-provisioned columns), so real-persist would force a NEW migration this slice is scoped NOT to add. The literal DoD "persists across sessions" becomes real at **5.5 (TF-028)** when real users each own a `tour_completed`. **[DECISION — confirm]** ephemeral (rec) vs. real-persist (cost: shared-demo shows-once-for-everyone + a migration now). *Sub-decision (where the flag lives so it survives soft-nav): a module-level in-memory singleton in the tour's client module (rec — self-contained, zero shell touch beyond anchors) vs. a shell-level `TourContext` provider (the CategoriesContext precedent — consistent, but one more layout touch).*
- **A2 — Spotlight is HAND-ROLLED, no new dependency (the second decision).** Per the 4.8 dependency rule (hand-roll presentational widgets; reach for a vetted primitive only for an a11y-critical interactive widget whose hand-rolled correctness is genuinely uncertain), the spotlight is an overlay + focus management + a positioned bubble + a 5-step state machine — the overlay/focus parts ARE the dialog patterns we already own; the a11y bar (focus the bubble, Esc/Skip, `aria-live`) is manageable. A tour lib (joyride/shepherd/driver) would be a second dependency and does not clearly clear the bar. The one genuinely-uncertain part is **bubble positioning against targets across the responsive dashboard** (`getBoundingClientRect` + reposition on resize/scroll) — that is layout work, not a11y-correctness. **[DECISION — confirm]** hand-roll (rec); if positioning proves fragile mid-build, flag it as a dependency decision (the cmdk escape hatch) rather than assuming.
- **A3 — Anchoring is small, in-app, data-attribute touches (empty-diff on shared/public holds).** The tour finds its targets via `data-tour="…"` attributes on the in-app components that own them: the topbar ⌘K trigger, the **wrapping `Link`** around the first dashboard problem card in `problem-grid.tsx` (NOT the shared `ProblemCardFull` leaf), and the sidebar nav items. Bounded, in-app, no shared/public leaf edited. The tour island mounts on the dashboard route only and is gated to it. **[confirm]**
- **A4 — The 5-step content/anchor mapping (design depicts only step 2).** onboarding.pdf p.3 shows only step 2 (the problem card). Recommended mapping: **(1)** Command palette → the topbar ⌘K trigger; **(2)** Problem card → the first card *(design-confirmed; tip chip "press S to save · C to compare")*; **(3)** Save → the **Saved** sidebar item *(dashboard cards have no visible save button — save is keyboard-only per 4.5/4.8 — so the Saved nav is the honest on-screen target; the S-shortcut is taught in step 2's tip)*; **(4)** Alerts → the **Alerts** sidebar item; **(5)** Closing → centered, no target ("That's the tour — ⌘K is always there."). **[DECISION — confirm]** this mapping vs. a welcome-first variant (welcome → card → palette → save → alerts). Architecture is identical either way; this is copy/anchor only.
- **A5 — Tour writes nothing; targets are real.** The tour reads no new data and renders against the real dashboard + shell already present; no placeholders, no fixtures.

## Dependencies

- Slice 4.2 shell (topbar ⌘K trigger, sidebar nav) + the dashboard route — the anchor hosts + the mount.
- Slice 4.3/4.8 (the save ⌘S → detail behavior, the ⌘K palette) — the behaviors the tour describes.
- The existing dialog/focus-trap pattern (mobile drawer / filter drawer / add-category modal) — reused, not re-invented.
- `design/onboarding.pdf` p.3 (the visual contract) + the build-plan 3.7 row (the DoD).

## Out of scope (this slice)

- Real cross-session `tour_completed` persistence (Tier 5.5, **TF-028**) — including the `tour_completed` column + migration.
- The genuinely-new-user signup → tour flow (5.5 real auth; the demo user is not "new").
- The other onboarding.pdf pages (role / categories — shipped in slice 015).
- Edit/replay-tour affordance from settings (not in the DoD).
