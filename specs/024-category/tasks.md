# Tasks: Add Custom Category — Slice 4.9

**Feature**: `specs/024-category/` | **Branch**: `024-category` | **Inputs**: spec.md · plan.md

> ## ⛔ DON'T-IMPLEMENT until green-lit. Fast cadence: self-run, one commit per task; report at close. **Last Tier-4 slice.** Third ephemeral write — first **cross-route** (shell-level context). No DB write, no schema/seed, no localStorage, no new dep.

## Execution model
3 batches, **~13 tasks**.

| Batch | Theme | Tasks |
|---|---|---|
| 0 | Shell `CategoriesContext` + seed + re-route the 3 consumers | T001–T006 |
| A | Add-category modal + button + addCategory | T007–T010 |
| B | Polish + a11y + §8 + gates + preview | T011–T013 |

### Count cross-check
NEW in-app: `categories-context`, `add-category-modal`, `sidebar-categories` (3) · EDIT in-app (A2): layout + app-sidebar + new-rule-form + command-palette + header-actions (5) · **0** new `packages/db` helper (reuse `getCommandIndex` + `getWatchedCategories`) · 0 schema/seed/migration · 0 new deps · client islands = the provider + modal + sidebar consumer.

## Standing constraints (every task)
**Cross-route ephemeral = shell-level React context** (seeded from server on load; reset on reload). **No DB write** (addCategory mutates context state; grep-clean). **No localStorage.** **No schema/seed/migration** (A3 — `is_custom` + `created_by_user_id` exist; if missing, STOP). 5-source registry (`SOURCE_BADGES`) for the modal checkboxes. Real categories (the 8 + ephemeral). **Empty-diff on shared/public leaves** — every touch is an in-app component (dashboard/sidebar/alert-form/palette/layout). Reuse the shell + seam + registry. No new dep.

---

## Batch 0 — Context + seed + re-route consumers
- [ ] **T001** Create `apps/web/src/components/app/categories/categories-context.tsx` (`"use client"`) — `CategoriesProvider` (seeded `CategoryItem[]` → `useState`), `addCategory({name,keywords,sources})` (derive de-duped slug key; append `{key,label:name,count:0,watched:true,isCustom:true,sources,keywords}`), `useCategories()` hook. No DB write, no storage.
- [ ] **T002** Wrap the shell in `app/app/layout.tsx` with `<CategoriesProvider seed={…}>` — build the seed from `getCommandIndex().categories` (8 + counts) marked `watched` via the `getWatchedCategories(user.id)` keys (data the layout already fetches; no new helper).
- [ ] **T003** Create `apps/web/src/components/app/app/sidebar-categories.tsx` (`"use client"`) — `useCategories()` → render `categories.filter(c => c.watched)`; edit `app-sidebar.tsx` to render it (drop the threaded `categories` prop).
- [ ] **T004** Edit `alerts/new-rule-form.tsx` — the category `<select>` options ← `useCategories()` (all) instead of static `CATEGORY_LABELS`.
- [ ] **T005** Edit `command-palette/command-palette.tsx` — the Categories group ← `useCategories()` (filtered) instead of `index.categories` (keep `index` for problems).
- [ ] **T006** **STOP-0 gate**: build; the sidebar/alert-form/palette render the same seeded 7/8 (pure plumbing — no behavior change yet); anon `/app` → 307; tsx probe (the seed builds 8 with correct watched flags); typecheck/lint.

## Batch A — Modal + button + create
- [ ] **T007** Create `apps/web/src/components/app/categories/add-category-modal.tsx` (`"use client"`) — `role="dialog"` focus-trapped sheet (focus-on-open / Tab-trap / Esc / focus-return): name (required) + optional keywords + 5 source-badge checkboxes (`SOURCE_BADGES`); Create → `addCategory(...)` + close; Cancel/Esc → close.
- [ ] **T008** Edit `dashboard/header-actions.tsx` — the "+ Add category" button opens `<AddCategoryModal>` (client open-state).
- [ ] **T009** Name-required validation + the modal's submit wiring to `addCategory`.
- [ ] **T010** **Gate**: create "Edge Runtime" → appears in the sidebar + the alert dropdown + the palette in-session; reload resets; build + keyboard-operable.

## Batch B — Polish + a11y + §8 + gates + preview
- [ ] **T011** A11y — dialog roles/labels, focus-trap + Esc + focus-return, the source checkboxes labeled, name field labeled; light/dark + responsive.
- [ ] **T012** `CLAUDE.md` §8 note — the cross-route ephemeral `CategoriesContext` (the shell-scope evolution of the 4.5 per-page model, warranted by the DoD); the four in-app consumer touches; A3 (no migration); TF-028. Doc-only.
- [ ] **T013** Gates 4/4; push → preview. **Slice-close report**: gates, invariants (no DB write grep, empty-diff on shared leaves, no schema/seed, no new helper/dep, no localStorage), diff scope (incl. the four consumer diffs), seed probe, preview URL + the DoD checklist (create → sidebar + alert filter + palette → reload resets).

## Slice-integrity manifest
NEW (in-app): `categories-context.tsx`, `add-category-modal.tsx`, `sidebar-categories.tsx`. EDIT (in-app): `layout.tsx`, `app-sidebar.tsx`, `new-rule-form.tsx`, `command-palette.tsx`, `header-actions.tsx`, `CLAUDE.md` §8. UNCHANGED: Tier-3 auth+middleware; 4.1 schema/seed; the 4.3–4.8 screen logic; `packages/db` (reuse existing reads); shared/public leaves; public routes.

## Risks & follow-ups
TF-028 (Tier-5.5: ephemeral addCategory → real insert with is_custom + created_by_user_id; context → server-fetched). Sidebar consumer is the largest A2 diff (bounded). Edit/delete + pipeline ingestion out of scope (A4 / Tier 5). After this slice → Tier 4 complete → v0.4.0 tag.
