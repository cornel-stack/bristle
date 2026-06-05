# Tasks: First-Run Tour — Slice 3.7 (Tier-4 capstone)

**Feature**: `specs/025-first-run-tour/` | **Branch**: `025-first-run-tour` | **Inputs**: spec.md · plan.md

> ## ⛔ DON'T-IMPLEMENT until green-lit. Fast cadence: self-run, one commit per task; report at close. **Tier-4 capstone** (deferred Tier-3 slice). The tour is **ephemeral, in-memory, session-scoped** — no DB write, no server action, **no localStorage AND no sessionStorage**, no schema/seed/migration, **no new dep** (hand-rolled spotlight, A2). After this slice → tag **v0.4.0**.

## Execution model
3 batches, **~12 tasks**.

| Batch | Theme | Tasks |
|---|---|---|
| A | Tour island + steps module + dim/spotlight/bubble + 5-step machine + ephemeral flag + dashboard mount | T001–T005 |
| B | Data-attribute anchors + spotlight tracking/reposition | T006–T008 |
| C | A11y + §8 + gates + preview | T009–T012 |

### Count cross-check
NEW in-app: `tour/first-run-tour.tsx` (island), `tour/tour-steps.ts` (neutral steps module) (2) · EDIT in-app (A3): `app/page.tsx` (mount) + `app-topbar.tsx` + `dashboard/problem-grid.tsx` + `app/sidebar-nav.tsx` (4) · **0** new `packages/db` helper (the tour reads no data) · 0 schema/seed/migration · 0 new deps · client islands = the tour island only. *(+1 EDIT `app/app/layout.tsx` ONLY if A1 lands on the shell-context variant — flagged, not assumed.)*

