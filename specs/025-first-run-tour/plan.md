# Implementation Plan: First-Run Tour — Slice 3.7 (Tier-4 capstone)

**Branch**: `025-first-run-tour` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT** until green-lit. Fast cadence: self-run on green-light; report at close. **Deferred Tier-3 slice, shipped as the Tier-4 capstone** — after it, tag **v0.4.0**.

## Summary

A 5-step spotlight tour that auto-runs on the dashboard for a first-time-this-session user (onboarding.pdf p.3): the dashboard dims, the current step's target is spotlit, and a bubble card (Tour · N of 5, serif title, body, mono ⌘ tip chip, 5 dots, Back / Next →, × close, "End tour and explore on my own") walks them through the command palette, a problem card, the save action, and alerts, then a closing step. **A1 — ephemeral, session-scoped, in-memory state**: seeded "not yet seen" on load, dismissible (Skip/End/×/Esc/step-5), survives soft navigations, resets on a hard reload. **No DB write, no server action, no localStorage, no sessionStorage** (the Tier-4 ephemeral convention — 4.5/4.6/4.9). **A2 — hand-rolled spotlight** (overlay + focus management + positioned bubble + 5-step state machine), **no new dependency** (the 4.8 dependency rule). **A3 — small in-app data-attribute anchors** on the components that own the targets; **no shared/public leaf is edited**. **No schema/seed/migration** — the slice writes nothing and adds no `tour_completed` column (it doesn't exist today; the real-persist path is 5.5 / TF-028).

## Constitution Check

RSC-first shell with the tour as the ONE new client island (interactivity genuinely requires it); reuses the established dialog/focus-trap pattern; §4 tokens (dim overlay `bg-text-primary/40` like the other dialogs, accent-bristle spotlight ring, serif bubble title, mono tip chip, 180ms / reduced-motion); voice (no exclamation, dry copy); build-exactly-the-slice (the tour writes nothing — ephemeral, not a write); **wrap-not-mutate** holds on shared/public leaves (the `@bristle/ui` `ProblemCardFull` is NOT touched — anchor the in-app wrapping `Link`); **no new dep** (A2); no storage (A1). **PASS.**

## Architecture

### The session-scoped ephemeral flag (A1)
The dismissed/completed flag must survive soft (SPA) navigations but reset on a hard reload, so it cannot live in the tour island's own mount state (which re-fires on every Dashboard re-visit). **Recommended: a module-level in-memory singleton** in the tour's client module (`let tourDismissed = false`) — self-contained, persists across soft nav (module stays loaded), resets on hard reload (module re-evaluated), writes nowhere. *Alternative (confirm): a shell-level `TourContext` provider mounted in `app/app/layout.tsx` — the CategoriesContext (4.9) precedent; consistent + reactive, but one more layout touch. Recommendation: module-level singleton (the slice already touches shell components only for anchors; avoid a second provider).* Tier 5.5 (TF-028) swaps it for a real per-user `tour_completed` read/write.

### The tour island (the one client island)
`components/app/tour/first-run-tour.tsx` (`"use client"`) — mounted on the dashboard route only (`app/app/page.tsx`). On mount: if `!tourDismissed`, open on step 1. Owns `currentStep` (0–4) in `useState`. Renders:
- **Dim overlay** — `fixed inset-0 bg-text-primary/40` (the shared dialog dim).
- **Spotlight cutout** — a positioned box at the active step's target rect, lifted above the dim with an accent-bristle ring (the classic hand-roll: a box at the target rect with `box-shadow: 0 0 0 9999px <dim>` cuts the hole; `pointer-events-none`). The closing/centered step has no target → no ring.
- **Bubble** (`role="dialog"`, `aria-modal`, focus-trapped) — positioned near the target rect (below/beside via `getBoundingClientRect`); Tour · N of 5, serif title, body, the mono ⌘ tip chip, 5 step-dots, Back (hidden on step 1) / Next → (step 5 = "Done"), × close, "End tour and explore on my own" footer. `aria-live="polite"` announces step changes.
- **Reposition** — recompute target rect on `resize`/`scroll` (the one genuinely-uncertain bit — A2). Reduced-motion → opacity-only.

The 5 static steps live in a `tour-steps.ts` constants module (`{ index, title, body, tip?, targetKey }`) — a neutral non-client module shared by the island (the slice-015 `constants.ts` pattern), no fixtures, no reads.

### Target anchoring (A3 — in-app, data-attribute touches)
`data-tour="<key>"` on the in-app components that own each target; the tour resolves them with `document.querySelector('[data-tour="…"]')`:
- **`app-topbar.tsx`** (or `command-palette-trigger.tsx`) — `data-tour="palette"` on the ⌘K trigger.
- **`dashboard/problem-grid.tsx`** — `data-tour="problem-card"` on the **first** card's wrapping `Link` (index 0). The shared `ProblemCardFull` leaf is NOT touched.
- **`app/sidebar-nav.tsx`** — `data-tour` on the **Saved** + **Alerts** nav items (driven off the existing `NAV` array — add an optional `tourKey`).
- Missing target → that step centers the bubble (no ring), never blocks (empty-dashboard / narrow-width degradation).

