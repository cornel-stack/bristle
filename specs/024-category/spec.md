# Feature Specification: Add Custom Category

**Feature Branch**: `024-category`

**Created**: 2026-06-05

**Status**: Draft

**Slice**: 4.9 (Tier 4) — the LAST Tier-4 slice. Third ephemeral write slice, and the first **cross-route** ephemeral write.

**Input**: User description: "Slice 4.9 — a '+ Add category' button on the dashboard opens a modal (name, optional keywords, target-source checkboxes); creates a custom category that the UI picks up immediately — visible in the sidebar, selectable as an alert filter, and in the command-palette index. Ephemeral (no DB write; resets on reload); the real insert + pipeline ingestion are Tier 5."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a custom category, see it everywhere (Priority: P1)

A signed-in builder clicks "+ Add category" on the dashboard, fills a modal (name, optional keywords, which sources to watch), and creates it. The new category appears **immediately** in the sidebar, is selectable in the alert-rule form's category dropdown, and shows in the command-palette Categories results — all in the same session, without a reload.

**Why this priority**: This is the slice — the DoD. The cross-route visibility (sidebar / alert filter / palette) is the whole point and the reason this needs a shell-level mechanism.

**Independent Test**: Dashboard → "+ Add category" → name "Edge Runtime" + a source or two → Create → see "Edge Runtime" in the sidebar; open `/app/alerts` → New rule → "Edge Runtime" is in the category dropdown; ⌘K → type "edge" → "Edge Runtime" appears under Categories. Reload → it's gone (ephemeral).

**Acceptance Scenarios**:

1. **Given** the dashboard, **When** "+ Add category" is clicked, **Then** a modal opens (name, optional keywords, source checkboxes from the 5 live registry badges), focus-trapped, Esc closes.
2. **Given** the modal, **When** a name + (optional) keywords/sources are submitted, **Then** the category is created **in-session** and the modal closes.
3. **Given** the created category, **When** the user looks at the **sidebar**, **Then** it appears in the categories list (alongside the watched ones).
4. **Given** the created category, **When** the user opens the **alert-rule form** (`/app/alerts` → New rule), **Then** it is selectable in the category dropdown.
5. **Given** the created category, **When** the user opens the **command palette** and types its name, **Then** it appears under Categories.
6. **Given** any of the above, **When** the page is reloaded, **Then** the custom category is gone (ephemeral — no DB write), exactly like the other ephemeral writes.

---

### User Story 2 — Modal validity + states (Priority: P2)

The modal validates a non-empty name; the source checkboxes use the 5 live badges; Cancel/Esc dismiss without creating.

**Acceptance Scenarios**:

1. **Given** an empty name, **When** submitted, **Then** creation is blocked (the name is required).
2. **Given** the source checkboxes, **When** rendered, **Then** they are the 5 registry badges (GitHub, Hacker News, Stack Exchange, App Store, Forums) — no Product Hunt / Google Play.
3. **Given** Cancel or Esc, **When** activated, **Then** the modal closes without creating; focus returns to the trigger.

---

### Edge Cases

- **Cross-route ephemeral** — the new category is visible across the sidebar (shell), the alerts route, and the palette (shell) in-session; a reload resets to the seeded catalog (the per-page ephemeral model, raised to shell scope — A1).
- **Duplicate name** — a custom category whose key collides with an existing one is de-duplicated (or suffixed) — not two identical sidebar entries.
- **Custom category chip** — its key won't match the 8 canonical §4.1a tints, so it renders with the neutral chip (honest; not a broken tint).
- **No DB write / no localStorage** — the new category lives in shell-level React state only.
- **No migration** — the `categories` table already carries `is_custom` + `created_by_user_id` (A3); if missing, STOP (a 4.1 shape gap, not a 4.9 add).

---

## Requirements *(mandatory)*

