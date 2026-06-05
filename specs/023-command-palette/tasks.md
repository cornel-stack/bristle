# Tasks: Command Palette (⌘K) — Slice 4.8

**Feature**: `specs/023-command-palette/` | **Branch**: `023-command-palette` | **Inputs**: spec.md · plan.md

> ## ⛔ DON'T-IMPLEMENT until green-lit — **A1 (cmdk vs hand-roll) gates the build.** Fast cadence: self-run, one commit per task; report at close. No DB write, no schema/seed, no localStorage.

## Execution model
4 batches, **~15 tasks**. The A1 choice manifests only in the palette-widget internals (T004); everything else is identical.

| Batch | Theme | Tasks |
|---|---|---|
| 0 | Index helper + palette shell + mount + trigger (shell touch) | T001–T006 |
| A | Grouped results + filter + roving nav + Enter navigate | T007–T009 |
| B | Action shortcuts + contextual actions + states | T010–T012 |
| C | Polish + a11y + §8 + gates + preview | T013–T015 |

### Count cross-check
New `components/app/command-palette/**` ~5 · read-only DB helper 1 (`getCommandIndex`) · sanctioned shell EDITs 2 (layout + topbar) · **new deps = 0 OR 1 (cmdk — the A1 decision)** · 0 schema/seed · client islands = 1 (+ tiny trigger).

## Standing constraints (every task)
**No DB write** (the palette navigates; grep-clean). **No localStorage** (open state is React state). **Real data only** — index the real 15 problems + 8 categories (no placeholders). Navigation uses the existing URL conventions (`/app/problems/[slug]`, `/app/library?category=`, `/app/compare?compare=`). **Tokens-only — no imported widget look** (whichever A1). **Empty-diff on shared/public leaves EXCEPT the sanctioned 4.2 shell touch** (layout + topbar). Save shortcut **routes to the detail** (no global write — A2). `getAppUser`/`auth()` gate via the shell (the palette mounts inside it). **No schema/seed change.**

---

## Batch 0 — Index + palette shell + mount + trigger
- [ ] **T001** Add read-only `getCommandIndex()` to `packages/db/src/queries.ts` → `{ problems: {title,slug,category}[]; categories: {key,label,count}[] }` (the 15 problems slim + the 8 categories catalog with `problemCount`). Read-only.
- [ ] **T002** Export `getCommandIndex` + its types from `index.ts`. (Sequential after T001.)
- [ ] **T003** Create `apps/web/src/components/app/command-palette/command-palette-trigger.tsx` (`"use client"`) — the topbar Search button; dispatches `bristle:open-command`.
- [ ] **T004** Create `apps/web/src/components/app/command-palette/command-palette.tsx` (`"use client"`) — the palette island: open-state + ⌘K/Ctrl+K + `bristle:open-command` listener (preventDefault); centered `role="dialog"` overlay (focus-trap + Esc + focus-return, the mobile-drawer pattern); search input; **empty list this batch**. **[A1: cmdk `<Command>` primitives OR the hand-rolled overlay/combobox — per the green-lit choice]**.
- [ ] **T005** Mount `<CommandPalette index={…}/>` in `app/app/layout.tsx` (fetch `getCommandIndex()` server-side) — the global mount (sanctioned shell touch).
- [ ] **T006** Replace the `app-topbar.tsx` visual "Search…" `<div>` with `<CommandPaletteTrigger/>` (sanctioned shell touch). **STOP-0 gate**: anon `/app` → 307 (palette gated); tsx probe of `getCommandIndex` (15 + 8 with counts); typecheck/lint/build; ⌘K opens / Esc closes (founder-run; build-verified).

## Batch A — Results + filter + nav
- [ ] **T007** Grouped result rows — Problems (title + category chip + momentum), Categories (label — "N problems"), and the group headers + counts; a flat filtered list for nav.
- [ ] **T008** Substring filter (case-insensitive) over the index; ↑↓ move a single highlight across all visible items (spanning groups), `aria-activedescendant`; the footer count ("N results across M groups").
- [ ] **T009** Enter navigates the highlighted item (`router.push` + close): problem → `/app/problems/[slug]`; category → `/app/library?category=[key]`. **Gate**: ⌘K → "stripe" → Problems group → Enter → detail (the DoD); build.

## Batch B — Shortcuts + actions + states
- [ ] **T010** `command-actions.ts` — build the contextual Actions from the query (Search Library for '<q>' → `?q=`; Open Library filtered to <Category> → `?category=`; route Save/Create-alert items to the detail / `/app/alerts`). Render the Actions group.
- [ ] **T011** Per-result action shortcuts on a highlighted problem: compare (⌘C / `\`) → `/app/compare?compare=[slug]`; save (⌘S / `S`) → `/app/problems/[slug]` (A2 — no write).
- [ ] **T012** Empty-query default (recent/all) + no-match "No results" state + the footer hint bar. **Gate**: shortcuts route; no-match state; build.

## Batch C — Polish + a11y + §8 + gates + preview
- [ ] **T013** A11y — combobox/listbox roles (or cmdk's), `aria-activedescendant`, focus trap + Esc + focus-return to the trigger, the hint bar labelled; light/dark + responsive.
- [ ] **T014** `CLAUDE.md` §8 note — the global ⌘K palette (shell-mounted, gated); the A1 outcome (cmdk dep OR hand-rolled — the one no-dep exception); `getCommandIndex`; navigations only (Save→detail, A2); the sanctioned shell touch. Doc-only.
- [ ] **T015** Gates 4/4; push → preview. **Slice-close report**: gates, invariants (no DB write grep, empty-diff except the shell touch, no schema/seed, no localStorage, A1 dep footprint), diff scope (incl. the layout/topbar diff + the dep line if cmdk), `getCommandIndex` probe, preview URL + the page-7 checklist.

## Slice-integrity manifest
NEW: `components/app/command-palette/**`; `packages/db` `getCommandIndex`. EDIT (sanctioned): `app/app/layout.tsx`; `app-topbar.tsx`; `packages/db` queries/index; `CLAUDE.md` §8; **package.json + lockfile if cmdk**. UNCHANGED: Tier-3 auth+middleware; 4.1 schema/seed; the 4.3–4.7 screens; shared/public leaves; public routes.

## Risks & follow-ups
A1 = the first Tier-4 dep if cmdk (principled exception) vs ~200 bounded hand-rolled lines. Save→detail (real persistence 5.5). Custom categories (4.9) extend the index later. No-write/no-storage held.
