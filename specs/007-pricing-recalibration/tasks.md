# Tasks: Pricing Recalibration

**Input**: `spec.md` + `plan.md` + `research.md` + `quickstart.md` in `specs/007-pricing-recalibration/`
**Branch**: `007-pricing-recalibration`
**Tests**: none added this slice (no Vitest/Playwright wired yet; same as slices 005 / 006). Verification is the gate phase — typecheck/lint/build, First-Load JS budget unchanged, grep `$19` present + `$29` absent in `faq-data.ts`, `git diff --stat` shows exactly three changed files, hex/font-family/copy-`!`/emoji/voice greps on the three modified files, manual visual at `/` (dark-band teaser), `/pricing` (both billing modes), `/faq` (expanded `faq-q-8`), and the **preview parity check** at the Vercel-derived URL.

## Conventions

- **One commit per task.** Each commit-producing task lists its exact commit message.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling). T001/T002/T003 are file-independent and marked [P]; sequencing them is a per-commit-discipline choice, not a hard requirement.
- **[Story]** = US1 (visitor sees the recalibrated prices everywhere) or US2 (perf / a11y / SEO / voice floors preserved).
- Every task has a **Verify** line — the objective check before committing (for edit tasks) or before STOPping (for gates).
- **Batching**: ONE batch / ONE STOP at the end — slice 007 is a values-only revision; the 4-batch shape used in slices 005 / 006 is overkill here (plan §"Order of operations", spec clarification (d)).
- **Execution prereqs (already done)**: PR #5 (slice 006) merged to `main` on 2026-05-23 17:54Z via merge commit `b03be6e`; `007-pricing-recalibration` rebased onto `origin/main`; branch is 2 commits ahead (spec `d930364` + plan `b793e1d`); working tree clean.
- **Additive-only with §9 carve-out**: this slice extends the slice-006 FR-016 precedent (values-only edits to shipped slice files are acceptable) to three value-level edits. No structural change, no token edit, no new dependency, no new file, no design-PDF edit. Other than the three named files, **nothing** under `apps/web/src/` or `packages/` is modified (FR-004 / SC-004).

---

## Batch A — values-only edits + gates  ▸ STOP 1 (and only STOP)

### Phase 3: User Story 1 (visitor sees recalibrated prices everywhere)

### T001 · [P] [US1] Recalibrate Pricing tier prices in `tier-data.ts`
Edit `apps/web/src/components/pricing/tier-data.ts`: change `TIERS[0].monthlyPriceUsd` from `29` to `19` (Starter), `TIERS[1].monthlyPriceUsd` from `79` to `49` (Pro), and `TIERS[2].monthlyPriceUsd` from `199` to `149` (Team). **Every other field on every tier — `name`, `eyebrow`, `tagline`, `ctaLabel`, `ctaHref`, `ctaVariant`, `isMostPopular`, and the `features` arrays — MUST be preserved verbatim.** Type definitions (`Tier`, `TierName`, `TierCtaVariant`) MUST be preserved verbatim.
- **Files**: `apps/web/src/components/pricing/tier-data.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `git diff origin/main -- apps/web/src/components/pricing/tier-data.ts` shows exactly three changed lines (the three `monthlyPriceUsd` values) plus any whitespace/format-stable surrounding context; no other field changed.
- **Commit**: `feat(web): recalibrate tier prices to $19/$49/$149 (slice 007)`

### T002 · [P] [US1] Recalibrate landing teaser prices in `pricing-teaser.tsx`
Edit `apps/web/src/components/landing/pricing-teaser.tsx`: change the three row price strings from `"$29"` to `"$19"` (Starter), `"$79"` to `"$49"` (Pro), and `"$199"` to `"$149"` (Team). **Every other field on every row — per-tier description text and the surrounding TIERS structure — MUST be preserved verbatim.** The teaser headline ("One price for serious research. One for casual.") MUST be preserved verbatim.
- **Files**: `apps/web/src/components/landing/pricing-teaser.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `git diff origin/main -- apps/web/src/components/landing/pricing-teaser.tsx` shows exactly three changed lines (the three price strings); no other field changed; headline + per-tier descriptions intact.
- **Commit**: `feat(web): recalibrate landing teaser prices to $19/$49/$149 (slice 007)`

