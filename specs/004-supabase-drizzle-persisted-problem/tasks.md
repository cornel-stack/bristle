# Tasks: Supabase + Drizzle + One Persisted Problem

**Input**: `spec.md` + `plan.md` + `research.md` + `data-model.md` + `contracts/` in `specs/004-supabase-drizzle-persisted-problem/`
**Branch**: `004-supabase-drizzle-persisted-problem`
**Tests**: none this slice (no Vitest/Playwright requested); verification is migrate/seed idempotency, SQL inspection, local + preview render, typecheck/lint/build, and the env-leak check.

## Conventions

- **One commit per task.** Each task lists a suggested commit message; verification/deploy gates produce no commit.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (schema + migration), US2 (seed + persisted render), US3 (production/preview parity), or SETUP.
- Every task has a **Verify** line — the objective check before committing.
- **Batching (per policy, ~3 stops)**: tasks are grouped into **3 batches**; each batch ends in **one STOP** for review. Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution-time prerequisites (user-owned)**: a provisioned Supabase project with `.env.local` populated (`DATABASE_URL`, `DATABASE_URL_DIRECT`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) is required from **T012** onward; Vercel dashboard env (Preview + Production) is required at **T017**.

---

## Batch A — Setup & dependencies  ▸ STOP 1

### Phase 1: Setup

