# Contracts: Source Registry, JSON Type Contracts, Typed Queries (Slice 4.1)

Interface contracts the screens (slices 4.2–4.8) and the v1.1 pipeline depend on. Shapes are pinned here; column types live in data-model.md.

## 1. Source registry — `packages/shared/src/sources.ts` (FR-021/FR-022 · D2/D3)

**Five live badges only.** No Product Hunt / Google Play (founder override — no dead `isLive=false` badges; Design-delta in plan.md).

```text
type SourceKey = "gh"|"hn"|"so"|"se"|"appstore"|"forum"   // 6 keys → 5 badges (so/se roll up)
type BadgeKey  = "github"|"hackernews"|"stackexchange"|"appstore"|"forums"   // the 5 rendered badges
interface SourceMeta { key; label; badgeKey }            // every entry is live by construction (no isLive flag)
SOURCE_REGISTRY: Record<SourceKey, SourceMeta>
resolveBadge(key): { badgeKey; label }                   // so + se → one "stackexchange" badge; forum → "forums"
SOURCE_BADGES: readonly BadgeKey[]                        // the 5, ordered for facet display
```
Rules: **no screen-facing type hardcodes a key** — screens import `SOURCE_REGISTRY`/`resolveBadge`/`SOURCE_BADGES`. `problem_sources.source_key` + `problem_quotes.source_key` validated against `SOURCE_REGISTRY` keys at seed time. Extensibility (FR-021/22): re-adding PH/Play later = one registry entry + one badge key, zero schema/fixture change.

## 2. JSON type contracts — `packages/shared/src/fixtures-contracts.ts` (FR-031 · D1/D7)

Zod schemas (the v1.1 LLM output MUST validate against these):

```text
ScorecardCell   = { value: string; tone: "positive"|"caution"|"neutral"|"negative" }
CompareCardSchema = {
  validatedDemand: ScorecardCell; hasDirectSolution: ScorecardCell;
  personaFitIndie: ScorecardCell;  buildEffort: ScorecardCell;  defensibility: ScorecardCell;
  bristlesRead: { verdict: "strongest"|"build-able"|"watch"|"skip"; prose: string }
}                                                # → problems.compare_card

WeeklyMomentumSchema = {
  series: { categoryKey: string; points: number[] }[];     # per-category lines
  caption: string;                                          # "Devtools still leads…"
}                                                # → dashboard_fixtures.payload (key="weekly_momentum")
                                                 #   (per-category points also on categories.momentum_series)

export type CompareCard = z.infer<typeof CompareCardSchema>
export type WeeklyMomentum = z.infer<typeof WeeklyMomentumSchema>
```
Read boundary: any code reading `compare_card`/`weekly_momentum` parses through these schemas (no raw `any`).

## 3. Typed query contracts — `packages/db/src/queries.ts` (SC-004)

```text
getDashboardProblems(): Promise<Problem[]>
   # ORDER BY momentum_pct DESC. Returns the 15 fully typed (Problem = problems.$inferSelect).
   # Order MUST match design page-3: 312,184,96,72,58,41,37,29,24,19,15,12,11,8,6.

getProblemDetail(slug): Promise<{
   problem: Problem; sources; quotes; solutions; wtp; personas; related; frequency
}>  # joins the child tables for the page-2 detail screen (hero must fully populate).
```
Existing `getFirstProblem` / `getProblemBySlug` / `getRecentProblems` (Tier-2 consumers) keep their signatures unchanged.

## 4. Migration contract (FR-003 / FR-030)
`drizzle/0004_*.sql` MUST: (a) on `problems` — only `ADD COLUMN` (nullable or defaulted), no `DROP`, no `SET NOT NULL`; (b) `CREATE TABLE` the 15 new tables with the FKs in data-model.md; (c) apply cleanly via `db:migrate` on `DATABASE_URL_DIRECT`; (d) leave the 4 existing `problems` rows valid (backfilled by seed). Append a reverse-order `-- ROLLBACK` comment block (slice-015 convention).

## 5. Seed contract (FR-023–028)
`pnpm --filter @bristle/db db:seed` upserts (D6): 8 categories → 15 problems + child rows → demo user (watched_categories = 8 canonical) → user-scoped fixtures → dashboard fixture. **Idempotent** (re-run: stable counts, no error). Every row a valid production row; all 15 equally fleshed; hero exhaustive.

## 6. Acceptance trace
SC-001 migration applies, tables visible · SC-002 15 problems + children + demo fixtures, idempotent · SC-003 exact 13 + 2 fillers (incl. Analytics) · SC-004 momentum query order · SC-005 every field → a screen element · SC-006 5 live badges, no hardcoded key · SC-007 typecheck+lint 0 · SC-008 zero unmapped fields · SC-009 hero fully populates p2 · SC-010 landing + sample still render · SC-011 demo watched_categories resolve to 8 catalog rows.
