# Quickstart: Slice 4.1 (Full Schema + Fixtures)

Migration + seed + verification. Read with plan.md (batches) + data-model.md (tables) + contracts/. No new env vars, no new deps.

## 1. Schema migration (Batch 0 / STOP 1)
```bash
# 1. Edit packages/db/src/schema.ts FIRST: extend problems (+7 nullable/defaulted cols, +compare_card jsonb)
#    and add the 15 product tables (data-model.md). Schema-TS-before-generate (slice-013/14/15 lesson).
pnpm --filter @bristle/db db:generate          # → packages/db/drizzle/0004_<name>.sql
# 2. HAND-VERIFY 0004: on `problems` only ADD COLUMN (nullable/defaulted) — no DROP, no SET NOT NULL;
#    CREATE TABLE × 15. Append the -- ROLLBACK block.
pnpm --filter @bristle/db db:migrate           # applies to DATABASE_URL_DIRECT (shared dev==prod)
# 3. Probe (foreground tsx, pooler fallback): all 16 product tables present; problems has the 7 new cols.
```
Tier-2 check: new cols nullable/defaulted ⇒ existing 4 `problems` rows still valid ⇒ landing + sample render.

## 2. Source model + shared contracts (Batch A / STOP 2)
```bash
# packages/shared/src/sources.ts (SOURCE_REGISTRY + resolveBadge + SOURCE_BADGES — 5 badges, NO PH/Play)
# packages/shared/src/fixtures-contracts.ts (CompareCardSchema, WeeklyMomentumSchema)
pnpm typecheck && pnpm lint
# Assert: SOURCE_BADGES.length===5 (github,hackernews,stackexchange,appstore,forums); no producthunt/googleplay;
#         resolveBadge("so")===resolveBadge("se")==="stackexchange"; resolveBadge("forum")==="forums".
```

## 3. Seed (Batches B + C / STOPs 3–4)
```bash
# Extend packages/db/src/seed.ts: 8 categories → 15 problems + children (hero full) → demo user → user fixtures.
pnpm --filter @bristle/db db:seed              # idempotent (onConflictDoUpdate / replace-children — D6)
pnpm --filter @bristle/db db:seed              # re-run: identical row counts, no error (SC-002)
```
Probe checks: `SELECT count(*) FROM problems` = 15; hero source_counts sum 47; wtp_signals(hero) 11/$60; demo user `watched_categories` length 8; saved_collections 4; alert_rules 4 (1 disabled).

## 4. Typed queries + gates (Batch D / STOP 5)
```bash
# packages/db/src/queries.ts: getDashboardProblems() + getProblemDetail(slug)
pnpm typecheck && pnpm lint && pnpm build       # 4/4
# Probe: getDashboardProblems() momentum order = 312,184,96,72,58,41,37,29,24,19,15,12,11,8,6.
# Tier-2 non-breakage (local prod server): curl / (landing 200, hero card renders) + /problems/<seeded-slug> (200).
# Preview: push branch → Vercel build → seed runs against shared DB → data present (no screens to walk this slice).
```

## 5. Verification probe (one-off, deleted after — slice-015 pattern)
A `tsx` probe (run from `packages/db`, repo-root `.env.local`, pooler fallback) asserting: table presence, the 15-count, hero child counts, demo-user fixtures, the momentum order, and the demo `watched_categories` ↔ `categories` resolution. Never prints connection strings (use `redactConnectionString`).

## 6. Done-when
SC-001…011 green: migration clean + tables visible; 15 problems + children + demo fixtures, idempotent; exact depicted set + Analytics filler; momentum query ordered; every field traces to a screen; 5 live badges, no hardcoded key; typecheck/lint/build 0; hero fully populates p2; landing + sample still render; demo watched_categories resolve to 8 catalog rows.