### T001 · [SETUP] Root `.env.example`
Create `.env.example` at repo root documenting `DATABASE_URL` (pooler, runtime), `DATABASE_URL_DIRECT` (session/5432, migrations only), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` — placeholder values only, with a short comment on each.
- **Files**: `.env.example`
- **Depends on**: —
- **Verify**: file documents all four vars with placeholders (no real secrets); `.gitignore` already covers `.env`, `.env.*`, `!.env.example`.
- **Commit**: `chore: add .env.example documenting db + supabase env vars`

### T002 · [P] [SETUP] `packages/shared` category labels
Add `packages/shared/src/categories.ts` (`CATEGORY_LABELS` const map of the 8 keys→labels per data-model; `CategoryKey = keyof typeof CATEGORY_LABELS`) and re-export from `packages/shared/src/index.ts`.
- **Files**: `packages/shared/src/categories.ts`, `packages/shared/src/index.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter @bristle/shared typecheck` exits 0; all 8 keys present (`payments…email`); labels match (`ai-ml`→"AI / ML", `auth-sso`→"Auth & SSO").
- **Commit**: `feat(shared): add CATEGORY_LABELS key→label map`

### T003 · [SETUP] `packages/db` manifest + scripts
Update `packages/db/package.json`: deps `drizzle-orm@0.45.2`, `postgres@3.4.9`; devDeps `drizzle-kit@0.31.10`, `tsx`, `dotenv`, `@types/node`, `typescript@5.8.3`; scripts `db:generate`/`db:migrate`/`db:seed`/`db:studio` (per plan §6); keep barrel export.
- **Files**: `packages/db/package.json`
- **Depends on**: —
- **Verify**: JSON valid; four `db:*` scripts present; deps/devDeps present.
- **Commit**: `chore(db): add drizzle/postgres deps and db scripts`

### T004 · [SETUP] `apps/web` → db/shared wiring
Add `@bristle/db` and `@bristle/shared` (`workspace:*`) to `apps/web/package.json`; extend `transpilePackages` in `apps/web/next.config.ts` to `["@bristle/ui","@bristle/db","@bristle/shared"]`.
- **Files**: `apps/web/package.json`, `apps/web/next.config.ts`
- **Depends on**: —
- **Verify**: both deps listed; `transpilePackages` includes all three; both files parse.
- **Commit**: `chore(web): depend on @bristle/db and @bristle/shared`

### T005 · [SETUP] Install + lockfile
Run `pnpm install`; commit `pnpm-lock.yaml`.
- **Files**: `pnpm-lock.yaml`
- **Depends on**: T002, T003, T004
- **Verify**: install exits 0 (peer-dep warnings ok); `drizzle-orm`/`postgres`/`drizzle-kit`/`tsx`/`dotenv` resolve; `pnpm typecheck` still green across workspaces.
- **Commit**: `chore: install db deps (drizzle, postgres) and lock`

**▸ STOP 1** — setup + deps in place; workspaces resolve.

---

## Batch B — Schema, client, migration  ▸ STOP 2

### Phase 3: User Story 1 — Reproducible schema (P1)

**Goal**: the `problems` table (incl. nullable `vector(1536)`) is defined, generated into a committed migration, and applies cleanly + idempotently to a fresh database.
**Independent test**: SC-002, SC-003, SC-004, SC-009.

### T006 · [US1] Drizzle schema
Create `packages/db/src/schema.ts`: `problems` table exactly per data-model (`id` uuid pk default `gen_random_uuid()`, `slug` text not null **unique**, `title` text not null, `category` text not null, `momentum_pct` integer not null, `sparkline` integer[] not null, `top_quote` text not null, `quote_source` text not null, `sources` text[] not null, `last_seen_at` timestamptz not null, `created_at` timestamptz not null default now, `embedding` vector(1536) nullable) + `Problem`/`NewProblem` inferred types.
- **Files**: `packages/db/src/schema.ts`
- **Depends on**: T005
- **Verify**: `pnpm --filter @bristle/db typecheck` exits 0; columns/types/constraints match the contract; `embedding` nullable; `slug` unique.
- **Commit**: `feat(db): add problems Drizzle schema`

### T007 · [US1] drizzle.config.ts
Create `packages/db/drizzle.config.ts` (schema `./src/schema.ts`, out `./drizzle`, dialect `postgresql`, `dbCredentials.url = DATABASE_URL_DIRECT`, strict).
- **Files**: `packages/db/drizzle.config.ts`
- **Depends on**: T006
- **Verify**: typechecks; references `DATABASE_URL_DIRECT` (not the pooler URL).
- **Commit**: `chore(db): add drizzle.config.ts (direct/session URL)`

### T008 · [US1] ⚠ Generate + hand-edit first migration (high-risk — stands alone)
Run `pnpm --filter @bristle/db db:generate`; commit `packages/db/drizzle/0000_*.sql` + `meta/`. **Hand-edit** the SQL: prepend a one-line comment noting it was modified after `db:generate`, then `CREATE EXTENSION IF NOT EXISTS vector;` (as the first statement, before `CREATE TABLE problems`), per plan §2.
- **Files**: `packages/db/drizzle/0000_*.sql`, `packages/db/drizzle/meta/*`
- **Depends on**: T007
- **Verify**: migration file exists and is tracked; first statement is `CREATE EXTENSION IF NOT EXISTS vector;`; top-of-file drift comment present; `CREATE TABLE "problems"` includes `embedding vector(1536)` and `slug … unique`.
- **Commit**: `feat(db): generate initial migration and prepend pgvector extension`

### T009 · [US1] postgres-js client factory
Create `packages/db/src/client.ts`: memoized `getDb()` building `postgres(DATABASE_URL, { prepare: false })` + `drizzle(client, { schema })`; throws if `DATABASE_URL` unset.
- **Files**: `packages/db/src/client.ts`
- **Depends on**: T006
- **Verify**: typechecks; `{ prepare: false }` present; throws on missing `DATABASE_URL`; uses the pooler URL (not the direct URL).
- **Commit**: `feat(db): add postgres-js client factory (prepare:false)`

### T010 · [US1] Migration runner
Create `packages/db/src/migrate.ts`: loads env (`dotenv`), connects via `DATABASE_URL_DIRECT` (`postgres(url, { max: 1 })`), runs `migrate(drizzle(sql), { migrationsFolder: "./drizzle" })`, ends the connection; throws if `DATABASE_URL_DIRECT` unset.
- **Files**: `packages/db/src/migrate.ts`
- **Depends on**: T008
- **Verify**: typechecks; uses `DATABASE_URL_DIRECT` + `max:1`; points at `./drizzle`.
- **Commit**: `feat(db): add migration runner (direct/session URL)`

### T011 · [US1] Query helper + barrel
Create `packages/db/src/queries.ts` (`getFirstProblem(): Promise<Problem>` — selects one row, **throws** if none) and update `packages/db/src/index.ts` to export the schema, `getDb`, `getFirstProblem`, and the `Problem`/`NewProblem` types (drop the placeholder).
- **Files**: `packages/db/src/queries.ts`, `packages/db/src/index.ts`
- **Depends on**: T009
- **Verify**: typechecks; `getFirstProblem` throws on empty result; named imports resolve from `@bristle/db`.
- **Commit**: `feat(db): add getFirstProblem helper and package barrel`

### T012 · [US1] VERIFY — migrate on a fresh database (gate)
*(Requires `.env.local` with real Supabase `DATABASE_URL`/`DATABASE_URL_DIRECT` — user prerequisite.)* Run `pnpm --filter @bristle/db db:migrate`.
- **Depends on**: T010, T011
- **Verify**: SC-004 migrate applies cleanly to a fresh DB; re-running reports nothing to apply (idempotent). SC-009 via SQL: `embedding` column is type `vector` and nullable; `problems` has all contract columns.
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

**▸ STOP 2** — schema + migration reproducible and applied; `@bristle/db` surface ready.

---

## Batch C — Seed, page render, production parity  ▸ STOP 3

### Phase 4: User Story 2 — Persisted problem renders locally (P2)

**Goal**: one seeded problem renders on the homepage via `ProblemCardFull`, fetched from the database. **Independent test**: SC-005, SC-006, SC-007, SC-010.

### Phase 5: User Story 3 — Preview reads from production DB (P3)

**Goal**: the deployed preview renders the same card from the production database. **Independent test**: SC-008.

### T013 · [US2] Seed script
Create `packages/db/src/seed.ts`: upsert the canonical Stripe problem (`slug` `stripe-webhooks-vercel-cold-starts`, values mirroring the Slice 1.3 fixture per data-model; `embedding` null) via `insert(...).onConflictDoUpdate({ target: problems.slug, set: {...} })`; connect via `getDb()` (pooler).
- **Files**: `packages/db/src/seed.ts`
- **Depends on**: T011
- **Verify**: typechecks; conflict target is `problems.slug`; seed values match the fixture; `embedding` left null.
- **Commit**: `feat(db): add idempotent seed for the Stripe problem`

### T014 · [US2] VERIFY — seed locally (gate)
Run `pnpm --filter @bristle/db db:seed` twice.
- **Depends on**: T012, T013
- **Verify**: SC-005 first run inserts; second run is a no-op/update (one row for the slug, no duplicate). SC-009 the seed row's `embedding` is null.
- **Commit**: none (verification only).

### T015 · [US2] Homepage rewrite + remove toggle
Rewrite `apps/web/src/app/page.tsx` as an `async` Server Component: `await getFirstProblem()`, map row→props (`CATEGORY_LABELS[key]` for the label, key for `categoryColor`, `momentumPct`→`momentum`, `lastSeenAt.toISOString()`→`lastSeenIso`, narrow casts for `quoteSource`/`sources`), render one `<ProblemCardFull>`. Delete `apps/web/src/app/theme-showcase.tsx`.
- **Files**: `apps/web/src/app/page.tsx`, delete `apps/web/src/app/theme-showcase.tsx`
- **Depends on**: T011
- **Verify**: SC-006 `grep -rn "use client" apps/web/src/app` → no matches; `page.tsx` is `async` and imports `@bristle/db`; `theme-showcase.tsx` gone.
- **Commit**: `feat(web): render persisted problem via ProblemCardFull (remove toggle)`

### T016 · [US2] VERIFY — local gate
*(Requires `.env.local` + seeded local DB.)* Run the local loop.
- **Depends on**: T014, T015
- **Verify**: SC-010 `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. SC-007 `localhost:3000` renders the Stripe card via `ProblemCardFull` matching the Slice 1.3 appearance (pill, sparkline, quote box, badges, momentum), modulo relative time.
- **Commit**: none (verification only).

### T017 · [US3] Production DB migrate + seed (env user-owned)
*(User sets the four vars in the Vercel dashboard for Preview + Production.)* Run `db:migrate` (via `DATABASE_URL_DIRECT` = prod session URL) then `db:seed` (via `DATABASE_URL` = prod pooler URL) against the production database.
- **Depends on**: T016
- **Verify**: production `problems` table exists with the seeded row; `embedding` null. Vercel env holds all four vars for both environments.
- **Commit**: none (operational step).

### T018 · [US3] VERIFY — preview parity + secret hygiene (gate)
Push the branch; confirm the Vercel preview.
- **Depends on**: T017
- **Verify**: SC-008 the preview URL renders the Stripe card, fetched from the production DB. SC-011 `git ls-files | grep -E '(^|/)\.env($|\.)'` returns only `.env.example`.
- **Commit**: none (verification/deploy only).

**▸ STOP 3** — persisted card live locally and on the preview from the production DB; slice complete.

---

## Dependencies & Execution Order

```
Batch A: T001 ∥ T002 ∥ T003 ∥ T004 → T005
Batch B: T006 → T007 → T008 → (T009 → T010, T009 → T011) → T012
         (T009 depends on T006; T010 on T008; T011 on T009)
Batch C: T013 → T014 ;  T015 (∥ T013, both need T011) → T016 → T017 → T018
```

- **US1 (P1)**: T006–T012 — the schema/migration foundation.
- **US2 (P2)**: T013–T016 — needs US1 (migrate applied).
- **US3 (P3)**: T017–T018 — needs US2 + production env.

### Parallel opportunities

- **Batch A**: T001, T002, T003, T004 touch independent files → parallel; T005 (install) joins them.
- **Batch B**: after T009, the runner (T010) and the query/barrel (T011) are largely independent; T008 (migration) is the one high-risk task and **stands alone** (hand-edited SQL).
- **Batch C**: T013 (seed) and T015 (page) both depend only on T011 → can proceed in parallel before their verify gates.

## Implementation strategy (3 stops)

1. **Stop 1 (Batch A)**: setup + deps installed.
2. **Stop 2 (Batch B / US1)**: schema + committed migration applied to a fresh DB, idempotent, pgvector column verified — the reproducible foundation.
3. **Stop 3 (Batch C / US2+US3)**: seed + homepage render from DB locally, then production migrate/seed + preview parity — the visible vertical slice, end to end.

## Task count

18 tasks — **13 commit-producing** (T001–T011, T013, T015), **5 verification/operational gates** (T012, T014, T016, T017, T018). Grouped into **3 batches / 3 stops** per the batching policy.

## Out of scope (no tasks)

next-themes/theme toggle; auth/RLS/Supabase-key usage in app code; tables beyond `problems`; embedding generation; real-time; defensive empty-state UI (fetch throws); new secret-scanning tooling.
