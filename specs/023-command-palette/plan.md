# Implementation Plan: Command Palette (⌘K) — Slice 4.8

**Branch**: `023-command-palette` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT** until green-lit — **A1 (cmdk vs hand-roll) is the gating decision**. Fast cadence: self-run on green-light; report at close.

## Summary

The global command palette at the shell level — ⌘K opens a centered, focus-trapped overlay from any authenticated page; typing filters the **real** index (15 problems + 8 categories) into grouped results (Problems / Categories / Actions); ↑↓ moves one highlight across groups, Enter navigates (existing URL conventions), Esc closes. Action shortcuts: compare (⌘C / `\`) → `?compare=`, save (⌘S / `S`) → the detail (no global write — A2). A new read-only `getCommandIndex()` feeds it (RSC → client island). The widget is **either `cmdk` or hand-rolled (A1)** — styled entirely with our tokens either way; the mount / trigger / index / navigation / actions are identical. **No DB write, no schema/seed, no localStorage.** The only sanctioned shared touch is the 4.2 shell (layout mount + topbar trigger).

## Constitution Check
RSC index → one client island; tokens-only (no imported widget look); no storage; voice; build-exactly-the-slice (save routes, doesn't write). **The no-new-dep rule (§9.5) is the explicit A1 decision** — `cmdk` is the plan's named exception; the founder confirms. **Wrap-not-mutate** holds on shared/public leaves except the sanctioned shell touch. **PASS** (A1 pending).

## Architecture (A1-agnostic except the widget internals)

### Mount + trigger (A3 — sanctioned shell touch)
- `app/app/layout.tsx`: fetch `getCommandIndex()` (RSC) → mount `<CommandPalette index={…} />` once (so ⌘K works on every `/app` page). The palette owns open-state + the ⌘K/Ctrl+K global keydown (prevents default) + the overlay.
- `app-topbar.tsx`: the visual-only "Search…" `<div>` → `<CommandPaletteTrigger>` (client button). The trigger and the palette decouple via a window event (`dispatchEvent(new Event("bristle:open-command"))`) — no context provider; the palette listens for the event + the keydown. The topbar stays a Server Component rendering a client child.

### Index (read-only — the one `packages/db` helper)
`getCommandIndex(): Promise<{ problems: { title, slug, category }[]; categories: { key, label, count }[] }>` — `problems` (the 15, slim projection) + the `categories` catalog (8, with `problemCount`). Read-only; no write. (A slim helper rather than reusing `getDashboardProblems` + a categories read, so the layout fetches exactly the palette shape.)

### The palette widget (A1 — the fork)
- **If `cmdk`**: `<Command>` / `<Command.Input>` / `<Command.List>` / `<Command.Group>` / `<Command.Item>` — headless; filtering + roving + combobox/listbox ARIA come from the lib; we style every part with tokens. Custom `onKeyDown` for the action shortcuts (⌘C/⌘S/`\`/`S`).
- **If hand-rolled**: a `role="dialog"` overlay (the mobile-drawer focus-trap/Esc pattern) + input (`role="combobox"`) + a `role="listbox"` rendering the grouped, filtered items; nav over a **flat filtered array** (`activeIndex`, ↑↓, `aria-activedescendant`) — reusing the detail-tabs roving pattern; substring filter (no fuzzy lib; ~27 items max).
- Either way: a `command-actions.ts` builds the contextual Actions from the query (the navigations, A4); a `command-footer` shows hints + count; an empty/no-match state.

### Results + navigation (FR-003..006)
Three groups from the index, filtered by the query (case-insensitive substring): Problems (title) → `/app/problems/[slug]`; Categories (label) → `/app/library?category=[key]`; Actions (contextual) → `/app/library?q=…` / `?category=…` / `/app/compare?compare=…` / `/app/alerts`. Selecting = `router.push(target)` + close. Per-result shortcuts on a highlighted problem: compare → `/app/compare?compare=[slug]`; save → `/app/problems/[slug]` (A2).

### Bundle / motion
One client island (+ the tiny trigger). `cmdk` (~5KB) if A1=cmdk. Reduced-motion via the global reset. Tokens → light/dark.

## Batching (self-run; one commit per task)
- **Batch 0** — `getCommandIndex` helper + the palette island shell (overlay + ⌘K/Ctrl+K + input + Esc + focus trap, empty list) + mount in layout + the topbar trigger (the shell touch). [A1 widget choice manifests here]. Gate: ⌘K opens/Esc closes (founder-run; structurally verifiable via build); anon `/app` still 307; tsx probe of `getCommandIndex` (15 + 8); typecheck/lint/build.
- **Batch A** — grouped results (Problems/Categories/Actions) + substring filter + ↑↓ roving across groups + Enter navigation + the footer count. Gate: build; "stripe" filters; Enter navigates (per DoD).
- **Batch B** — action shortcuts (⌘C/⌘S/`\`/`S`) + the contextual Actions builder + empty/no-match states. Gate: shortcuts route correctly; no-match state.
- **Batch C** — polish + a11y (combobox/listbox roles, `aria-activedescendant`, focus return, hint bar) + §8 + gates + preview.

## Slice-integrity manifest
- **NEW**: `components/app/command-palette/**` (command-palette client island, command-palette-trigger, command-actions, command-footer / result rows); `packages/db` `getCommandIndex` (read-only) + the index types.
- **EDIT (sanctioned A3)**: `app/app/layout.tsx` (fetch index + mount); `app-topbar.tsx` ("Search…" → trigger); `packages/db` queries/index; `CLAUDE.md` §8 + pointer; **`apps/web/package.json` + lockfile — only if A1 = cmdk**.
- **UNCHANGED**: Tier-3 auth + middleware; 4.1 schema/seed; the 4.3–4.7 screens; **all shared/public leaves** (the shell topbar/layout are the sanctioned touch); public routes. **No schema/seed/migration; no DB write; no localStorage.** New dep = the A1 decision only.

## Risks & follow-ups
- **A1 dependency** — if cmdk, it's the first Tier-4 dep (the principled exception: hand-roll presentational widgets, use a lib for the one a11y-critical interactive widget). If hand-roll, ~200 bounded lines reusing existing patterns; the across-group roving is the fiddly part (mitigated by the flat-filtered-array approach).
- **Save shortcut (A2)** — routes to the detail; real palette-save persistence is 5.5 (TF-028 family).
- **Custom categories (4.9)** — not indexed yet (8 canonical only); 4.9 will extend the index.
- **callbackUrl/TF-027** — unaffected (the palette is inside the gated shell).

## Process oddities
Sandbox-verifiable: anon `/app` → 307 (palette gated with the shell); build; **tsx probe of `getCommandIndex`** (15 + 8 with counts); no-write grep; integrity diff (incl. the shell touch + the dep line if cmdk). The interactive ⌘K open / nav / shortcuts are founder-run on preview (a signed-in session); the open/filter/navigate logic is otherwise build-verified. HTTPS-token push.

### Founder preview checklist (page 7)
1. ⌘K (and Ctrl+K, and the topbar Search) opens the centered overlay from **any** `/app` page; Esc closes (focus returns).
2. Type "stripe" → Problems group (matching problems + category chip + momentum), Categories group ("Payments — 86 problems"), Actions group (contextual) + counts + footer total.
3. ↑↓ highlights across groups; Enter → problem detail / library filter; the compare shortcut → `/app/compare?compare=…`; the save shortcut → the detail.
4. No-match → "No results"; empty query → a sensible default.
5. Light/dark; responsive; styled with our tokens (no imported look).
