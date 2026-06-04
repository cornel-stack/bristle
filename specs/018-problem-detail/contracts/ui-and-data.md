# Contracts: Slice 4.3 (Problem Detail) — UI + data

Internal contracts only (no external API). Pins the tab keys, the new read-only DB helpers, the boundary adapter, and the A2 guard.

## 1. Route

- **Path**: `/app/problems/[slug]` → `apps/web/src/app/app/problems/[slug]/page.tsx`
- **Type**: async Server Component. `params: Promise<{ slug: string }>` (Next 15).
- **Flow**: `const user = await getAppUser()` → `const detail = await getProblemDetail(slug)` → `if (!detail) notFound()` → `const savedIds = await getSavedProblemIds(user.id)` → `const activity = await getProblemActivity(detail.problem.id)` → render `<ProblemDetail detail={detail} activity={activity} isSaved={savedIds.has(detail.problem.id)} />` inside the existing `app/app/layout.tsx` shell.
- **Gating**: inherited from `app/app/layout.tsx` (`auth()` + middleware `/app/:path*`). **No middleware/auth edit.** Anonymous → `/login?callbackUrl=/app/problems/[slug]`.

## 2. Tab contract (A1)

- **Keys (order)**: `synthesis · frequency · evidence · solutions · wtp · related · activity`.
- **Count labels**: `evidence` (quote count), `solutions` (solution count), `wtp` (mention count). Others label-only.
- **Default**: `synthesis`. `?tab=<key>` selects the panel; absent/unrecognized → `synthesis`.
- **Island**: `detail-tabs.tsx` (`"use client"`) — owns `activeTab`, reads initial from `useSearchParams`, writes via `router.replace` (no scroll). `role="tablist"` + `role="tab"` (roving `tabIndex`, arrow/Home/End nav, `aria-selected`, `aria-controls`), panels `role="tabpanel"` + `aria-labelledby`. Visible focus ring (2px accent + 4px ring). Reduced-motion respected.
- **Persistence**: the right rail is rendered by the layout composer **outside** the island and does not re-render on tab change.

## 3. New read-only DB helpers (`packages/db`)

```ts
// Both read-only, seam/id-parameterized (never a hardcoded id). No schema change.
export async function getSavedProblemIds(userId: string): Promise<Set<string>>;
//   → SELECT problem_id FROM user_saved_problems WHERE user_id = userId  →  Set
export async function getProblemActivity(problemId: string, limit?: number): Promise<ProblemActivity[]>;
//   → SELECT * FROM problem_activity_log WHERE problem_id = problemId ORDER BY created_at DESC
```

Exported from `packages/db/src/index.ts`. `getSavedProblemIds` powers the Save state (A3); `getProblemActivity` powers the Activity tab (the only child set `getProblemDetail` doesn't return). **Two** new helpers total — this is the full `packages/db` delta (FR-017/SC-009: read-only, no schema/seed/migration).

## 4. Boundary adapter (A2)

`apps/web/src/lib/problem-detail-adapter.ts` — `adaptProblemDetail(detail: ProblemDetail, savedIds: Set<string>) → DetailViewModel` (shape in data-model.md §3). Maps DB rows → reused-leaf props + in-app view models; all formatting lives here (relative times, `+X%`, price ranges, `resolveBadge` labels, frequency windowing). Panels stay presentational.

## 5. Reuse / wrap contract (A2 guard — HARD)

| Public leaf | Action | Reason |
|---|---|---|
| `DonutChart`, `SourcesCard`, `FrequencyChart`, `ProblemMomentumChip`, `donut-math`, `frequency-math` | **REUSE as-is** | source-key-agnostic; adapter absorbs |
| `EvidenceQuote`/`EvidenceList`, `ProblemSourceBadge`, `RelatedProblemsCard` | **DO NOT reuse → wrap** in new in-app components | contract gaps (no `forum`; engagement/WTP; public link target; mandatory fields) |

**Invariant**: `git diff --stat apps/web/src/components/problem/` is **empty** at every STOP. No shared public leaf is edited. If a reuse turns out to need a leaf change, STOP and surface it (extend-or-wrap), don't mutate.

- **FrequencyChart** verify-at-STOP-2: if it lacks the validation-threshold marker / prior-period caption, wrap (overlay) — don't edit the leaf.

## 6. Source vocabulary (5-source delta)

All source rendering routes `source_key` through `@bristle/shared resolveBadge`: `gh→GitHub`, `hn→Hacker News`, `so`+`se→Stack Overflow` (one badge, label per slice-4.2 D6), `appstore→App Store`, `forum→Forums`. Donut slices sum to the quote total; "N sources" = distinct-source count. No Product Hunt / Google Play.

## 7. Action bar (A3)

`Save` (reflects `isSaved` → "Saved"/"Save", click inert this slice) · `Compare` · `Alert me` · `Export` (bristle-accent primary). Compare/Alert/Export render visual-only; no writes. Mutations: Save→4.5, Compare→4.7, Alert→4.6, Export→Tier 6.

## 8. TF-021

`apps/web/src/components/app/dashboard/problem-grid.tsx` — card link `/problems/[slug]` → `/app/problems/[slug]`. The public `/problems/[slug]` route + its leaves stay byte-for-byte unchanged.
