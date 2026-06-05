# Implementation Plan: Compare — Slice 4.7

**Branch**: `022-compare` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT** until green-lit. Fast cadence: self-run all batches on green-light; report at close.

## Summary

Compare at `/app/compare` — sixth Tier-4 screen, **a READ slice** (the founder's reframe — there is no comparisons table; a comparison is a URL of slugs). A Server Component reads `?compare=slug1,…` (≤4), fetches each problem via the reused `getProblemDetail`, runs them through a **new compare adapter** (deriving the quantitative rows + validating `compare_card` against `CompareCardSchema`), and renders a side-by-side grid: column headers + 6 derived quantitative rows + 5 qualitative scorecards + Bristle's Read (Best-fit on the strongest). Add/remove mutate the URL (thin client controls); the URL is the shareable artifact. **No DB write, no new `packages/db` helper, no new dep.** Two **sanctioned** entry-affordance touches in the shipped Library (4.4) + Saved (4.5) slices, shown in the manifest.

## Constitution Check
RSC page + thin URL-updating client controls; tokens/§4.1a tints; URL-state (no storage); no new dep; voice; build-exactly-the-slice (Save view/Export visual-only); **wrap-not-mutate** on shared/public leaves **except the 2 sanctioned 4.4/4.5 entry touches**. **PASS.**

## Architecture

### Route + read (A1)
`app/app/compare/page.tsx` — async RSC, `searchParams: Promise<…>`. Parse `?compare=` → ≤4 slugs (dedup, cap 4). `const details = (await Promise.all(slugs.map(getProblemDetail))).filter(Boolean)` (reuse `getProblemDetail`; unknown slug → `undefined` → filtered). `getAppUser()` is the gate (data is global problem data — like the Library). Render `<CompareView columns={details.map(adaptCompareColumn)} … />` in the shell. No middleware/auth change.

### Compare adapter (A3) — the single seam
`apps/web/src/lib/compare-adapter.ts` — `adaptCompareColumn(detail: ProblemDetail): CompareColumnVM`:
- **header**: `{ slug, title, category, momentumPct, sparkline }`.
- **quantitative**: `mentions60d` (`problem.mentionCount60d`); `sources` `{ count: distinct badges via resolveBadge, of: 5 }`; `wtp` `detail.wtp ? { count, median } : null`; `persona` top by position `{ label, pct }`; `solutions` `{ count, direct: matchType==="direct" count, adjacent: … }`; `daysSinceFirstSeen` (now − `firstSeenAt`).
- **qualitative**: `CompareCardSchema.safeParse(problem.compareCard)` → `{ scorecards: 5×{value,tone}, bristlesRead: {verdict,prose} } | null` (null on parse fail → graceful empty cells).
- **bestFit**: `bristlesRead?.verdict === "strongest"`.
All formatting here; the grid is presentational.

### Grid (FR-003..006)
`compare-view.tsx` (composer) → `compare-grid.tsx`: a hand-rolled grid (CSS grid / table) — left label column + one column per problem, horizontally scrollable. `compare-column-header.tsx` (card: chip + title + momentum + sparkline + × remove + Best-fit badge). Row renderers: a quantitative-row component (label + per-column cell), `scorecard-cell.tsx` (value + tone chip), `bristles-read-card.tsx` (verdict tone card + prose). Tone → token color map; verdict → tone.

### Build + share (FR-007/008, A4)
`compare-picker.tsx` (client) — "Add a problem" → a select/menu of problems not already in the set → updates `?compare=` (router.replace); disabled at 4. The × on a header removes the slug from `?compare=`. `compare-empty.tsx` — 0-selected empty state + the picker; 1-selected "add one more" prompt. **Share** (client) copies the current URL to the clipboard ("Link copied"); Save view / Export PDF visual-only.

### Entry wiring (A2) — the two sanctioned shipped-slice touches
- **Saved (4.5)** — `components/app/saved/saved-header.tsx`: the "New comparison" `<button>` → a `<Link href="/app/compare">` (same styling). **1-element diff.**
- **Library (4.4)** — `?select=` URL-param selection: `library-params.ts` parses `select: string[]`; `results-table.tsx` gains a leading checkbox column (the A8-deferred one) wired to a thin `library-compare-select.tsx` client island toggling `?select=`; `library-view.tsx` renders a "Compare selected (N) →" bar (links `/app/compare?compare=<≤4 selected>`) when ≥1 selected. **Bounded diff across 3 Library files + 1 new island.**

### Bundle / motion
RSC grid; client islands = picker, the × removers, Share, and (in the Library) the compare-select checkbox. Reduced-motion via the global reset. Tokens → light/dark. Grid scrolls horizontally on mobile.

## Batching (self-run; one commit per task, gates green per task)
- **Batch 0** — route (`?compare=` parse) + `compare-adapter` + `compare-view`/`compare-grid` skeleton rendering columns from the adapter. Gate: anon `/app/compare` → 307; tsx probe of `adaptCompareColumn` over the 4 design slugs (derived rows + scorecards + verdict + Best-fit); typecheck/lint/build.
- **Batch A** — the full grid: column header (card + × + Best-fit), the 6 quantitative rows, the 5 scorecard rows, Bristle's Read. Gate: build; the 4-slug deep link renders page-6 values.
- **Batch B** — picker (add, ≤4) + × remove (URL) + empty/1-selected states + Share (copy link); Save view/Export visual-only. Gate: add/remove update `?compare=`; 0/1 states.
- **Batch C** — entry wiring (Saved link + Library `?select=` checkbox + "Compare selected" bar) + polish + a11y + §8 + gates + preview. Gate: the two entries navigate correctly; the Library/Saved diffs are exactly as manifested; light/dark/mobile.

## Slice-integrity manifest
- **NEW**: `app/app/compare/page.tsx`; `components/app/compare/**` (compare-view, compare-grid, compare-column-header, scorecard-cell, bristles-read-card, compare-picker, compare-empty, compare-share); `lib/compare-adapter.ts`; (Library) `components/app/library/library-compare-select.tsx`.
- **EDIT (sanctioned)**: `components/app/saved/saved-header.tsx` (New comparison → Link); `components/app/library/{results-table,library-view}.tsx` + `lib/library-params.ts` (`?select=` + checkbox + Compare-selected bar); `CLAUDE.md` §8 + pointer.
- **UNCHANGED**: Tier-3 auth + middleware; **4.1 schema/seed** (compare_card read-only); 4.2 shell/seam/registry; 4.3 detail + adapter; 4.6 alerts; **`packages/db`** (reuse `getProblemDetail` — no new helper); **all shared/public leaves**; public routes. **No schema/seed/migration; no DB write; no new dep.**

## Risks & follow-ups
- **Saved/named comparisons** = a new `comparisons` table → **out of scope, would STOP** (URL-param avoids it). Noted as a 5.5+ feature.
- **Library touch (A2)** — the larger of the two sanctioned diffs; deferrable to picker-only if the founder prefers (US3.2).
- **Over-fetch**: `getProblemDetail` fetches quotes/related/frequency Compare doesn't use — acceptable at ≤4 (vs the Library's 15); a lean `getCompareData` could replace it later (not worth a new helper now).
- **Comp divergences (mine):** Sources "X of 5" (not "of 6", 5-source delta); selection via picker/checkbox not drag (4.5 no-DnD); validated-demand tone chip vs the comp's bare ✓.

## Process oddities
Sandbox-verifiable: anon `/app/compare` → 307; build; **tsx probe of `adaptCompareColumn`** over the 4 design slugs; the **no-write grep** + integrity diff (incl. the exact Library/Saved diffs). Populated grid is founder-run on preview. HTTPS-token push.

### Founder preview checklist (page 6)
1. `?compare=<4 slugs>` → 4 columns (card header + × + **Best fit** on Stripe).
2. Quantitative rows: Mentions·60d 47/38/29/31; Sources X-of-5; WTP count·median (pgvector 0·—); Personas top·%; Solutions count·direct (Expo —); Time-since days (now-relative).
3. Scorecards (5, tone-colored) + Bristle's Read (Strongest/Build-able/Watch/Skip + prose).
4. Add (picker, ≤4) / remove (×) update the URL; 0 → empty, 1 → "add one more"; Share copies the link.
5. Saved "New comparison" → /app/compare; Library select + "Compare selected" → /app/compare?compare=… (the only two shipped-slice changes).
6. Light/dark; mobile (horizontal scroll).