### T003 · [P] [US1] Recalibrate `faq-q-8` answer in `faq-data.ts`
Edit `apps/web/src/components/faq/faq-data.ts` — `faq-q-8` answer only. Replace the substring `$29` with `$19`. **Keep the rest of the answer (7-day Pro trial reference, voice register, 1-3 sentence length, opening "Not currently." line) verbatim.** All other 11 answers MUST be preserved verbatim. The FR-012a policy-claims header comment block at the top of the file MUST be preserved verbatim (its existing flag on `faq-q-8` stands; the answer's `$19` update doesn't change the policy nature of the claim — the "no free tier" stance is what's flagged, not the entry price).
- **Files**: `apps/web/src/components/faq/faq-data.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `grep -n "\$19 per month" apps/web/src/components/faq/faq-data.ts` returns exactly one hit (in the `faq-q-8` answer); `grep -n "\$29" apps/web/src/components/faq/faq-data.ts` returns zero hits; `git diff origin/main -- apps/web/src/components/faq/faq-data.ts` shows exactly one changed line (the `faq-q-8` answer string); FR-012a header block preserved (verify by diff context around lines 1-25).
- **Commit**: `feat(web): recalibrate faq-q-8 entry-plan price to $19 (slice 007)`

### Phase 4: User Story 2 (perf / a11y / SEO / voice floors preserved + verification)

### T004 · [US2] VERIFY — local gate
Run the local loop and audits against the post-edit state.
- **Depends on**: T001, T002, T003
- **Verify**:
  - **Build**: `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. *(SC-006)*
  - **Scope discipline (SC-004)**: `git diff --stat origin/main..HEAD -- apps/web packages 2>&1` shows **exactly three** changed files (`tier-data.ts`, `pricing-teaser.tsx`, `faq-data.ts`); no other file under `apps/web/src/` or `packages/` is changed.
  - **No PDF edit (SC-005)**: `git diff --stat origin/main..HEAD -- design/` returns empty.
  - **Build budget (SC-007)**: `next build` output for `/`, `/pricing`, `/faq` First-Load JS each remains under 180 KB gz and is identical (within rounding noise) to the slice-006 baseline (107 / 108 / 116 KB). Zero JS delta expected.
  - **Greps (SC-013 + SC-014)** on `apps/web/src/components/pricing/tier-data.ts`, `apps/web/src/components/landing/pricing-teaser.tsx`, `apps/web/src/components/faq/faq-data.ts`:
    - `grep -nE "#[0-9A-Fa-f]{3,8}"` → zero new hits (lines unchanged exempt).
    - `grep -nE "font-family|font-name"` → zero new hits.
    - `grep -nE '"[^"]*![^"]*"|>[^<]*![^<]*<'` → zero hits (copy-context exclamation).
    - `grep -nE '🚀|🎉|✨|👍|🔥|👏|🎊|💯|⚡'` → zero hits (emoji).
    - `grep -niE 'amazing|awesome'` → zero hits.
  - **Faq grep (SC-003)**: `grep -n "\$19 per month" apps/web/src/components/faq/faq-data.ts` → one hit; `grep -n "\$29" apps/web/src/components/faq/faq-data.ts` → zero hits.
  - **Visual at `/pricing` (SC-009)**: Monthly state shows `$19/month`, `$49/month`, `$149/month` across the three tier cards. Activate Annual toggle → all three update to `$13/month`, `$34/month`, `$104/month` with a `billed annually` caption beneath each price.
  - **Visual at `/` (SC-010)**: dark-band pricing teaser renders `$19`, `$49`, `$149` in the three rows. Per-tier descriptions ("Five categories" etc.) and the headline preserved verbatim.
  - **Visual at `/faq` (SC-011)**: expanding `faq-q-8` ("Is there a free tier?") shows the answer mentioning `$19`, not `$29`. Other 11 answers unchanged.
  - **Lighthouse (SC-008)**: local prod build for `/`, `/pricing`, `/faq` — Performance / Accessibility / Best-Practices each ≥ 90; SEO 100 on local-prod. *(Visual + Lighthouse defer to human at a browser; same constraint as slice 005 T018 / slice 006 T021 — CLI agent verifies code-side proxies, browser-side checks rely on the reviewer.)*
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T005 · [US2] VERIFY — deploy preview parity (gate)
Push the branch; confirm the Vercel preview.
- **Depends on**: T004
- **Verify (SC-012)**: preview URL (Vercel-derived pattern: `https://bristle-git-007-pricing-recalibration-cornel-okoths-projects.vercel.app` — exact URL surfaced via `gh api /repos/cornel-stack/bristle/commits/<sha>/check-runs` after the build completes) renders `/`, `/pricing` (both billing modes), and `/faq` (expanded `faq-q-8`) identically to local: $19/$49/$149 Monthly, $13/$34/$104 Annual with captions, $19 in the FAQ answer. No client-side errors in the browser console.
- **Commit**: none (verification/deploy only).

**▸ STOP 1** — slice 007 complete: three values-only edits landed, gates green, preview parity confirmed.

---

## Dependencies & Execution Order

```
Batch A: (T001 ∥ T002 ∥ T003) → T004 → T005
```

Three independent edits, then a local gate, then a preview gate. T001/T002/T003 touch independent files with no shared types or imports between them — true [P]-parallel. Sequencing them is the recommended approach for per-commit-message clarity; an implementor could equally do all three edits then stage as three separate commits.

- **US1** = the three value edits (T001 / T002 / T003).
- **US2** = the two verification gates (T004 / T005).

### Sequencing concerns
1. **Branch already on top of clean main.** No rebase noise expected at push time.
2. **`pnpm install` is not required** — slice 007 adds no dependency. `pnpm-lock.yaml` MUST NOT change. If `pnpm install` is run accidentally and changes the lockfile, that's a scope-creep violation of FR-004 and the gate at T004 catches it (`git diff --stat` would show four files instead of three).
3. **Visual checks defer to the human reviewer** at T004 / T005 — the CLI agent can't drive a browser. Code-side proxies (build, greps, diff-stat) are the agent's coverage; visual + Lighthouse are the reviewer's.

## Implementation strategy (1 stop)
1. **Stop 1 (Batch A — only batch)**: three values-only edits commit-by-commit, then local gate, then preview parity. One STOP at the end. PR opens after STOP 1 passes.

## Task count
5 tasks — **3 commit-producing** (T001 / T002 / T003), **2 verification gates** (T004 / T005). Grouped into **1 batch / 1 stop**.

## Out of scope (no tasks)
Any change to `compare-data.ts`, the OG image, the pricing hero copy, the "-30%" badge, the "Most popular" tag, the tier feature lists, the Enterprise card, the dark-band pricing teaser headline, any token, any client component logic, any DB / `@bristle/db` query, any `next-themes` integration, any `/contact` route work, any `design/` file. The compare table carries no dollar values; unaffected. The Enterprise card has no published price; unaffected. The OG image carries no prices; unaffected.

**Tracked follow-up (NOT in slice 007)**: dedupe price strings between `pricing-teaser.tsx` and `tier-data.ts` so future price revisions become a one-line edit. See plan.md §"Risks, unknowns & tracked follow-ups" — defer to a future pricing-touching slice; would expand slice 007's scope from values-only to structural and re-introduce the §9 shipped-slice question.
