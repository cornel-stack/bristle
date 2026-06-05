# Implementation Plan: Add Custom Category — Slice 4.9

**Branch**: `024-category` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT** until green-lit. Fast cadence: self-run on green-light; report at close. **Last Tier-4 slice.**

## Summary

The "+ Add category" modal — the third ephemeral write slice, and the first that needs **cross-route** visibility (sidebar / alert filter / palette), which the per-page ephemeral state from 4.5/4.6 can't reach. The mechanism (A1) is a **shell-level `CategoriesContext`**: a client provider mounted in the gated layout, seeded from the server categories on load; the dashboard modal `addCategory(...)` appends an ephemeral custom category; the **sidebar, alert-form dropdown, and palette index read from the context**; reload resets it (in-memory — **no DB write, no localStorage**). Tier 5.5 (TF-028) swaps it for a real insert (`is_custom` + `created_by_user_id`) + a server-fetched list. **No schema/seed/migration** (A3 — the columns exist), **no new `packages/db` helper** (reuse the existing category reads), no new dep. Touches are **in-app components only** (no shared/public leaf).

## Constitution Check
RSC shell + the one cross-route ephemeral context the DoD genuinely needs; tokens/§4.1a tints (custom key → neutral chip); no storage; voice; build-exactly-the-slice (add-only; create is ephemeral, not a write); **wrap-not-mutate** holds on shared/public leaves (the dashboard/sidebar/alert-form/palette/layout touches are in-app). **PASS.**

## Architecture

### The shell-level context (A1)
`components/app/categories/categories-context.tsx` (`"use client"`) — `CategoriesProvider` seeded from a server `seed: CategoryItem[]` prop into `useState`; exposes `{ categories, addCategory }`. `CategoryItem = { key, label, count, watched, isCustom }` (+ a custom one carries its `sources`/`keywords`, unused by the readers this slice). `addCategory({ name, keywords, sources })` derives a de-duplicated slug `key`, appends `{ key, label: name, count: 0, watched: true, isCustom: true, sources, keywords }`. `useCategories()` hook for consumers. **No DB write, no localStorage** — reload re-seeds from the server.

### Layout (the mount + seed)
`app/app/layout.tsx` builds the seed from data it already fetches — `getCommandIndex().categories` (the 8 with counts) marked `watched` via the `getWatchedCategories(user.id)` keys — and wraps the shell (`<AppSidebar>` ×2 + topbar + main + `<CommandPalette>`) in `<CategoriesProvider seed={seed}>`. No new read helper.

### The four consumers (A2 — all in-app, read the context)
- **Sidebar** (`app-sidebar.tsx`): the categories list → a new client `sidebar-categories.tsx` that `useCategories()` and renders `categories.filter(c => c.watched)`. `AppSidebar` drops its `categories` prop (the layout no longer threads it). Both desktop + mobile `AppSidebar` instances consume the same provider.
- **Alert form** (`alerts/new-rule-form.tsx`): the category `<select>` options ← `useCategories()` (all categories) instead of the static `CATEGORY_LABELS` entries.
- **Palette** (`command-palette/command-palette.tsx`): the Categories group ← `useCategories()` (filtered by query) instead of `index.categories`; the `index` prop keeps supplying problems.
- **Dashboard** (`dashboard/header-actions.tsx`): the "+ Add category" button opens the new `<AddCategoryModal>` (client). 

### The modal
`components/app/categories/add-category-modal.tsx` (`"use client"`) — `role="dialog"` focus-trapped sheet (the mobile-drawer pattern: focus on open, Tab trap, Esc, focus-return): name (required) + optional keywords + the 5 source-badge checkboxes (`SOURCE_BADGES`); Create → `addCategory(...)` + close; Cancel/Esc → close. Name-required validation.

### Bundle / motion
The provider + consumers are client (the cross-route ephemeral state needs it); the rest stays RSC. The modal is the one new overlay. Reduced-motion via the global reset. Tokens → light/dark.

## Batching (self-run; one commit per task)
- **Batch 0** — the `CategoriesContext` + the layout seed/provider + re-route the three existing consumers (sidebar/alert-form/palette) to read the context. Gate: build; the sidebar/alert-form/palette render the same 7/8 as before (seeded from server) — pure plumbing, no behavior change yet; anon `/app` still 307; tsx probe (seed builds 8 + watched flags).
- **Batch A** — the `AddCategoryModal` (name/keywords/5-source checkboxes, focus-trap) + the "+ Add category" button wiring + `addCategory`. Gate: create → the category appears in all three surfaces in-session; reload resets; build.
- **Batch B** — polish + a11y (dialog/labels/Esc/focus-return) + §8 + gates + preview. Gate: founder preview (the cross-route walk).

## Slice-integrity manifest
- **NEW**: `components/app/categories/categories-context.tsx` + `add-category-modal.tsx`; `components/app/app/sidebar-categories.tsx` (the sidebar client consumer).
- **EDIT (in-app, A2)**: `app/app/layout.tsx` (provider + seed); `app-sidebar.tsx` (list → consumer); `alerts/new-rule-form.tsx` (dropdown ← context); `command-palette/command-palette.tsx` (categories ← context); `dashboard/header-actions.tsx` (button → modal); `CLAUDE.md` §8 + pointer.
- **UNCHANGED**: Tier-3 auth + middleware; **4.1 schema/seed** (the columns exist — A3); the 4.3–4.8 screens' logic; **`packages/db`** (reuse `getCommandIndex` + `getWatchedCategories` — no new helper); **all shared/public leaves**; public routes. **No schema/seed/migration; no DB write; no localStorage; no new dep.**

## Risks & follow-ups
- **TF-028** (Tier-5.5): the ephemeral `addCategory` → a real insert (`is_custom` + `created_by_user_id`); the context → server-fetched. The third write slice now under this follow-up.
- **Sidebar-consumer touch** — the largest of the A2 diffs (server list → client consumer); bounded (a small `sidebar-categories.tsx`, `AppSidebar` drops one prop).
- **Custom-category tint** — neutral chip (non-canonical key); honest.
- **Edit/delete deferred** (A4); pipeline ingestion is Tier 5.

## Process oddities
Sandbox-verifiable: anon `/app` → 307; build; **the no-write grep** + integrity diff (incl. the four in-app consumer diffs); the seed-build is build-verified. The cross-route in-session visibility + reload-reset are founder-run on preview (a signed-in session) — though reload-reset is architecturally certain (the provider re-seeds from the server per navigation/load, no persistence). HTTPS-token push.

### Founder preview checklist (build-plan 4.9 DoD)
1. Dashboard "+ Add category" → modal (name required, optional keywords, **5 source-badge** checkboxes), focus-trapped, Esc closes.
2. Create "Edge Runtime" → it appears in the **sidebar** immediately.
3. `/app/alerts` → New rule → "Edge Runtime" is in the **category dropdown**.
4. ⌘K → "edge" → "Edge Runtime" under **Categories**.
5. **Reload → it's gone** (ephemeral).
6. Light/dark; mobile; a11y (dialog, labels, focus-return).
