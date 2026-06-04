# Implementation Plan: Saved (Kanban Board) — Slice 4.5

**Branch**: `020-saved-kanban` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT GUARD** — design-artifact plan. No code until the founder green-lights the consolidated review (the write-persistence decision in particular).

## Summary

Build the Saved Kanban board at `/app/saved` — the fourth Tier-4 screen and **the first write slice**. A Server Component resolves the `getAppUser()` board owner, reads the saved board through one new read-only `packages/db` helper + the existing usage meter, and hands the data to a **client board** that holds it as **in-memory state**. All interactions — move card across/within collections, unsave, new/rename collection, add — mutate **client state only**; **nothing persists** (reload resets to the seeded 9). Reorganize uses an accessible **"Move to…" menu** (no DnD dependency). The compact card is a **new in-app component** (the shared `ProblemCardCompact` doesn't match the minimal Saved card and is a live Tier-2 leaf — not edited). No schema/seed change.

## Technical Context

TypeScript 5 strict · Next.js 15 App Router · React 19 · `@bristle/ui` (`SourceIcon`) · `@bristle/db` (read helpers) · `@bristle/shared` (`resolveBadge`, `CATEGORY_LABELS`) · lucide · next-themes. **No new dependency** (no DnD/board lib — accessible move-menu). Supabase Postgres **read-only** this slice (the writes are in-memory). Gates: typecheck/lint/build + a tsx probe of the board read. Editorial light/dark, mobile-responsive.

## Constitution Check

| Rule | Status | Note |
|---|---|---|
| §3 stack / RSC-first | ✅ | RSC page; one client board island holding ephemeral state. |
| §4 tokens / §4.1a tints | ✅ | Category chips + collection color dots via tokens. |
| §5 (kebab, DB via Drizzle, no localStorage) | ✅ | **Ephemeral = in-memory React state, NOT storage** (§9.6 honored). |
| §6 voice | ✅ | Plain empty/affordance copy. |
| §9.4 build exactly the slice | ✅ | Export/Compare deferred; no real persistence (A1). |
| §9.5 no new lib | ✅ | Accessible move-menu, no DnD dep. |
| §9.6 no localStorage/sessionStorage | ✅ | Board state is component state; resets on reload. |
| **Wrap-not-mutate shared leaves** | ✅ | New in-app `SavedCard`; `ProblemCardCompact` (Tier-2 leaf) untouched. |

**Result**: PASS.

## Architecture

### Route + read (FR-001/002/003)
`app/app/saved/page.tsx` — async RSC inside `app/app/layout.tsx` (gated; `/app/:path*` covers it — **no middleware/auth change**). `const user = await getAppUser()` → `getSavedBoard(user.id)` + `getUsageMeters(user.id)` (reuse, for the 28/50 literal) → render `<SavedBoard initial={columns} savedMeter={…} />`.

### Read helper (read-only, the one DB delta)
`getSavedBoard(userId): Promise<SavedBoardColumn[]>`, `SavedBoardColumn = { collection: SavedCollection; problems: Problem[] }`. Reads `saved_collections` (by user, order `position`) + `user_saved_problems` (by user, with `collection_id` + `position`) joined to `problems`; assembles ordered columns. Read-only; no schema change. (Uncategorized saves — `collection_id` null — are none in the seed; rendered nowhere this slice.)

### Write-persistence model (A1) — ephemeral
`SavedBoard` is a **client component** (`"use client"`) seeded once from `initial` into `useState` (a normalized board: `{ columns: {id,name,color,cards: Problem[]}[] }`). Every interaction is a pure state transition — **no server action, no `fetch`, no DB write, no storage**. The seam stays read-only; Tier-5.5 swaps these transitions for real per-user server actions (the write analogue of the read seam). Cross-screen: the detail (4.3) re-reads the DB = seeded truth; this board's edits are per-page and vanish on reload — both honest to the same baseline.

### Compact card (FR-011) — new in-app `SavedCard` (wrap)
`components/app/saved/saved-card.tsx` — category chip (reuse the Library `CategoryChip`) + momentum (`↑+X%`) top, clamped title, source badges (`SourceIcon` via the reused `BADGE_TO_ICON`) + now-relative time bottom; wrapped in a `/app/problems/[slug]` link. **Does not** reuse/edit `ProblemCardCompact` (renders a sparkline + quote the Saved card lacks, and is a shared Tier-2 leaf). A per-card overflow control hosts **Move to… / Remove** (the reorganize + unsave actions).

### Reorganize (A2) — accessible move-menu
A per-card menu ("Move to collection" → the other columns; "Remove") + a column-header menu ("Rename" / and the "+ New collection" / "+ Add problem" affordances). All keyboard-operable (`button` + a simple menu; focus management). No DnD dependency. Within-column reorder via "Move up/down" in the same menu (or order is preserved on cross-column move). New collection: a header "New collection" button adds an empty column to state (inline-named); rename: an inline editable column title.

### Header + buttons (FR-003/009)
`saved-header.tsx` — "Saved problems" + "28 of 50 · organized into N collections" (meter literal + real N) + Export all / New comparison (visual-only) / New collection (ephemeral, accent primary).

### Bundle / motion
Islands = the `SavedBoard` (the board + its menus are interactive → one client island tree). Reduced-motion via the global reset. Tokens → light/dark. Columns scroll horizontally on overflow (`overflow-x-auto`), stack/reflow on mobile.

## Batching (STOP-gated for structure; self-run on the fast cadence — one commit per task, gates green per task, no batch-gate stops)

- **Batch 0 — Route + read helper + board scaffold.** `getSavedBoard` + export; `app/app/saved/page.tsx` (RSC → getAppUser → getSavedBoard + meter); `saved-board.tsx` client shell hydrating `initial` into state + rendering read-only columns; `saved-header.tsx`. Gate: anonymous `/app/saved` → 307; tsx probe of `getSavedBoard` (4 columns, 3/2/3/1, ordered); typecheck/lint/build.
- **Batch A — Card + columns.** `saved-card.tsx` (new compact wrap) + `saved-column.tsx` (header: color dot + name + real count + menu; cards; "+ Add problem"). Real cards render, link to detail. Gate: build.
- **Batch B — Ephemeral interactions.** Move-menu (cross/within-collection move), Remove (unsave), New collection, Rename, "+ Add problem" picker — all in-memory state transitions. Gate: build + a11y (menus keyboard-operable).
- **Batch C — Polish + a11y + §8 + gates + preview.** Light/dark, responsive (horizontal column scroll / mobile stack), a11y (menu roles/focus, labelled controls), CLAUDE §8 doc note (the ephemeral write-model convention + the Tier-5.5 write-flip pointer), gates, preview push.

## Slice-integrity manifest

- **NEW**: `app/app/saved/page.tsx`; `components/app/saved/**` (`saved-board` client, `saved-header`, `saved-column`, `saved-card`, the move/menu bits); `packages/db` `getSavedBoard` + `SavedBoardColumn` (read-only).
- **EDIT**: `packages/db/src/queries.ts` + `index.ts`; `CLAUDE.md` §8 doc note + SPECKIT pointer.
- **UNCHANGED**: Tier-3 auth + middleware; 4.1 schema/seed; 4.2 shell / sort / adapter / registry; 4.3 detail + `getSavedProblemIds`; **`ProblemCardCompact` + all shared/public leaves** (empty-diff); public routes; the Library/dashboard.

## Risks & follow-ups

- **Ephemeral write model is the tier decision** — once green-lit it sets 4.6 (Alerts) / 4.7 (Compare) / 4.9 (Add-category) writes. The Tier-5.5 flip turns the in-memory transitions into real per-user server actions (the write seam) — **TF-028 (new)**.
- **Cross-screen ephemerality** — board edits don't reflect on the 4.3 Save button in-session (both seeded-truth on load); resolved by the model, noted for the STOP walk.
- **Move-menu vs DnD** — if a pointer-DnD is later wanted, it layers on the menu; a DnD *library* is a dep decision (escalate), not assumed.
- **No `getAppUser` change** — used as-is (user-scoped board); the seam is unchanged.

## Process oddities

- **Sandbox-verifiable**: anonymous `/app/saved` → 307 `/login`; `pnpm build`; tsx probe of `getSavedBoard` over the seed; integrity diff. The ephemeral interactions (client state) are **founder-run on preview** (a signed-in session) — though the read + the reset-on-reload are explainable from the model.
- dev == prod single Supabase — **read-only this slice** (the whole point of the ephemeral model). HTTPS-token push.

### Founder preview checklist (page 4)
1. Header: "Saved problems" · "28 of 50 · organized into 4 collections" · Export all / New comparison / New collection.
2. 4 columns (color dot + name + **real** count 3/2/3/1) with the seeded cards; a card → `/app/problems/[slug]`.
3. Move a card across collections (menu) → counts update; reorder within; Remove (unsave) → leaves board; New collection → empty column; Rename → header updates.
4. **Reload → board resets to the designed 9** (the ephemeral model).
5. Keyboard: card menu, move, new/rename reachable; focus rings.
6. Light/dark; mobile (columns scroll/stack).
7. Export all / New comparison render but don't act (deferred).
