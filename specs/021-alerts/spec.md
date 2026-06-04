# Feature Specification: Alerts (Watch Rules + Notification Feed)

**Feature Branch**: `021-alerts`

**Created**: 2026-06-04

**Status**: Draft

**Slice**: 4.6 (Tier 4) — fifth authenticated screen, **second write slice** (inherits the slice-4.5 ephemeral model)

**Input**: User description: "Slice 4.6 — Alerts at `/app/alerts`: the user's watch rules + a notification feed, inside the 4.2 shell, user-scoped, fully interactive in-session (ephemeral writes per the 4.5 model)."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Read the alert feed + see the rules (Priority: P1)

A signed-in builder opens Alerts and sees a notification feed (which rule fired on which problem, grouped by day, unread items marked) plus a right rail of their watch rules (category · condition · on/off · fired-count) and the delivery channels.

**Why this priority**: The feed is the surface; without it the alerts have no home. It renders the seeded 7 notifications (3 unread) + the 4 watch rules.

**Independent Test**: Sign in, open `/app/alerts`, confirm the header "3 unread · 7 in the last 7 days · 4 watch rules", the feed (7 items, 3 with an unread marker, each now-relative, problem-linked where applicable), and the rail (4 rules with toggles + fired-counts 5/3/1/New).

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open `/app/alerts`, **Then** the feed (7 seeded notifications, grouped by day) + the rail (4 watch rules + delivery channels) render in the 4.2 shell.
2. **Given** anonymous, **When** they request `/app/alerts`, **Then** they are redirected to sign-in.
3. **Given** a notification tied to a problem, **When** "Open" is activated, **Then** it navigates to `/app/problems/[slug]`; a notification with no problem (digest/weekly) renders without a dead link.
4. **Given** the rail, **When** rendered, **Then** each rule shows category + condition + on/off toggle + fired-count (5 / 3 / 1 / "New" for the never-fired off rule).
5. **Given** the header, **When** rendered, **Then** "3 unread · 7 in the last 7 days · 4 watch rules" + Mark all read / New rule.

---

### User Story 2 — Triage + manage alerts (Priority: P1)

The user filters the feed by type, marks notifications read (individually or all), toggles a rule on/off, and creates a new rule. The screen responds immediately and stays interactive for the session.

**Why this priority**: These are the slice's interactions — the second set of (ephemeral) writes in the product.

**Independent Test**: Filter to Unread → only unread show; mark one read → it loses its unread marker + the unread count drops; Mark all read → 0 unread; toggle a rule off → its state flips; New rule → a rule appears in the rail. Reload → everything resets to the seeded baseline (the ephemeral model).

**Acceptance Scenarios**:

1. **Given** the filter tabs (All / Unread / Momentum / New problems / Threshold reached), **When** one is selected, **Then** the feed narrows to matching notifications and the active count reflects it.
2. **Given** an unread notification, **When** marked read, **Then** its unread marker clears and the unread count decreases; **Mark all read** → unread count is 0.
3. **Given** a rule, **When** its toggle is flipped, **Then** its on/off state changes in-session.
4. **Given** "New rule", **When** a rule is created (category + condition + threshold), **Then** it appears in the rail with its derived "<category> · <condition>" name.
5. **Given** any interaction, **When** the page is reloaded, **Then** the feed + rules reset to the seeded baseline (**ephemeral model — no DB write**).
6. **Given** all interactions, **When** operated by keyboard, **Then** they are reachable and operable.

---

### Edge Cases

- **Ephemeral writes** — nothing persists; reload resets (the inherited 4.5 model).
- **Notification with no problem** (digest/weekly) — renders without an "Open" link.
- **Fired-count vs feed** — independent scopes; the per-rule fired-count is a rule attribute, the feed is the recent notification rows; they don't sum (honest — A2).
- **Never-fired rule** — shows "New" instead of a 0 fired-count (the off AI/ML rule).
- **Delivery channels + Manage rules** — render but don't act (Tier 6 / deeper view).
- **Now-relative times** — per-item relative time + day grouping (Today / Yesterday / Earlier) computed from now-relative `createdAt` (TF-023); no fixed dates that would drift.
- **Mobile** — feed + rail stack.

---

## Requirements *(mandatory)*

