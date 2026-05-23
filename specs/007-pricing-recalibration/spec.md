# Feature Specification: Pricing Recalibration

**Feature Branch**: `007-pricing-recalibration`

**Created**: 2026-05-23

**Status**: Draft

**Input**: User description: "Slice 007 — values-only recalibration of the three published tier prices from the v1 design contract ($29 / $79 / $199) to indie-founder anchors ($19 / $49 / $149) across the three shipped files that carry the old values: the Pricing-page tier data (slice 006), the landing's dark-band pricing teaser (slice 005), and the FAQ answer that names the entry price (slice 006). No copy edits, no layout edits, no token edits, no PDF re-render, no Stripe wiring."

## Overview

This is a small post-2.2 revision slice — not enumerated in `docs/Bristle-Build-Plan.pdf` — that retunes the published pricing of the three customer-facing tiers to better match Bristle's stated audience (solo indie founders and small two-to-four-person teams per CLAUDE.md §2). Slice 006 shipped the Pricing page and FAQ with the original v1 design-PDF figures ($29 Starter / $79 Pro / $199 Team); slice 005 shipped the landing's dark-band pricing teaser with the same figures. After a pre-merge audit against the landing's "Made for indie founders, by indie founders." positioning, all three tiers are pulled down to $19 / $49 / $149 monthly. The change touches exactly three TypeScript content files; every other slice-005 / slice-006 file (components, tokens, OG image, FAQ scroll-spy, accordion, compare table, Enterprise card, hero copy, navigation, footer) is preserved verbatim. The Annual prices shown when the billing toggle flips derive automatically from the existing `Math.round(monthlyPriceUsd * 0.7)` rule in `TierCard`, so the Annual figures rebase implicitly to $13 / $34 / $104 — no code change in the toggle, no change in caption text, no change in the "-30%" badge. This slice deliberately introduces a documented PDF↔code drift on pricing values only (the design PDF retains $29/$79/$199 as the historical v1 artifact; the codebase becomes the source of truth for prices going forward — every other PDF-encoded surface remains read-only contract). The value is a credibly priced public surface for the audience the product targets, shipped without disturbing the launch-quality chrome the previous two slices built.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor sees indie-founder-anchored prices everywhere they appear (Priority: P1)

A visitor browsing the public surface sees the recalibrated tier prices in every shipped location that displays them: the landing page's dark-band pricing teaser at the bottom of `/`, the three tier cards on `/pricing` (both Monthly and Annual states), and the answer text for "Is there a free tier?" in the FAQ. The prices are consistent across all three locations and across both billing modes.

**Why this priority**: This is the slice. A visitor who sees the old $29/$79/$199 anywhere (because the recalibration only landed in some places) is shown contradictory pricing — the worst outcome of a partial price change. The three locations are the only places monthly tier prices appear in user-visible copy; updating them in lockstep is the slice's entire point.

**Independent Test**: View `/`, `/pricing` (Monthly state), `/pricing` (Annual state), and `/faq` with `faq-q-8` expanded; confirm the prices shown are $19 / $49 / $149 Monthly, $13 / $34 / $104 Annual with "billed annually" captions, and that the FAQ answer references "$19".

**Acceptance Scenarios**:

1. **Given** `/` (landing) on a production build, **When** the visitor scrolls to the dark-band pricing teaser, **Then** the three rows display $19 / $49 / $149 (with the existing per-tier descriptions and the teaser headline preserved verbatim).
2. **Given** `/pricing` on a production build in the default Monthly state, **When** the three tier cards render, **Then** they show $19/month, $49/month, and $199 → $149/month respectively, all with the existing eyebrows, taglines, CTAs, "Most popular" tag on Pro, and feature bullet lists preserved verbatim.
3. **Given** `/pricing` after the visitor activates the Annual billing toggle, **When** the three tier prices update, **Then** they show $13/month, $34/month, and $104/month, each with the "billed annually" caption beneath (per the existing `Math.round(monthlyPriceUsd * 0.7)` rule).
4. **Given** `/faq`, **When** the visitor expands the accordion item "Is there a free tier?" (`faq-q-8`), **Then** the answer text mentions "$19 per month is the entry plan." and does not contain "$29".
5. **Given** any of the three modified locations, **When** the rest of the surrounding copy / layout / chrome is compared against the slice-005 / slice-006 baseline, **Then** nothing else has changed (only the price values).

