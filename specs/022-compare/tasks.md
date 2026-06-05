# Tasks: Compare — Slice 4.7

**Feature**: `specs/022-compare/` | **Branch**: `022-compare` | **Inputs**: spec.md · plan.md

> ## ⛔ DON'T-IMPLEMENT until green-lit. Fast cadence: self-run, one commit per task, gates green per task; report at close. **READ slice** — URL-param state, **no DB write**, no new `packages/db` helper (reuse `getProblemDetail` ≤4×).

## Execution model
4 batches, **~16 tasks**.

| Batch | Theme | Tasks |
|---|---|---|
| 0 | Route + compare adapter + grid skeleton | T001–T004 |
| A | Full grid (header + quantitative + scorecards + Read) | T005–T009 |
| B | Picker + remove + empty/1 states + Share | T010–T013 |
| C | Entry wiring (Saved + Library) + polish + a11y + §8 + gates + preview | T014–T017 |

### Count cross-check
New route 1 · `components/app/compare/**` ~8 + 1 Library island · `lib/compare-adapter.ts` 1 · **0** new `packages/db` helper (reuse `getProblemDetail`) · 0 deps/env · 0 schema/seed · client islands = picker/×/Share + Library compare-select.

## Standing constraints (every task)
**READ slice — no DB write** (grep-clean; the URL `?compare=` is the only state — no storage). compare_card is **qualitative-only**; every quantitative cell **derives from the relational tables** (real counts, no scale literals). Reuse `getProblemDetail` (≤4×) + the registry/tints + the `problem-detail-adapter` boundary-seam pattern. `getAppUser` = the gate (global data). **Empty-diff on shared/public leaves EXCEPT the two sanctioned 4.4/4.5 entry touches** (shown in the manifest). 5-source delta (Sources "X of 5"); TF-023 now-relative days; up-to-4 cap; picker/checkbox selection (no drag). **No schema/seed; a comparisons table would STOP.**

---

## Batch 0 — Route + adapter + skeleton
- [ ] **T001** Create `apps/web/src/lib/compare-adapter.ts` — `CompareColumnVM` + `adaptCompareColumn(detail: ProblemDetail): CompareColumnVM`: header (slug/title/category/momentum/sparkline); derived quantitative (mentions60d; sources distinct-badges `of 5`; wtp count·median|null; top persona·%; solutions count·direct/adjacent; days-since-first-seen); qualitative via `CompareCardSchema.safeParse(problem.compareCard)` (null on fail); `bestFit = verdict==="strongest"`.
- [ ] **T002** Create `apps/web/src/app/app/compare/page.tsx` — RSC: parse `?compare=` (≤4, dedup) → `Promise.all(slugs.map(getProblemDetail)).filter(Boolean)` → `adaptCompareColumn` → `<CompareView/>`; `getAppUser()` gate. No middleware/auth change.
- [ ] **T003** Create `apps/web/src/components/app/compare/compare-view.tsx` + `compare-grid.tsx` — skeleton rendering the columns (header titles + a couple rows) from the adapter to prove the pipeline.
- [ ] **STOP-0 gate**: anon `/app/compare` → 307; tsx probe of `adaptCompareColumn` over the 4 design slugs (derived rows match 47/38/29/31 etc.; scorecards; verdicts; Best-fit on stripe); typecheck/lint/build.

## Batch A — Full grid
- [ ] **T005** [P] `compare-column-header.tsx` — column card (category chip + title + momentum + sparkline + × remove + Best-fit badge).
- [ ] **T006** [P] `scorecard-cell.tsx` — value + tone chip (positive/caution/neutral/negative → token color).
- [ ] **T007** [P] `bristles-read-card.tsx` — verdict tone card (Strongest/Build-able/Watch/Skip) + prose.
- [ ] **T008** In `compare-grid.tsx`: the 6 derived quantitative rows (label + per-column cells, genuine-0 honest) + the 5 scorecard rows + the Bristle's Read row.
- [ ] **T009** Wire headers + rows into `compare-view`. **Gate**: the 4-slug deep link renders page-6 values; build.

## Batch B — Build + share
- [ ] **T010** [P] `compare-picker.tsx` (client) — "Add a problem" select (problems not in the set) → `?compare=` (router.replace); disabled at 4.
- [ ] **T011** × remove on the header → drops the slug from `?compare=` (client).
- [ ] **T012** [P] `compare-empty.tsx` — 0-selected empty state + picker; 1-selected "add at least one more" prompt; wire into `compare-view`.
- [ ] **T013** `compare-share.tsx` (client) — Share copies the current URL ("Link copied"); Save view / Export PDF visual-only. **Gate**: add/remove update the URL; 0/1 states; build.

## Batch C — Entry wiring + polish + §8 + gates + preview
- [ ] **T014** Entry wiring (sanctioned A2): Saved `saved-header.tsx` "New comparison" `<button>` → `<Link href="/app/compare">`; Library `?select=` (parse in `library-params.ts`) + a leading checkbox column in `results-table.tsx` via a new `library-compare-select.tsx` client island + a "Compare selected (N) →" bar in `library-view.tsx` → `/app/compare?compare=<≤4>`.
- [ ] **T015** A11y — grid semantics / labels, × + picker + Share + checkbox labels, focus rings; light/dark + responsive (horizontal grid scroll; mobile).
- [ ] **T016** `CLAUDE.md` §8 note — Compare is a READ slice (URL-param `?compare=`, no comparisons table → no write); the compare-adapter seam (validates `compare_card`); reuse of `getProblemDetail`; the two sanctioned entry touches; Share-copies-link. Doc-only.
- [ ] **T017** Gates 4/4; push → preview. **Slice-close report**: gates, invariants (no DB write grep, empty-diff except the 2 sanctioned touches, no schema/seed, no new packages/db helper), diff scope (incl. the exact Library/Saved diffs), `adaptCompareColumn` probe, preview URL + the page-6 checklist.

## Slice-integrity manifest
NEW: `app/app/compare/page.tsx`; `components/app/compare/**`; `lib/compare-adapter.ts`; `components/app/library/library-compare-select.tsx`. EDIT (sanctioned): `saved-header.tsx`; `results-table.tsx` + `library-view.tsx` + `library-params.ts`; `CLAUDE.md` §8. UNCHANGED: Tier-3 auth+middleware; 4.1 schema/seed; 4.2 shell/seam/registry; 4.3 detail; 4.6 alerts; **packages/db** (reuse getProblemDetail); shared/public leaves; public routes.

## Risks & follow-ups
Saved/named comparisons = a new table → STOP (out of scope; 5.5+). Library touch is the larger sanctioned diff (deferrable to picker-only if the founder prefers). Comp divergences (mine): Sources "X of 5", picker not drag, validated-demand tone chip vs ✓.