## Standing constraints (every task)
**Ephemeral session-scoped state** (seeded "not yet seen" on load; survives soft nav; resets on hard reload). **No DB write / no server action** (the tour writes nothing; grep-clean). **No localStorage AND no sessionStorage** (in-memory only — §9.6). **No schema/seed/migration** (no `tour_completed` column — it doesn't exist; the real-persist path is 5.5/TF-028). **No new dependency** — hand-rolled overlay + focus-trap + positioned bubble + 5-step machine (A2). **Empty-diff on shared/public leaves** — every touch is in-app; the `@bristle/ui ProblemCardFull` leaf is NOT edited (anchor its in-app wrapping `Link`). Reuse the dialog/focus-trap pattern (mobile drawer / filter drawer / add-category modal). §4 tokens, voice, light/dark, mobile, reduced-motion.

---

## Batch A — Tour island + steps + mechanism
- [ ] **T001** Create `apps/web/src/components/app/tour/tour-steps.ts` — the 5 static steps `{ index, title, body, tip?, targetKey }` per A4 (palette / problem-card / saved / alerts / closing); a neutral non-client module (no `"use client"`, no reads). Voice-checked copy; step 2 = the design-confirmed problem-card copy + the mono ⌘ tip ("press S to save · C to add to a comparison").
- [ ] **T002** Create `apps/web/src/components/app/tour/first-run-tour.tsx` (`"use client"`) — the ephemeral session flag (module-level `let tourDismissed` singleton, A1; survives soft nav, resets on hard reload — **no storage**), `currentStep` state, and the 5-step machine (Next / Back / dismiss). On mount: if `!tourDismissed`, open on step 1; dismiss sets the singleton + closes.
- [ ] **T003** The overlay + bubble (in `first-run-tour.tsx`): dim `fixed inset-0 bg-text-primary/40`; the bubble `role="dialog"` `aria-modal` — Tour · N of 5, serif title, body, mono ⌘ tip chip, 5 step-dots (active), Back (hidden step 1) / Next → (step 5 = "Done"), × close, "End tour and explore on my own" footer. §4 tokens; light/dark; rounded-modal; shadow per §4.4.
- [ ] **T004** The spotlight cutout (in `first-run-tour.tsx`): a positioned box at the active step's target rect with `box-shadow: 0 0 0 9999px <dim>` + an accent-bristle ring (`pointer-events-none`); the closing step (no `targetKey`) → centered bubble, no ring. (Target resolution + reposition land in Batch B.)
- [ ] **T005** Edit `apps/web/src/app/app/page.tsx` — render `<FirstRunTour />` (the dashboard-only mount; the page stays a Server Component rendering the client island). **STOP-A gate**: hard-load `/app` → tour auto-runs step 1; Next/Back walk 1→5; ×/Esc/End dismiss → dashboard interactive; soft-nav away+back does NOT re-open; reload re-runs; build; typecheck/lint; anon `/app` → 307.

## Batch B — Anchors + spotlight tracking
- [ ] **T006** Add `data-tour="palette"` to the ⌘K trigger (`app-topbar.tsx` or `command-palette-trigger.tsx`) and `data-tour="problem-card"` to the **first** card's wrapping `Link` (index 0) in `dashboard/problem-grid.tsx` — the shared `ProblemCardFull` leaf untouched.
- [ ] **T007** Add `data-tour` anchors to the **Saved** + **Alerts** items in `app/sidebar-nav.tsx` (an optional `tourKey` on the `NAV` array entries → `data-tour` on the rendered `Link`).
- [ ] **T008** Wire target resolution + reposition in `first-run-tour.tsx`: `document.querySelector('[data-tour="…"]')` → `getBoundingClientRect`; recompute the spotlight + bubble position on `resize`/`scroll`; missing target → center the bubble (no ring), never block. **Gate**: each step spotlights its real element (palette → card → Saved → Alerts → centered closing); resize keeps them aligned; empty-target degrades to centered.

## Batch C — A11y + §8 + gates + preview
- [ ] **T009** A11y in `first-run-tour.tsx`: focus moves into the bubble on open, Tab trapped, Esc dismisses, focus returns on close (the shared focus-trap pattern); `aria-live="polite"` announces step changes; Enter/Space operate Back/Next; reduced-motion → opacity-only / 0ms. Light/dark + responsive (mobile bubble placement).
- [ ] **T010** `CLAUDE.md` §8 note — the first-run tour: ephemeral session-scoped flag (the dashboard-only evolution of the Tier-4 ephemeral convention), hand-rolled spotlight (no dep, the 4.8 rule), the in-app data-attribute anchors, A1/A2/A4, **no `tour_completed` column added** (5.5/TF-028). Doc-only.
- [ ] **T011** Invariant sweep: no-write/no-storage grep (no `use server`/`localStorage`/`sessionStorage`/`db.insert|update|delete`/`getDb` in tour code); empty-diff on shared/public leaves; no schema/seed/migration; no new dep (lockfile unchanged); no new `packages/db` helper. Gates 4/4 (typecheck · lint · build · the grep).
- [ ] **T012** Push → preview. **Slice-close report**: gates, invariants, diff scope (the island + the 4 in-app anchor/mount diffs), preview URL + the DoD checklist (auto-run → 5-step walk → skip → soft-nav-no-reopen / hard-reload-reruns → keyboard/SR → light/dark/mobile/reduced-motion). Flag: after merge → tag **v0.4.0** (the Tier-4 capstone).

## Slice-integrity manifest
NEW (in-app): `tour/first-run-tour.tsx`, `tour/tour-steps.ts`. EDIT (in-app): `app/page.tsx`, `app-topbar.tsx` *(or `command-palette-trigger.tsx`)*, `dashboard/problem-grid.tsx`, `app/sidebar-nav.tsx`, `CLAUDE.md` §8. UNCHANGED: Tier-3 auth+middleware; 4.1 schema/seed (no `tour_completed`); the 4.3–4.9 screen logic; `packages/db` (no new helper); shared/public leaves (incl. `@bristle/ui ProblemCardFull`); public routes. **No schema/seed/migration; no DB write; no localStorage/sessionStorage; no new dep.**

## Risks & follow-ups
**TF-028** (Tier-5.5): the ephemeral session flag → a real per-user `tour_completed` (a NEW column + migration this slice does not add) through the seam — "persists across sessions" made real; now covering 4.5/4.6/4.9 + the tour. **Bubble positioning (A2)** is the one genuinely-uncertain hand-roll bit (getBoundingClientRect + reposition); if fragile mid-build, escalate to a dep decision (the cmdk escape hatch). **A4** the 5-step mapping is a copy/anchor confirm (design depicts only step 2). Edit/replay-from-settings out of scope. After this slice → Tier-4 complete + the capstone → **v0.4.0** tag.