### The 5-step mapping (A4 — confirm; design shows only step 2)
1. Command palette → `palette` · 2. Problem card → `problem-card` *(design-confirmed)* · 3. Save → `saved` nav *(cards have no visible save button — the S-shortcut is taught in step 2's tip)* · 4. Alerts → `alerts` nav · 5. Closing → centered, no target. *(Alt: welcome-first — copy/anchor only, identical architecture.)*

### Mount + gating
The island mounts inside the dashboard page (a Server Component renders `<FirstRunTour />`). Gated to the dashboard route by virtue of where it's mounted; `auth()` + `getAppUser` gate via the shell (no new gate). No new read — the tour renders against the DOM already present.

### Bundle / motion
The tour is the one new client island; everything else stays RSC. Tokens → light/dark. 180ms / `cubic-bezier(0.2,0,0,1)`; reduced-motion → opacity-only / 0ms. Reuses the dialog focus-trap (focus-in, Tab-trap, Esc, focus-return).

## Batching (self-run; one commit per task)
- **Batch A** — the tour island + steps module + the dim/spotlight/bubble + the 5-step state machine + the ephemeral session flag, mounted on the dashboard. Gate: hard-load `/app` → tour auto-runs step 1; Next/Back walk 1→5; ×/Esc/End dismiss; soft-nav away+back does not re-open; reload re-runs; build.
- **Batch B** — anchoring: `data-tour` on the topbar trigger, the first problem-card Link, the Saved/Alerts nav items; the spotlight tracks each real target + repositions on resize/scroll. Gate: each step spotlights its real element; missing-target centers gracefully.
- **Batch C** — polish + a11y (focus-trap, `aria-live` step announcements, Enter/Space on Back/Next, focus-return, reduced-motion) + §8 note + gates + preview. Gate: founder preview (the 5-step walk + skip + reload-reruns + light/dark + mobile + keyboard).

## Slice-integrity manifest
- **NEW (in-app)**: `components/app/tour/first-run-tour.tsx` (the island) + `components/app/tour/tour-steps.ts` (the 5 static steps; neutral non-client module).
- **EDIT (in-app)**: `app/app/page.tsx` (mount `<FirstRunTour />`); `app-topbar.tsx` *(or `command-palette-trigger.tsx`)*, `dashboard/problem-grid.tsx`, `app/sidebar-nav.tsx` (the `data-tour` anchors); `CLAUDE.md` §8 + pointer. *(+1 if A1 lands on the shell-context variant: `app/app/layout.tsx` provider mount — flagged, not assumed.)*
- **UNCHANGED**: Tier-3 auth + middleware; **4.1 schema/seed** (nothing added — no `tour_completed`); the 4.3–4.9 screen logic; **`packages/db`** (no new helper — the tour reads no data); **all shared/public leaves** (incl. `@bristle/ui ProblemCardFull`); public routes. **No schema/seed/migration; no DB write; no localStorage/sessionStorage; no new dep.**

## Risks & follow-ups
- **TF-028** (Tier-5.5): the ephemeral session flag → a real per-user `tour_completed` (a NEW column + migration, which this slice does not add) read/written through the seam — the "persists across sessions" DoD made real. Now covering 4.5 / 4.6 / 4.9 **and** the tour.
- **Bubble positioning (A2)** — `getBoundingClientRect` + reposition on resize/scroll across the responsive dashboard is the one genuinely-uncertain hand-roll bit. If it proves fragile mid-build, escalate to a dependency decision (the cmdk escape hatch) rather than silently shipping a janky tour.
- **Missing-target degradation** — empty dashboard (no problem cards) or narrow widths (topbar trigger hidden): the affected step centers the bubble; the tour never blocks.
- **5-step mapping (A4)** — copy/anchor confirm; the design depicts only step 2.

## Process oddities
Sandbox-verifiable: build; the no-write / no-storage grep; the integrity diff (the island + the data-attribute anchors). The auto-run-on-first-session, the spotlight tracking, the skip/reload-reruns, and the keyboard/SR walk are **founder-run on preview** (a signed-in session + a real browser — the spotlight/positioning is DOM-runtime behavior the sandbox can't render). HTTPS-token push (SSH agent unavailable here).

### Founder preview checklist (build-plan 3.7 DoD)
1. Hard-load `/app` → the tour auto-runs on step 1 (dimmed dashboard, spotlit target, bubble).
2. **Next →** walks 1→5; the spotlight tracks the ⌘K trigger → a problem card → Saved → Alerts → a centered closing; **Back** steps back; dots + "N of 5" track.
3. × / "End tour and explore on my own" / **Esc** dismiss at any step → the dashboard is interactive.
4. Soft-navigate Dashboard → Library → Dashboard → the tour does **not** re-open. **Hard reload** → it runs again (ephemeral).
5. Keyboard-only: focus enters the bubble, Tab is trapped, Enter/Space operate Next/Back, focus returns on close; step changes are announced.
6. Light/dark; mobile; reduced-motion (opacity-only).