---

### User Story 2 - Visual, perf, a11y, SEO, and voice floors are preserved (Priority: P1)

The recalibration ships with zero degradation to the floors slice 005 and slice 006 met: each page reflows cleanly at every target width, JS payloads remain unchanged (no new dependencies, no new code paths), Lighthouse scores hold, the voice rules grep clean across the three modified files, and no new hex literals or font-family strings sneak in via the edits.

**Why this priority**: A values-only revision should produce **zero observable delta** outside of the three price strings. Any change to bundle size, Lighthouse score, voice posture, or token discipline would mean the edit overreached — that's a content-only contract being violated and worth catching at the gate.

**Independent Test**: Run the audit tools against the three modified pages on a production build; compare the build's First Load JS to the pre-recalibration baseline; grep the three modified files for hex/font-family/voice violations.

**Acceptance Scenarios**:

1. **Given** a production build of `/`, `/pricing`, and `/faq`, **When** the First Load JS is measured, **Then** each route is identical (within rounding noise) to the slice-006 baseline (107 kB / 108 kB / 116 kB), and each remains under the 180 KB budget.
2. **Given** the same production build, **When** Lighthouse is run on `/`, `/pricing`, and `/faq`, **Then** Performance, Accessibility, and Best Practices each score at least 90 on each route (SEO score 100 on local-prod; SEO 60 on the preview hostname is the same `x-robots-tag: noindex` artifact slice 005 and slice 006 inherited and is not a regression).
3. **Given** the three modified files (`tier-data.ts`, `pricing-teaser.tsx`, `faq-data.ts`), **When** grep is run, **Then** there are no new hex color literals, no new font-family strings, no exclamation marks, no emoji, and no "amazing"/"awesome" register beyond what the slice-005 / slice-006 baseline already had (and was clean on).
4. **Given** widths of 320, 375, 768, 1024, 1280, and 1440, **When** each modified page is viewed, **Then** the reflow is identical to the slice-005 / slice-006 baseline (different price strings cannot change layout — the price columns size from the same character-width budget).

---

### Edge Cases

- **Annual figures from the math** are Starter `$19 × 0.7 = $13.30 → $13`, Pro `$49 × 0.7 = $34.30 → $34`, Team `$149 × 0.7 = $104.30 → $104` (using `Math.round`, half-up). All three round cleanly without ambiguity; no edge case where two tiers could round to the same dollar.
- **Annual savings narrative** — the hero subhead says "Annual saves 30%." The math saves exactly 30% in all three cases (since the multiplier is 0.7), so the narrative remains accurate at the new prices.
- **Compare table** carries no dollar values (per `COMPARE_ROWS` shape — it lists category counts, alert types, seat counts, etc.); it is unchanged and remains accurate.
- **Enterprise card** has no published price (says "Contact sales →"); unchanged and remains accurate.
- **OG image** (slice-005 raster) is the wordmark + tagline only — contains no prices — and is unchanged.
- **Pricing toggle "-30%" badge** describes the discount percentage, not a dollar figure; unchanged and remains accurate.
- **"Most popular" tag on Pro** is unchanged; the recalibration does not change which tier is recommended.
- **FAQ other 11 answers** contain no dollar values that would conflict (`faq-q-5` mentions a refund window of 14 days but no tier price; `faq-q-3`/`faq-q-7`/`faq-q-12` reference tier names by feature, not price). Only `faq-q-8` requires the edit.
- **CompareCell "Team seats" row** says `5 included` — a count, not a price; unchanged.
- **Documented PDF drift** — `design/Public_pages.pdf` page 3 will continue to render $29 / $79 / $199 (the v1 historical artifact). The visual-diff gate at the next pricing-touching slice gets a 4px-tolerance carve-out for the three Monthly price strings and the three Annual derived strings. See Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