- **FR-001**: A "+ Add category" affordance on the dashboard MUST open a modal — name (required), optional keywords, and target-source checkboxes (the 5 live registry badges). Focus-trapped (`role="dialog"`), Esc/Cancel close + restore focus.
- **FR-002**: Submitting MUST create a custom category **in-session** (`isCustom = true`, a derived key) and close the modal — **no DB write, no localStorage**.
- **FR-003**: The new category MUST appear **immediately, cross-route**: in the sidebar (shell), the alert-rule form's category dropdown (`/app/alerts`), and the command-palette Categories index (shell) — without a reload.
- **FR-004**: All three surfaces MUST source their categories from a single **shell-level ephemeral context** seeded from the server categories on load; the modal adds to it; a reload resets it (A1).
- **FR-005**: A reload MUST reset to the seeded catalog (the custom category vanishes) — the ephemeral model, now at shell scope.
- **FR-006**: The change set MUST be **in-app components only** — the dashboard (button + modal), the layout (provider + seed), the sidebar, the alert form, and the palette read/route through the context; **no shared/public leaf is edited**; **no schema/seed/migration** (A3).
- **FR-007**: Reuse the shell + the 5-source registry + the existing category reads (no new `packages/db` helper); the real categories (the 8 catalog + ephemeral additions) — no placeholders.
- **FR-008**: Match the build-plan 4.9 DoD + the dashboard modal treatment, light + dark, mobile-responsive.

### Key Entities *(read-only seed + ephemeral additions)*

- **Category** (`categories` table — already has `is_custom`, `created_by_user_id`): the 8 catalog (seeded) + ephemeral custom additions (in-session only).
- **Ephemeral custom category**: `{ key, label, count: 0, isCustom: true, sources[], keywords? }` — shell-state only.

---

## Success Criteria *(mandatory)*

- **SC-001**: "+ Add category" → modal (name/keywords/5-source checkboxes, focus-trapped) → Create → the category appears in the sidebar, the alert dropdown, and the palette **in-session, no reload**.
- **SC-002**: Reload → the custom category is gone (ephemeral; no DB write — grep-clean).
- **SC-003**: The three surfaces read from the shell context (seeded from the 8 catalog); the source checkboxes are the 5 live badges.
- **SC-004**: Keyboard + screen-reader accessible (dialog, labels, Esc, focus-return); light + dark; mobile.
- **SC-005**: Gates green; diff = `apps/web` in-app components only (dashboard + layout + sidebar + alert-form + palette + the context/modal); **no schema/seed/migration, no new `packages/db` helper, no shared/public leaf edit, no new dep, no localStorage**.

---

## Assumptions

- **A1 — Cross-route ephemeral mechanism: a shell-level `CategoriesContext` (THE decision).** A client provider mounted in the shell layout, seeded from the server categories on load; the modal `addCategory(...)` appends an ephemeral custom category; the sidebar, alert-form dropdown, and palette index all **read from the context**; reset on reload (in-memory, no DB write, no localStorage). It is the **cross-route evolution of the per-page ephemeral model** — deferred in 4.5 as over-engineering for single-page edits, but **warranted here** because the DoD requires cross-route visibility. Tier 5.5 (TF-028) swaps it: create → a real insert (`is_custom` + `created_by_user_id`); the context → a server-fetched list. **[DECISION — confirm]** vs. URL-param (clunky — the category definition, incl. keywords/sources, would ride every navigation) vs. a visual stub (fails the DoD — not acceptable).
- **A2 — Surface touches (the tier's widest blast radius — bounded, in-app).** The created category surfaces in three reads routed through the context: the **sidebar** (4.2 — its categories list becomes a small client consumer of the context), the **alert-rule form** (4.6 — its dropdown reads the context instead of the static `CATEGORY_LABELS`), the **palette** Categories index (4.8 — reads the context instead of `index.categories`). Plus the **dashboard** (the "+ Add category" button → the new modal) and the **layout** (the provider + the seed). All are **in-app components** (reading the context, not restructuring the screens); **no shared/public leaf** is touched. The exact diff to each is in the manifest. **[confirm]**
- **A3 — Schema already present (confirmed).** `categories.is_custom` (boolean, default false) + `categories.created_by_user_id` (→ users) exist from the 4.1 full schema — **no migration**. The modal's source checkboxes use the 5-source registry.
- **A4 — Edit/delete custom categories: deferred.** The DoD is add-only; edit/delete are out of scope (and an ephemeral custom category vanishes on reload anyway). **[confirm]** defer (rec).
- **A5 — Custom-category key + tint.** The key is derived from the name (slugified, de-duplicated); its chip renders neutral (no §4.1a tint for a non-canonical key) — honest.

## Dependencies

- Slice 4.1 schema (`is_custom` + `created_by_user_id` — present) + the 8-category catalog.
- Slice 4.2 shell (sidebar + dashboard + layout) — the provider mount + the sidebar consumer.
- Slice 4.6 alert-rule form — the dropdown consumer.
- Slice 4.8 command-palette index — the Categories consumer.
- The 5-source registry (`SOURCE_BADGES`).
- The build-plan 4.9 row (the DoD).
