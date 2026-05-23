# Quickstart / Verification: Slice 007

How to build and verify once implemented. (No code yet — the gate recipe.)

## Pre-flight (already done)

- PR #5 (slice 006) merged to `main` on 2026-05-23 17:54Z via merge commit `b03be6e`.
- `007-pricing-recalibration` rebased onto `origin/main`; branch is 1 commit ahead (the spec commit `d930364`).

## Local

```bash
pnpm install                                          # no new dep this slice
pnpm typecheck && pnpm lint
pnpm --filter web build && pnpm --filter web start    # /, /pricing, /faq all render
```

No DB env required. Both pages are static (slice 006 confirmed `○ Static` markers).

## Acceptance checks (map to SC-001 … SC-014)

### File-content checks (T001 / T002 / T003 commits)
- **SC-001** — `apps/web/src/components/pricing/tier-data.ts`: per-tier diff shows `monthlyPriceUsd: 19` (Starter), `49` (Pro), `149` (Team). Every other field preserved verbatim. Verifiable via `git diff origin/main -- apps/web/src/components/pricing/tier-data.ts`.
- **SC-002** — `apps/web/src/components/landing/pricing-teaser.tsx`: rows show `price: "$19"` / `"$49"` / `"$149"`. Per-row diff confirms description strings + TIERS structure preserved. Verifiable via `git diff origin/main -- apps/web/src/components/landing/pricing-teaser.tsx`.
- **SC-003** — `apps/web/src/components/faq/faq-data.ts` faq-q-8 answer: `grep -n "\$19 per month" apps/web/src/components/faq/faq-data.ts` returns one hit; `grep -n "\$29 per month" apps/web/src/components/faq/faq-data.ts` returns zero hits. FR-012a header preserved verbatim (verify via diff against `origin/main`).

### Scope discipline (T004 gate)
- **SC-004** — `git diff --stat origin/main..HEAD` excluding the `specs/007-pricing-recalibration/` directory shows **exactly three** changed files: `apps/web/src/components/pricing/tier-data.ts`, `apps/web/src/components/landing/pricing-teaser.tsx`, `apps/web/src/components/faq/faq-data.ts`. No other file under `apps/web/src/` or `packages/` is changed.
- **SC-005** — `git diff --stat origin/main..HEAD -- design/` returns empty.

### Build + budget (T004 gate)
- **SC-006** — `pnpm typecheck && pnpm lint && pnpm --filter web build` each exit 0.
- **SC-007** — `next build` First-Load JS for `/`, `/pricing`, `/faq` each remains under 180 KB gz; each is identical (within rounding noise) to the slice-006 baseline (107 / 108 / 116 KB). Zero JS delta expected — values-only edit, no new module.
- **SC-008** — Lighthouse on local prod build for `/`, `/pricing`, `/faq`: Performance / Accessibility / Best-Practices each ≥ 90. SEO 100 on local-prod (preview SEO 60 due to Vercel `x-robots-tag: noindex` header — same artifact as slice 005 / 006, not a regression).

### Visual checks (T004 + T005)
- **SC-009** — `/pricing` Monthly state shows `$19` / `$49` / `$149` across the three tier cards. Toggle to Annual: shows `$13` / `$34` / `$104` with "billed annually" captions.
- **SC-010** — `/` dark-band pricing teaser renders `$19` / `$49` / `$149`.
- **SC-011** — `/faq` expanded faq-q-8 answer mentions `$19`, not `$29`.

### Greps (T004 gate)
- **SC-013** — `grep -nE '"[^"]*![^"]*"|>[^<]*![^<]*<'` on the three modified files → zero hits. `grep -nE '🚀|🎉|✨|👍|🔥'` → zero hits. `grep -niE 'amazing|awesome'` → zero hits.
- **SC-014** — `grep -nE "#[0-9A-Fa-f]{3,8}"` on the three modified files → zero NEW hits (lines that are unchanged are exempt from this check). `grep -nE "font-family|font-name"` → zero NEW hits.

### Preview parity (T005 gate)
- **SC-012** — Push branch; Vercel preview rebuilds. Confirm `/`, `/pricing` (both billing modes), and `/faq` (expanded q-8) render the recalibrated prices identically to local. No client-side errors in the browser console.

## Production

- Vercel env already set. Push → preview at the Vercel-derived URL pattern `https://bristle-git-007-pricing-recalibration-cornel-okoths-projects.vercel.app` (exact URL surfaced via `gh api /repos/cornel-stack/bristle/commits/<sha>/check-runs` after the build completes).
- No DB seed step (no DB reads).
- No `v0.2.0` tag from this slice. Per project release-tagging discipline, `v0.X.0` ships at tier completion — Tier 2 (slices 2.1–2.7) ships `v0.2.0` only after all seven slices land. Slice 007 is a Tier-2 revision; the wait continues.

## Notes

- "Annual saves 30%" hero subhead remains accurate because the multiplier (0.7 = exactly 30% off) is the source of the claim, not the dollar values. No copy change to that line.
- Compare table carries no dollar values (per `COMPARE_ROWS` shape — category counts, alert types, seat counts, etc.); unchanged and remains accurate.
- Enterprise card has no published price ("Contact sales →"); unchanged.
- OG image (slice-005 raster) is the wordmark + tagline only; contains no prices; unchanged.
- "Most popular" tag on Pro stays — the recalibration does not change the recommended tier.
- FR-012a policy-claims header in `faq-data.ts` preserved verbatim (its existing flag on faq-q-8 stands; the answer's `$19` update doesn't change the policy nature of the claim — the "no free tier" stance is what's flagged, not the entry price).