**Price-value changes (US1)**

- **FR-001**: `apps/web/src/components/pricing/tier-data.ts` MUST be updated so that `TIERS[0].monthlyPriceUsd` is `19` (was `29`), `TIERS[1].monthlyPriceUsd` is `49` (was `79`), and `TIERS[2].monthlyPriceUsd` is `149` (was `199`). Every other field on every tier — `name`, `eyebrow`, `tagline`, `ctaLabel`, `ctaHref`, `ctaVariant`, `isMostPopular`, and the `features` arrays — MUST be preserved verbatim. Type-level shape (interfaces `Tier`, `TierName`, `TierCtaVariant`) MUST be preserved verbatim.
- **FR-002**: `apps/web/src/components/landing/pricing-teaser.tsx` MUST be updated so the three tier rows display `$19` for Starter, `$49` for Pro, and `$149` for Team (replacing `$29` / `$79` / `$199`). Every other field on every row — per-tier description text and the surrounding TIERS structure — MUST be preserved verbatim. The teaser headline ("One price for serious research. One for casual.") MUST be preserved verbatim.
- **FR-003**: `apps/web/src/components/faq/faq-data.ts` `faq-q-8` answer text MUST be updated so it contains the string `$19` and does not contain the string `$29`. The rest of the answer — its 7-day Pro trial reference, voice register, 1-3 sentence length, and the surrounding `id` / `section` / `question` fields — MUST be preserved verbatim. The FR-012a policy-claims header at the top of the file MUST be preserved verbatim (its existing `faq-q-8` flag for the "no free tier" stance still applies; the answer's $19 update doesn't change the policy nature of the claim).

**Scope discipline (US1 / US2)**

- **FR-004**: No file under `apps/web/src/` other than the three named above MUST be modified. No file under `packages/` MUST be modified. `git diff --stat` against the slice-006 baseline MUST show **exactly three changed files**: `tier-data.ts`, `pricing-teaser.tsx`, `faq-data.ts`.
- **FR-005**: No file under `design/` MUST be modified (CLAUDE.md §9.1). The PDF↔code pricing drift introduced by this slice is documented (see Assumptions); the design PDFs themselves are not touched by the implementor.
- **FR-006**: No new hex color literal and no new font-family string MUST appear in any of the three modified files (consistent with FR-018 of slice 006). The three edits are values-only — they touch only the three numeric / dollar-string fields named above.

**Build, budget, and voice (US2)**

- **FR-007**: Type-check, lint, and a production build of the web app MUST all succeed with no errors.
- **FR-008**: First Load JS for each of `/`, `/pricing`, and `/faq` MUST remain identical (within rounding noise) to the slice-006 baseline (107 kB / 108 kB / 116 kB) and MUST remain under 180 KB gzipped (per CLAUDE.md §5 and slice-006 FR-014).
- **FR-009**: A production-build audit of `/`, `/pricing`, and `/faq` MUST score at least 90 for Performance, Accessibility, and Best Practices on each route. SEO score is 100 on local-prod; the Vercel preview hostname's `x-robots-tag: noindex` header reduces preview SEO to 60 — this is a deploy-host artifact already documented for slice 005 and slice 006 and is not a regression.
- **FR-010**: No exclamation marks, no emoji, and no "amazing"/"awesome" register MUST appear in any line modified by this slice (consistent with FR-019 of slice 006).

**Derived Annual prices (US1)**

- **FR-011**: When the billing toggle on `/pricing` flips to Annual, the three displayed prices MUST be `Starter $13/month`, `Pro $34/month`, `Team $104/month` — derived automatically from the existing `Math.round(monthlyPriceUsd * 0.7)` rule in `TierCard` (slice 006). No code change in `TierCard`, the toggle, the billing section, or any other component is required; the values change because the inputs change. The "billed annually" caption MUST continue to render only in the Annual state.

### Key Entities *(include if feature involves data)*

No schema change. No new query helpers. No new content data files. The `Tier` and `FaqItem` shapes from slice 006 are unchanged. The three updated values are:

- `Tier.monthlyPriceUsd` × 3 (one per tier instance)
- `pricing-teaser.tsx`'s in-file price strings × 3 (one per row)
- `FAQ_ITEMS.find(item => item.id === "faq-q-8").answer` × 1 (one substring substitution `$29` → `$19`)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `apps/web/src/components/pricing/tier-data.ts` contains `monthlyPriceUsd: 19` for Starter, `49` for Pro, `149` for Team. No other field on any tier has changed — verified by a per-tier diff against the slice-006 file. *(FR-001)*
- **SC-002**: `apps/web/src/components/landing/pricing-teaser.tsx` contains `price: "$19"` for Starter, `"$49"` for Pro, `"$149"` for Team. No other field has changed. *(FR-002)*
- **SC-003**: `apps/web/src/components/faq/faq-data.ts` `faq-q-8` answer string contains `$19` and does not contain `$29` — verified by grep. *(FR-003)*
- **SC-004**: `git diff --stat` against the slice-006 baseline shows **exactly three** changed files: the three named above. No other file under `apps/web/src/` or `packages/` is changed. *(FR-004)*
- **SC-005**: `git diff --stat` shows no change under `design/`. *(FR-005)*
- **SC-006**: `pnpm typecheck`, `pnpm lint`, and `pnpm --filter web build` each exit 0. *(FR-007)*
- **SC-007**: First Load JS for `/`, `/pricing`, and `/faq` each remains under 180 KB gzipped, and each is identical (within rounding noise) to the slice-006 baseline (107 / 108 / 116 KB). *(FR-008)*
- **SC-008**: Lighthouse Performance, Accessibility, and Best Practices each remain at least 90 on the local production build for `/`, `/pricing`, and `/faq`. SEO 100 on local-prod; SEO 60 on preview (Vercel `x-robots-tag` artifact, not a regression). *(FR-009)*
- **SC-009**: A visual check on `/pricing` in the Monthly state shows `$19` / `$49` / `$149` across the three tier cards; flipping the toggle to Annual shows `$13` / `$34` / `$104` with "billed annually" captions. *(FR-001, FR-011)*
- **SC-010**: A visual check on `/` shows the dark-band pricing teaser rendering `$19` / `$49` / `$149`. *(FR-002)*
- **SC-011**: A visual check on `/faq` shows the expanded `faq-q-8` answer referencing `$19`, not `$29`. *(FR-003)*
- **SC-012**: The Vercel preview URL renders all three updated views identically to local and produces no browser-console errors. *(FR-007 + FR-009 implied at preview)*
- **SC-013**: Grep across all modified lines: no exclamation marks, no emoji, no "amazing"/"awesome" register. *(FR-010)*
- **SC-014**: Grep across all modified files: no new hex color literals, no new font-family strings (values-only edits to existing fields). *(FR-006)*

## Assumptions

