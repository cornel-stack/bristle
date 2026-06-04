# Quickstart: Slice 4.3 (Problem Detail)

Read-only UI over the slice-4.1 seed, inside the slice-4.2 app shell. No new env, no new deps, no schema/seed change. Two new read-only `packages/db` helpers; everything else is `apps/web`.

## 0. Route + shell + saved helper + TF-021 (Batch 0 / STOP 1)
```bash
# app/app/problems/[slug]/page.tsx: RSC — getAppUser() → getProblemDetail(slug) → notFound() | <ProblemDetail/>
# components/app/problem-detail/{problem-detail,detail-header,detail-action-bar,detail-tabs}.tsx (tabs = client island, empty slots)
# packages/db: getSavedProblemIds(userId) [+ confirm getProblemActivity(problemId) here or Batch B] + export
# dashboard problem-grid.tsx: card link /problems/[slug] → /app/problems/[slug]   (TF-021)
pnpm --filter web typecheck && pnpm --filter web lint && pnpm --filter web build
# Verify (HTTP, no DB session): anonymous GET /app/problems/stripe-webhook-reliability → 307 /login?callbackUrl=…
# Confirm public /problems/[slug] still builds + renders unchanged.
```

## 1. Boundary adapter + leaf reconciliation (Batch A / STOP 2)
```bash
# lib/problem-detail-adapter.ts: ProblemDetail → {donutRows, frequencyData(+threshold/caption), momentum,
#   evidenceVMs(+filterCounts), solutionVMs, wtpVM|null, personaVMs, relatedVMs(href|null), summary, isSaved}
# Reuse: DonutChart/SourcesCard/FrequencyChart/ProblemMomentumChip (+ *-math). Source via resolveBadge.
# A2 GUARD: do NOT edit components/problem/* — EvidenceQuote/SourceBadge/RelatedProblemsCard get wrapped, not mutated.
pnpm typecheck && pnpm lint
# Foreground tsx probe: adapter over hero (stripe), a forum-source problem, pgvector (wtp=null), a label-only related.
# git diff --stat apps/web/src/components/problem/   →  MUST be empty.
# Report the FrequencyChart threshold/caption verification (reuse vs wrap).
```

## 2. Seven tab panels (Batch B / STOP 3)
```bash
# panels/: synthesis · frequency(reuse+wrap) · evidence(filter chips + quote rows + show-more) ·
#   solutions(match chips) · wtp(+genuine-0) · related(app link | label-only unlinked) · activity(getProblemActivity)
pnpm build
# Each panel renders for the hero from fixtures; ?tab=evidence|frequency|… deep-links open the right panel.
```

## 3. Persistent right rail (Batch C / STOP 4)
```bash
# rail/: sources-rail(reuse SourcesCard) · wtp-rail · personas-rail(bars) · related-rail
# Rail renders OUTSIDE the tab island → stays put across tab switches.
pnpm build
# Donut slices sum to the quote total; pgvector rail shows the 0-WTP state, not a blank panel.
```

## 4. Polish + gates + preview (Batch D / STOP 5)
```bash
pnpm typecheck && pnpm lint && pnpm build           # 4/4
# Light/dark parity; mobile (header reflow, tab strip scroll/wrap, rail stacks); a11y (tablist roles,
#   roving focus, aria-selected/controls, focus rings, reduced-motion). Per-route First Load JS:
#   islands = detail-tabs + (already-client) FrequencyChart.
# CLAUDE.md §8 doc-only note (the /app/problems/[slug] detail + adapter + wrap-not-mutate convention).
# Push → Vercel preview. INTERACTIVE verification on preview (sandbox can't hold a signed-in session):
#   sign in → /app/problems/stripe-webhook-reliability → walk the STOP-5 page-2 checklist (plan.md).
```

## 5. Done-when
SC-001…009: /app/problems/[slug] gated + in shell for all 15; 7 tabs populated (hero exhaustive); keyboard + ?tab= deep links; rail (donut 5 sources summing to quotes, WTP, personas, related); genuine-0 (pgvector WTP) + label-only related unlinked (0 dead links); dashboard cards → /app/problems/[slug] (TF-021) + public sample unchanged; page-2 light/dark + mobile; gates green; diff = apps/web + two read-only packages/db helpers (no schema/seed/migration).

## 6. Process oddities
dev==prod single Supabase (read-only here); sandbox can't run signed-in walks → anonymous redirect + build + tsx probe are sandbox-checks, pixel fidelity is founder-run on preview; charts hand-rolled (no charting dep, §9.5); A2 guard = never edit a shared public leaf (empty `components/problem/` diff); `getAppUser()` is the Tier-5.5 flip point; HTTPS-token push for the preview branch.
