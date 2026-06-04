# Data Model: Slice 4.3 (Problem Detail)

**Read-only.** No new tables/columns/migrations/seed. Every region reads slice-4.1 rows via `getProblemDetail(slug)` (already returns full child sets) plus **one** new read-only helper for Save state. The boundary adapter (`apps/web/src/lib/problem-detail-adapter.ts`) maps DB rows → reused-leaf props + in-app view models.

## 1. Read sources

| Source | Shape (relevant columns) | Used by |
|---|---|---|
| `getProblemDetail(slug).problem` | `Problem`: `slug, title, category, demandStatus, momentumBucket, momentumPct*, mentionCount60d, firstSeenAt, updatedAt, synthesis, sources[]` | header, synthesis panel, momentum chip |
| `.sources` | `ProblemSource[]`: `{sourceKey, quoteCount}` | donut, source-badge row, evidence filter chips, "N sources" |
| `.quotes` | `ProblemQuote[]`: `{authorHandle, sourceKey, engagementValue, engagementLabel, rating, quoteText, postedAt, isWtpSignal, statedPriceUsd, position}` | evidence panel |
| `.solutions` | `ExistingSolution[]`: `{name, priceRange, matchType(direct/adjacent/partial), description, mentionCount, position}` | solutions panel |
| `.wtp` | `WtpSignal \| null`: `{mentionCount, priceMinUsd, priceMaxUsd, medianUsd, note}` (null = genuine 0) | WTP panel + rail |
| `.personas` | `ProblemPersona[]`: `{label, count, percentage, position}` | personas rail (bars) |
| `.related` | `ProblemRelated[]`: `{label, targetSlug \| null, relatedProblemId, position}` | related panel + rail |
| `.frequency` | `ProblemFrequencyPoint[]`: `{observedOn, mentionCount, isThresholdMarker}` | frequency panel |
| `getSavedProblemIds(uid)` **(NEW, read-only)** | `Set<problemId>` from `user_saved_problems` where `user_id = uid` | action bar (Save state) |
| `getAppUser()` | `User` (demo in v1.0) — the seam; resolves *which* user, never hardcoded | viewer id for `getSavedProblemIds` |

> *`momentumPct`* — the displayed delta is derived from the problem's momentum field(s); the adapter formats it to the `+312%` string the chip expects.

## 2. Region → child set → component (reuse vs new)

| Region | Child set | Component | Reuse / New |
|---|---|---|---|
| Header: breadcrumb, chips, demand-status chip, first-seen/updated, title, summary line | `problem` (+ counts from `quotes`/`sources`/`wtp`) | `detail-header.tsx` | **NEW** |
| Header: momentum | `problem.momentumPct` | `ProblemMomentumChip` | **REUSE** |
| Header: source-badge row | `sources` | `@bristle/ui` source-icons via `resolveBadge` | NEW (forum gap) |
| Action bar | `getSavedProblemIds` (Save only) | `detail-action-bar.tsx` | **NEW** |
| Tab strip + state | — (URL `?tab=`) | `detail-tabs.tsx` | **NEW (client island)** |
| Synthesis panel | `problem.synthesis` | `synthesis-panel.tsx` | **NEW** |
| Frequency panel | `frequency` | `FrequencyChart` (+ threshold/caption wrap) | **REUSE** (+wrap) |
| Evidence panel | `quotes` + `sources` (chips) | `evidence-panel.tsx` + `evidence-quote-row.tsx` | NEW (EvidenceQuote gap) |
| Solutions panel | `solutions` | `solutions-panel.tsx` | **NEW** |
| WTP panel | `wtp` | `wtp-panel.tsx` (+ genuine-0) | **NEW** |
| Related panel | `related` | `related-panel.tsx` | NEW (RelatedProblemsCard gap) |
| Activity panel | `problemActivityLog` (via `getProblemDetail`? see note) | `activity-panel.tsx` | **NEW** |
| Rail: sources donut + legend | `sources` | `SourcesCard`(→`DonutChart`) | **REUSE** |
| Rail: WTP | `wtp` | `wtp-panel.tsx` (rail variant) | **NEW** |
| Rail: personas | `personas` | `personas-rail.tsx` | **NEW** |
| Rail: related | `related` | `related-rail.tsx` (shared link rule) | NEW |

> **Activity note (resolve at STOP-1):** `getProblemDetail` returns 8 sets but **not** `problem_activity_log`. The Activity tab needs this problem's activity rows. Two read-only options — (a) a tiny new read-only helper `getProblemActivity(problemId)`, or (b) extend `getProblemDetail` to include `activity`. Default: **(a)** a small dedicated read-only helper, on clean-separation grounds — activity is a distinct, problem-scoped log, lazy-loadable with the Activity tab — matching the slice-4.2 pattern of focused read helpers. (Note: this is *not* about protecting the public sample — the public `/problems/[slug]` renders from the hardcoded `SAMPLE_PROBLEMS` store, **not** from `getProblemDetail`, so extending `getProblemDetail` would not ripple there. The separate helper stands purely on the clean-separation rationale.) This is the **second** read-only helper beyond `getSavedProblemIds` — flagged here so the diff-scope count (FR-017/SC-009) is accurate: **two** new read-only `packages/db` helpers, both seam/id-parameterized, no schema change. Confirm at STOP-1.

## 3. Adapter output (boundary view models)

`adaptProblemDetail(detail, savedIds)` → 
- `donutRows: {name,count}[]`, `quoteTotal`, `sourceCount` (distinct) — via `resolveBadge`
- `frequencyData: Record<7d/30d/90d/all, {date,count}[]>` + `thresholdDate?` + `priorPeriodDeltaPct`
- `momentum: {delta,windowDays}`
- `evidenceVMs: {handle, sourceKey(@bristle/ui), engagementText|rating, text, relativeTime, isWtp, statedPrice?}[]` + `filterCounts: {all, perBadge}`
- `solutionVMs: {name, priceRange, matchType, description}[]`
- `wtpVM: {mentionCount, priceRange, median, note} | null`
- `personaVMs: {label, count, pct}[]`
- `relatedVMs: {label, href: /app/problems/[slug] | null}[]`
- `summary: {quotes, sources, wtpMentions}`
- `isSaved: boolean`

All formatting (relative times via the existing `relative-time` util; `+X%` deltas; price ranges) happens in the adapter — panels stay presentational.

## 4. Key entities (read-only, from 4.1)

`Problem`, `ProblemSource`, `ProblemQuote`, `ExistingSolution`, `WtpSignal` (nullable), `ProblemPersona`, `ProblemRelated` (inline `targetSlug`), `ProblemFrequencyPoint` (with `isThresholdMarker`), `ProblemActivity`, `User` (demo, via seam). All `$inferSelect` types already exported from `@bristle/db`.

## 5. Completeness (SC trace)

Every page-2 value → a region in §2 → a child set in §1 → a 4.1 fixture row. Zero values need new data. The only new reads are the two read-only helpers (`getSavedProblemIds`, `getProblemActivity`) — user/problem-scoped, no schema change. Genuine-0 (pgvector `wtp = null`) and label-only related (`targetSlug = null`) are represented, not error states.