- **Slice numbering**: this is slice **007**, a non-tier-mapped "patch" slice that the build plan (`docs/Bristle-Build-Plan.pdf`) does not enumerate. It sits between slice 006 (Tier 2.2 — Pricing + FAQ, just landed) and slice 008, which will be the next tier-mapped slice (slice 2.3 About + Contact + Legal). The build plan organizes the major release boundaries; the project accepts that small revision slices may interleave between enumerated slices without renumbering the canonical Tier 2.X sequence. (Open: see Clarifications (c).)
- **Founder confirmation**: $19 / $49 / $149 monthly are the **confirmed values**, not proposed. The founder reviewed slice 2.2's $29 / $79 / $199 and explicitly directed Starter to $19, Pro to $49, and Team to $149 to better fit the "indie founders, by indie founders" positioning. These three numbers are committed; the FR-012a policy-claims header's flag on `faq-q-8` (the "no free tier" stance) is also implicitly re-confirmed under the same review. (Open: see Clarifications (a).)
- **Documented PDF↔code drift (pricing values only)**: `design/Public_pages.pdf` page 3 retains the v1 figures $29 / $79 / $199 as a historical artifact and is **not re-rendered** by this slice. From this slice onward, `apps/web/src/components/pricing/tier-data.ts` is the source of truth for tier prices specifically. Every other PDF-encoded surface (typography, spacing, color tokens, headings, layout positions, hero copy, FAQ structure, source-strip wordmarks, etc.) remains read-only contract per CLAUDE.md §9.1. The visual-diff gate at the next pricing-touching slice gets a 4px-tolerance carve-out for the three Monthly price strings and the three Annual derived strings. (Open: see Clarifications (b).)
- **Implementation batching**: this is a values-only revision touching three files; the standard 4-batch / 4-STOP shape used for slices 005 and 006 is overkill. Recommend a **single batch of three commits (one per file) plus a single verification gate** (typecheck/lint/build + greps + visual check at local-prod + preview parity). The plan step pins this. (Open: see Clarifications (d).)
- **No new query helpers, no schema change, no new dependency, no new file**. Every existing slice-005 / slice-006 file outside the three named in FR-001–FR-003 is preserved verbatim. The Radix Accordion dep, the lucide icons, and the `@bristle/shared` SITE_URL constant introduced in earlier slices remain untouched.
- **Annual savings narrative ("Annual saves 30%")** remains accurate at the new prices — the `× 0.7` multiplier is the source of the 30% claim, not the dollar values, so it survives any monthly recalibration that keeps the same multiplier. No copy change to the pricing hero subhead is needed.
- **"Most popular" tag on Pro** stays — the recalibration does not change the recommended tier.
- **The compare table** carries no dollar values (per `COMPARE_ROWS` in slice 006); it is unaffected by this slice. The Enterprise card has no published price; unaffected.
- **Branch stacking**: `007-pricing-recalibration` was cut from the tip of `006-pricing-and-faq` (slice 006's PR has not yet merged to main). When that PR merges, this branch needs to be rebased onto `origin/main` to drop the inherited 006 commits — same pattern as 006 was stacked on 005 in the previous round.
- **No `v0.X.Y` tag** is created by this slice. Per the project memory's release-tagging discipline, `v0.2.0` ships only when all of Tier 2 (slices 2.1–2.7) is on `main`; slice 007 is a Tier-2 revision and continues the wait.

## Clarifications

All four open questions surfaced before `/speckit.plan` were resolved by the user's slice-007 brief on 2026-05-23 and folded into the requirements above:

- **(a) Founder confirmation on the recalibrated prices** — **resolved as committed**. $19 / $49 / $149 monthly are the directed values, not proposed. (FR-001, FR-002, FR-003; SC-001, SC-002, SC-003, SC-009, SC-010, SC-011.)
- **(b) PDF↔code drift policy** — **resolved as expected drift on prices only**. `tier-data.ts` becomes the source of truth for tier prices; every other PDF-encoded surface remains read-only contract per §9.1. The design PDF retains the v1 figures as a historical artifact; the next pricing-touching slice's visual-diff gate carves out the three Monthly + three Annual price strings. (Assumptions §"Documented PDF↔code drift".)
- **(c) Non-tier-mapped patch slices interleaved with the build plan's enumerated slices** — **resolved as accepted**. Slice 007 is the precedent: it sits between tier-mapped 006 and 008 without renumbering the canonical Tier 2.X sequence. The build plan continues to govern release boundaries; revision slices may interleave when scope/cost is small and the change is contained. (Assumptions §"Slice numbering".)
- **(d) Implementation batching — single batch instead of the standard four** — **resolved as a single batch of three commits + one verification gate**. The plan step pins this; the tasks step generates three implementation tasks (T001 tier-data, T002 pricing-teaser, T003 faq-q-8) plus a single T004 local-gate + T005 preview-parity gate. (Assumptions §"Implementation batching".)

### Planning readiness

All clarifications resolved; no outstanding decisions. The spec is ready for `/speckit.plan`. The plan step will pin the single-batch implementation shape and may carry a short risk note about the PDF↔code drift (so any future contributor reading the plan sees the expected divergence).
