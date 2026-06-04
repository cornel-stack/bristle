# Tasks: Saved (Kanban Board) — Slice 4.5

**Feature**: `specs/020-saved-kanban/` | **Branch**: `020-saved-kanban`
**Inputs**: spec.md · plan.md

> ## ⛔ DON'T-IMPLEMENT until the founder green-lights the write-persistence decision (A1). Fast cadence: once green-lit, self-run all batches — one commit per task, gates green per task, no batch-gate stops — and report once at slice close.

## Execution model

4 batches. One commit per task. **Read-only DB; all writes are in-memory (ephemeral, A1).** **~17 tasks.**

| Batch | Theme | Tasks |
|---|---|---|
| 0 | Route + read helper + board scaffold + header | T001–T005 |
| A | Compact card + columns | T006–T008 |
| B | Ephemeral interactions (move / unsave / new / rename / add) | T009–T013 |
| C | Polish + a11y + §8 + gates + preview | T014–T017 |

### Count cross-check
New route 1 · `components/app/saved/**` ~6 (board island, header, column, card, move-menu, new-collection control) · read-only DB helper 1 (`getSavedBoard`) · 0 deps/env · 0 schema/seed · client islands = 1 tree (`SavedBoard`).

## Standing constraints (every task)
Ephemeral writes = **in-memory React state, no DB write, no storage** (reload resets to the seeded 9). **`getAppUser` used as-is** (user-scoped board; no seam change). New in-app `SavedCard` — **never edit `ProblemCardCompact`** or any shared/public leaf (empty-diff; it's a live Tier-2 leaf). Reorganize via an **accessible move-menu, no DnD dep**. Real column counts (3/2/3/1); "28 of 50" = the meter literal. 5-source badges; TF-023 now-relative times; reuse the registry + category tints + `BADGE_TO_ICON`. RSC-first. No schema/seed change — **if a write needs a new field, STOP and flag** (it won't — writes are in-memory).

---

## Batch 0 — Route + read helper + board scaffold + header
- [ ] **T001** Add read-only `getSavedBoard(userId): Promise<SavedBoardColumn[]>` to `packages/db/src/queries.ts` (`SavedBoardColumn = { collection: SavedCollection; problems: Problem[] }`; `saved_collections` by user ordered by `position` + `user_saved_problems` by user with `collection_id`/`position` joined to `problems`, cards ordered). Read-only.
- [ ] **T002** Export `getSavedBoard` + `SavedBoardColumn` from `packages/db/src/index.ts`. (Sequential after T001.)
- [ ] **T003** Create `apps/web/src/app/app/saved/page.tsx` — RSC: `getAppUser()` → `getSavedBoard(user.id)` + `getUsageMeters(user.id)` (reuse, for 28/50) → `<SavedBoard initial savedMeter />` in the shell. No middleware/auth change.
- [ ] **T004** Create `apps/web/src/components/app/saved/saved-board.tsx` (`"use client"`) — seed `initial` into board `useState`; render read-only columns this batch (interactions in Batch B). Ephemeral state only.
- [ ] **T005** Create `apps/web/src/components/app/saved/saved-header.tsx` — "Saved problems" + "28 of 50 · organized into N collections" (meter literal + real N) + Export all / New comparison (visual) / New collection (accent) slots.
- [ ] **STOP-0 gate** (self-checked): anonymous `/app/saved` → 307 `/login`; tsx probe of `getSavedBoard` (4 columns, 3/2/3/1, ordered); typecheck/lint/build.

## Batch A — Compact card + columns
- [ ] **T006** [P] Create `apps/web/src/components/app/saved/saved-card.tsx` — new compact card (category chip via the reused `CategoryChip`, `↑+momentumPct%`, clamped title, source badges via `SourceIcon`+`BADGE_TO_ICON`, now-relative time), wrapped in a `/app/problems/[slug]` link + a per-card overflow control (Move/Remove host). **Not** `ProblemCardCompact`.
- [ ] **T007** [P] Create `apps/web/src/components/app/saved/saved-column.tsx` — column header (color dot + name + real count + menu) + cards + "+ Add problem" affordance.
- [ ] **T008** Render columns + cards in `saved-board.tsx` (horizontal scroll on overflow). **Gate**: cards render the seeded 9 (3/2/3/1), link to detail; build.

## Batch B — Ephemeral interactions
- [ ] **T009** Move-menu — per-card "Move to collection" (+ within-column up/down) → in-memory state transition; counts update.
- [ ] **T010** Remove (unsave) — per-card Remove → drops the card from state.
- [ ] **T011** New collection — header control adds an empty column (inline-named) to state.
- [ ] **T012** Rename — inline-editable column title → updates state.
- [ ] **T013** "+ Add problem" — ephemeral picker (problems not already in that column) → adds to state. **Gate**: each interaction mutates the board in-session; reload resets; build + keyboard-operable.

## Batch C — Polish + a11y + §8 + gates + preview
- [ ] **T014** Light/dark parity; responsive (columns scroll / mobile stack; cards reflow).
- [ ] **T015** A11y — menu roles + focus management (open/close, Escape, return focus), labelled controls, focus rings; the move/new/rename flows keyboard-complete.
- [ ] **T016** `CLAUDE.md` §8 doc-only note — the Saved board + the **ephemeral write-model** convention (in-memory, resets on reload; Tier-5.5 swaps to real per-user server actions — **TF-028**) + the new-`SavedCard`-not-`ProblemCardCompact` note. No rule change.
- [ ] **T017** Gates + preview — typecheck/lint/build 4/4; per-route First Load JS; push → preview. **Slice-close report**: gates, invariants (empty-diff on shared leaves, no DB write, no schema/seed), diff scope, the `getSavedBoard` probe, preview URL + the page-4 checklist (incl. **reload-resets** + the move/new/rename walk).

## Slice-integrity manifest
- **NEW**: `app/app/saved/page.tsx`; `components/app/saved/**`; `packages/db` `getSavedBoard` + `SavedBoardColumn`.
- **EDIT**: `packages/db` queries/index; `CLAUDE.md` §8.
- **UNCHANGED**: Tier-3 auth + middleware; 4.1 schema/seed; 4.2 shell/sort/adapter/registry; 4.3 detail + `getSavedProblemIds`; **`ProblemCardCompact` + shared/public leaves**; public routes.

## Risks & follow-ups
TF-028 (Tier-5.5: in-memory transitions → real per-user write server actions — the write seam). Move-menu is the no-dep accessible baseline; DnD-lib would be a dep decision (escalate). Cross-screen ephemerality is by-design (both seeded-truth on load).