- **FR-001**: Serve `/app/alerts`, gated, inside the 4.2 shell; resolve the `getAppUser()` user (the rules + feed are the user's).
- **FR-002**: Render the notification feed — the seeded notifications grouped by day, each with a type badge, an unread marker when unread, body, now-relative time, and an "Open" link to `/app/problems/[slug]` when tied to a problem.
- **FR-003**: Render the watch-rules rail — each rule's category + condition + on/off toggle + fired-count ("New" when never fired) — and the delivery channels (visual-only).
- **FR-004**: Render the header — "N unread · M in the last 7 days · K watch rules" (real counts) + Mark all read + New rule.
- **FR-005**: Filter the feed by type (All / Unread / Momentum / New problems / Threshold reached); the active filter narrows the feed.
- **FR-006**: Mark a notification read, and mark all read — updating the unread marker + count, in-session.
- **FR-007**: Toggle a rule on/off, in-session.
- **FR-008**: Create a new rule via a form (category + condition-type + threshold), named `<category> · <condition>`, added to the rail in-session. The condition vocabulary MUST cover the 4 seeded rule types (A1).
- **FR-009**: All write interactions MUST be **ephemeral** (in-memory state; reset on reload) — **no DB write, no server action, no storage** (the 4.5 model).
- **FR-010**: Read all data from the slice-4.1 fixtures via read-only `packages/db` helper(s); **no schema/seed change** (a data-only re-anchor is flagged, not silent; a new field STOPs).
- **FR-011**: Reuse the shell + seam + registry/category tints; **do not edit any shared/public component**.
- **FR-012**: Deferred (render, don't act): Delivery channels, Manage rules / Watch rules buttons.
- **FR-013**: Match `design/Core_app.pdf` page 5 within tolerance, light + dark, mobile-responsive.

### Key Entities *(read-only, from slice 4.1)*

- **AlertRule**: `name`, `categoryKey`, `ruleType` (momentum / new / threshold / wtp), `threshold`, `channels`, `enabled`, `firedCount` — a watch rule.
- **AlertNotification**: `type`, `title`, `body`, `problemId` (→ slug), `isRead`, `createdAt` — a feed item.
- **User (demo)**: the seam-resolved owner.

---

## Success Criteria *(mandatory)*

- **SC-001**: `/app/alerts` renders, gated, in the shell — feed (7, grouped, 3 unread) + rail (4 rules, fired 5/3/1/New) + delivery channels + header counts (3 / 7 / 4).
- **SC-002**: Filter narrows the feed; mark-read / mark-all clears unread + count; toggle flips a rule; New rule adds one with the derived name — all in-session.
- **SC-003**: Reload resets feed + rules to the seeded baseline (no DB write); notifications link to `/app/problems/[slug]` where applicable.
- **SC-004**: Keyboard-operable; matches page 5 within tolerance, light + dark, mobile-responsive.
- **SC-005**: Gates green; diff = `apps/web` + read-only `packages/db` helper(s); no schema/seed change; no shared/public leaf edited; **no DB write** (grep-clean).

---

## Assumptions

> The ephemeral write model is **inherited from 4.5 (settled)** — not re-litigated. Open items are scope + data-shape.

- **A1 — Create-rule vocabulary (confirm).** New rules use the same condition vocabulary as the 4 seeded `ruleType`s: **momentum** (`> X%`), **new** (any new problem — no threshold), **threshold** (weekly count `> X`), **wtp** (WTP mentions `> X` — a mention count, not dollars, per the seed). Scoped to a category (the 8 catalog keys). The rule **name is auto-derived** `"<Category> · <condition>"` (matching the seed labels). Form = category + condition-type + threshold (threshold hidden/omitted for "new"). **This covers the seed and creates cleanly.** **[confirm]**
- **A2 — Fired-counts vs the feed (confirm).** The 4.1 seed already supports the design: rules `firedCount` 5 / 3 / 1 / 0 (the 0 renders "New"), 7 notifications, 3 unread. The per-rule **fired-count is an independent seeded attribute** (`alert_rules.firedCount`); the **feed is the `alert_notifications` rows** — different scopes (lifetime rule fires vs recent delivered items, incl. digests not tied to one rule), so **they don't sum — and that's honest**. **No re-anchor, no new field needed.** **[confirm]**
- **A3 — Rule edit/delete: deferred (recommended).** The design surfaces toggle + fired-count + a "Manage rules" button (a deeper view, out of scope), not per-rule edit/delete. Scope = **toggle on/off + create new** (+ mark-read/all). **[confirm]** defer edit/delete (rec) vs. add ephemeral delete (trivial) now.
- **A4 — Filter tabs are client view-state (not URL-param).** Unlike the read-only Library (RSC + URL-param), Alerts is a **stateful client island** (ephemeral read/toggle state), so the type-filter is in-memory `useState` — consistent with the 4.5 Saved board (no URL state). No `localStorage`.
- **A5 — Now-relative times.** Per-item `relativeTime` + day grouping (Today / Yesterday / Earlier) from now-relative `createdAt` (TF-023) — no fixed clock-times/dates that would drift from the comp's "MAY 12".
- **A6 — Deferred buttons.** Delivery channels (Tier 6) + Manage rules / Watch rules render visual-only.
- **A7 — `getAppUser` used** (user-scoped rules + feed) — normal seam usage; the Tier-5.5 flip makes it the real user (and the write flip, TF-028).

## Dependencies

- Slice 4.1 fixtures (`alert_rules` 4, `alert_notifications` 7/3-unread) + `usage_meters`.
- Slice 4.2 shell + `getAppUser` seam + registry/tints.
- Slice 4.3 `/app/problems/[slug]` (notification "Open" target).
- Slice 4.5 ephemeral write model (the inherited pattern).
- `design/Core_app.pdf` page 5.
