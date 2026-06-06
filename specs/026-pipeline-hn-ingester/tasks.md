# Tasks: Python Pipeline Scaffold + HN Ingester — Slice 5.1 (Tier-5 foundation)

**Feature**: `specs/026-pipeline-hn-ingester/` | **Branch**: `026-pipeline-hn-ingester` | **Inputs**: spec.md · plan.md (all 5 Decisions + OD-1…OD-7 SETTLED)

> ## ⛔ DON'T-IMPLEMENT until green-lit. **Per-batch checkpoints — STOP for founder review at each batch boundary (A/B/C/D), NOT self-run-to-close.** One commit per task. Three founder-provisioned **GATES** block their batches (C → dev Supabase; D → Railway + Inngest). **Batches A–B are GATE-FREE** (author + test on ephemeral `postgres:16`); C–D are gated/founder-run. **No code until the founder says go.** **No release tag at 5.1** — v0.5.0 is the Tier-5 capstone (5.10).

## Execution model

4 batches, **36 tasks** (incl. 4 checkpoint/gate tasks + 6 test tasks). The correctness tests are **gates, not afterthoughts**.

| Batch | Theme | Tasks | Gate |
|---|---|---|---|
| **A** | Drizzle `raw_items` + migration `0005` + the TS↔Python contract mechanism | T001–T006 | none (gate-free) |
| **B** | Python package (uv) + the ingester + the full test suite on ephemeral `postgres:16` | T007–T021 | none (gate-free) |
| **C** | Apply to dev + drift/integration + web-app re-point | T022–T029 | **GATE-DEV-DB** |
| **D** | Railway deploy + Inngest cron + autonomous DoD + CI + §8 | T030–T036 | **GATE-RAILWAY + GATE-INNGEST** |

**User-story coverage**: US1 (autonomous ingest, FR-001/002) → A+B+D · US2 (no duplicates, FR-004/005) → T009/T010/T016/T020/T033 · US3 (dev isolation, FR-006) → T005/T022–T027.

### Count cross-check
NEW committed: `packages/db/src/pipeline-schema.ts`, `drizzle/0005_*.sql` (+journal), `scripts/gen-contract.ts`, `contracts/raw_items.contract.json`, `scripts/migrate-all.ts` (5 in `packages/db`) · `apps/pipeline/**` = pyproject/uv.lock/.python-version/ruff.toml/.env.example/README/Dockerfile + `src/pipeline/{__init__,settings,db,main,inngest_fns}.py` + `ingest/hn.py` + `tests/{conftest + 6 tests}.py` · `.github/workflows/pipeline-ci.yml` · `CLAUDE.md` §8. **0** app-table DDL · **0** app-code change · **0** new JS dependency · `apps/pipeline` stays OUT of pnpm/Turbo.

## Standing constraints (every task)
**Additive, no app-table touch** (migration `0005` = `CREATE TABLE raw_items` + indexes only; FR-007). **Dedup is a DB invariant** — `UNIQUE(content_hash)` + `INSERT … ON CONFLICT (content_hash) DO NOTHING`, never app check-then-insert (FR-004). **Stateless watermark `max(source_created_at) − B`**, B=24h, backfill=72h (OD-1; NOT strict `>max`). **asyncpg** (OD-2). **`apps/pipeline` outside pnpm/Turbo** — no `package.json` (FR-011). **Secrets via env**, keyless Algolia (FR-010). **Drizzle = single migration authority**; Python reads/writes only (Decision 2). **Two-project tax**: migration-apply is ONE command targeting BOTH dev + prod (T005/T023) so it can't be half-applied; the drift test catches drift on whichever DB it runs against. **No tag at 5.1.**

---

## Batch A — Schema + migration 0005 + the contract mechanism *(GATE-FREE)*

- [ ] **T001** [P] Create `packages/db/src/pipeline-schema.ts` — the Drizzle `raw_items` table per spec Decision 2: `id` uuid PK `gen_random_uuid()`; `source` text NN; `source_id` text NN; `content_hash` text NN **UNIQUE**; `title`/`body`/`url`/`author` text; `points`/`num_comments` integer; `source_created_at` timestamptz NN; `raw` jsonb NN; `ingested_at` timestamptz NN `now()`. Non-unique btrees `(source, source_created_at)` + `(source, source_id)`. Export `RawItem`/`NewRawItem` types. (FR-002/003/007)
- [ ] **T002** Wire `raw_items` into the Drizzle introspection surface so `drizzle-kit` sees it — re-export `pipeline-schema` from `packages/db/src/schema.ts` (or widen `drizzle.config.ts` `schema` to both files); confirm it does NOT alter any app table. (Decision 2)
- [ ] **T003** Generate the migration: `pnpm --filter @bristle/db db:generate` → `packages/db/drizzle/0005_*.sql` (+ `meta/_journal.json` entry). **`generate` needs no DB.** Hand-verify the SQL is `CREATE TABLE raw_items` + its indexes ONLY — zero diff to any existing table. (FR-007, SC-005)
- [ ] **T004** [P] Add the contract generator `packages/db/scripts/gen-contract.ts` + package script `db:contract` that serializes `raw_items`'s columns/types/nullability/constraints from the Drizzle schema → committed `packages/db/contracts/raw_items.contract.json`; run it and commit the artifact. This is the canonical reference both the live DB and the Python `RAW_ITEMS_COLUMNS` are checked against (TS↔Python seam; Decision 2).
- [ ] **T005** [P] Add the single dual-target apply command `packages/db/scripts/migrate-all.ts` + script `db:migrate:all` — reads `DATABASE_URL_DIRECT` (prod) **and** `DATABASE_URL_DIRECT_DEV`, applies the **0000–0005** chain to **both** so a migration can't be half-applied (the two-project tax). *Authoring is gate-free; first run is T023.* (Risk: two-project tax)
- [ ] **T006** **CHECKPOINT A (non-code gate)** — STOP for founder review: the `raw_items` shape (T001), the generated `0005` SQL is `CREATE TABLE` + indexes only (T003), and `raw_items.contract.json` (T004). **No database has been touched.** Do not start Batch B until reviewed.

## Batch B — Python package + ingester + tests *(GATE-FREE; tests on ephemeral `postgres:16`)*

- [ ] **T007** [P] uv scaffold in `apps/pipeline/`: `pyproject.toml` (runtime: `httpx`, `asyncpg`, `inngest`, `fastapi`, `uvicorn`; dev: `pytest`, `pytest-asyncio`, `ruff`), `uv.lock`, `.python-version` (3.12), `ruff.toml`, `.env.example` (DATABASE_URL + INNGEST_*), README update. **No `package.json`** — stays out of the JS workspace. (FR-011, OD-7)
- [ ] **T008** [P] `apps/pipeline/src/pipeline/settings.py` — env config: `DATABASE_URL`, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`, `LOOKBACK_HOURS=24` (B), `BACKFILL_HOURS=72`, `ALGOLIA_BASE="https://hn.algolia.com/api/v1"`. (OD-1, FR-010, Decision 5)
- [ ] **T009** `apps/pipeline/src/pipeline/db.py` — asyncpg pool from `DATABASE_URL`; the `RAW_ITEMS_COLUMNS` spec (Python's single source of truth, mirrors the contract); `upsert_items()` = `INSERT … ON CONFLICT (content_hash) DO NOTHING` with `RETURNING` to tally inserted vs skipped; `watermark()` = `SELECT max(source_created_at) WHERE source='hn'`. (FR-004/005, OD-2, Decision 4)
- [ ] **T010** `apps/pipeline/src/pipeline/ingest/hn.py` — keyless Algolia HN client (`httpx`); `content_hash()` pure fn = `sha256(norm(source|source_id|title|url|body))`, **excludes** volatile `points`/`num_comments`; windowed fetch with lower bound `watermark − B`, empty table → `now − BACKFILL_HOURS`; map hit → row; run-counters (fetched/inserted/skipped); 429/5xx bounded exponential backoff. (FR-002/008, Decision 4, OD-1)
- [ ] **T011** `apps/pipeline/src/pipeline/inngest_fns.py` — the scheduled Inngest function: cron `0 */4 * * *`, **`concurrency: 1`**, retries, `step`-bounded fetch/write; invokes the ingester. (FR-001, OD-3, Decision 4)
- [ ] **T012** `apps/pipeline/src/pipeline/main.py` — FastAPI app serving Inngest at `/api/inngest` (serve model) + a `/health` route. (FR-001, OD-3)
- [ ] **T013** `apps/pipeline/Dockerfile` (or `railway.toml`/Nixpacks) — uv build, start `uvicorn` serving `main.py`. (OD-3, Decision 5)
- [ ] **T014** [P] `apps/pipeline/tests/conftest.py` — ephemeral `postgres:16` fixture (CI service / local Docker) with migration `0005` applied; yields a pool. **No Supabase.** (OD-5)
- [ ] **T015** [P] `apps/pipeline/tests/test_content_hash.py` — the hash is **stable across a re-fetch** and **excludes** `points`/`num_comments` (changing them does not change the hash). (Decision 2/4)
- [ ] **T016** [P] **`apps/pipeline/tests/test_dedup.py` (GATE)** — ingest a fixed payload **twice** and **concurrently**; assert `count(*) == count(distinct content_hash)` and run-2 reports all-skipped. (FR-004, SC-003)
- [ ] **T017** [P] `apps/pipeline/tests/test_backfill.py` — empty table → fetch uses the `now − 72h` backfill window (no null crash); non-empty → `watermark − B`. (FR-005, OD-1, Decision 4)
- [ ] **T018** [P] **`apps/pipeline/tests/test_watermark_trap.py` (GATE)** — advance the watermark with a recent item; then feed (mocked Algolia) an item whose `created_at` is **older than max but within B** → assert **captured**. **Negative control**: an item older than `max − B` → assert **NOT captured** (documents B's boundary, justifying OD-1). (Decision 4 — the watermark trap)
- [ ] **T019** [P] `apps/pipeline/tests/test_backoff.py` — mocked **429** → retry/backoff, no crash, no duplicate row. (FR-008, SC-006)
- [ ] **T020** [P] **`apps/pipeline/tests/test_schema_contract.py` (GATE)** — the drift test: introspect live `information_schema.columns` + constraints for `raw_items` and assert **live == `raw_items.contract.json` == `RAW_ITEMS_COLUMNS`**. Fails on any divergence. (Decision 2 — TS↔Python enforcement)
- [ ] **T021** **CHECKPOINT B (non-code gate)** — STOP for founder review: the ingester logic + **all six tests green on ephemeral `postgres:16`** with no Supabase/Railway. Do not start Batch C until reviewed.

## Batch C — Apply to dev + integration + web re-point *(GATE: GATE-DEV-DB)*

- [ ] **T022** **GATE-DEV-DB** (founder, non-code) — confirm the **dev Supabase project** exists and its `DATABASE_URL_DEV` (pooler) + `DATABASE_URL_DIRECT_DEV` (5432) are recorded. No subsequent Batch-C task starts until this is true.
- [ ] **T023** Run `pnpm --filter @bristle/db db:migrate:all` → applies **0000–0005** to **dev AND prod** (T005). `raw_items` is created (empty) in both; additive, so prod is safe (the prod app doesn't read it until 5.5; the pipeline doesn't write prod until Batch D). (FR-007, two-project tax)
- [ ] **T024** Run the **drift test (T020) against dev** (and prod) — assert the live `raw_items` matches `raw_items.contract.json`. (Decision 2, SC-005)
- [ ] **T025** Re-seed the 15 fixtures into dev: `pnpm --filter @bristle/db db:seed` with the env pointed at the **dev** URL — **no new seed code** (the existing idempotent seed). (OD-4)
- [ ] **T026** Flip local `.env.local` `DATABASE_URL`/`DATABASE_URL_DIRECT` → **dev** values (gitignored — not committed); verify the **local web app reads dev**. Vercel prod env stays → prod; web-app code unchanged. (Decision 1, FR-006)
- [ ] **T027** **(GATE)** Verify **prod untouched**: run a dev ingest, confirm **only dev `raw_items` grows** and prod `raw_items` + the 15 fixtures + demo user are byte-for-byte unchanged. (SC-004, SC-005)
- [ ] **T028** Re-run **dedup (T016)** + **watermark-trap (T018)** as integration against the live **dev** Supabase. (SC-003)
- [ ] **T029** **CHECKPOINT C (non-code gate)** — STOP for founder review: dev populated correctly, prod untouched, local app on dev. Do not start Batch D until reviewed.

## Batch D — Deploy + autonomous DoD + CI + §8 *(GATES: GATE-RAILWAY + GATE-INNGEST)*

- [ ] **T030** **GATE-RAILWAY + GATE-INNGEST** (founder, non-code) — confirm the **Railway** service + secret store exist and **Inngest** signing/event keys (prod) are issued. No subsequent Batch-D task starts until both are true.
- [ ] **T031** Configure the Railway service (root `apps/pipeline`, uv build, start uvicorn) + secret store: **prod `DATABASE_URL`** (→ prod Supabase), `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`. (Decision 5, OD-3)
- [ ] **T032** Register/serve the Inngest function (serve model — Inngest Cloud holds the cron, triggers `/api/inngest` over HTTP, signing-key verified); **force one manual run** to verify wiring; confirm prod `raw_items` grows. (FR-001, OD-3)
- [ ] **T033** **(SLICE DoD GATE)** Confirm **autonomous** growth across **≥2 real cron ticks** (no manual trigger); run logs report `fetched/inserted/skipped`; assert `count(*) == count(distinct content_hash)` on prod. (SC-001, SC-002, SC-003)
- [ ] **T034** [P] Add `.github/workflows/pipeline-ci.yml` — `uv sync` + `ruff` + `pytest` against a `postgres:16` service (migration `0005` applied in `conftest.py`), **outside Turbo**. (OD-5, OD-7)
- [ ] **T035** [P] `CLAUDE.md` §8 note — the pipeline scaffold + `raw_items` + the 5 settled decisions recap; the **two-project tax** standing rule (migrations apply to both dev+prod via `db:migrate:all`; the drift test guards each); and the **OD-7 Python-dep principle**: the JS no-dep rule (hand-roll widgets) does NOT transfer to the Python runtime — you don't hand-roll a Postgres driver; the pipeline's dep discipline is standard/minimal/justified-per-need; `uv/pytest/ruff/httpx/inngest/asyncpg` are the sanctioned foundational floor, future pipeline deps (LLM SDK, embeddings client, HDBSCAN/numpy at 5.2–5.3) are each their own per-slice decision. (docs)
- [ ] **T036** **CHECKPOINT D (slice gate)** — STOP for founder review: DoD met (SC-001…SC-006 — autonomous, populating, no duplicates; dev isolated; prod untouched; resilient). **NO TAG** (Tier-5 release is the 5.10 capstone). Slice complete pending sign-off.

## Slice-integrity manifest
**NEW (committed)**: `packages/db/src/pipeline-schema.ts`, `drizzle/0005_*.sql` (+journal), `scripts/gen-contract.ts`, `contracts/raw_items.contract.json`, `scripts/migrate-all.ts` · `apps/pipeline/{pyproject.toml, uv.lock, .python-version, ruff.toml, .env.example, README, Dockerfile}` + `src/pipeline/{__init__,settings,db,main,inngest_fns}.py` + `ingest/hn.py` + `tests/{conftest,test_content_hash,test_dedup,test_backfill,test_watermark_trap,test_backoff,test_schema_contract}.py` · `.github/workflows/pipeline-ci.yml` · `CLAUDE.md` §8.
**EDIT (not committed / external)**: root `.env.local` (local → dev; gitignored) · Vercel prod env (stays prod; external) · Railway secret store (external).
**UNCHANGED**: `pnpm-workspace.yaml`, `turbo.json` (pipeline excluded; var names already present) · all app tables + 15 fixtures + demo user (prod) · web-app code (env-only re-point) · `packages/ui`, `packages/shared`, the `@bristle/ui` leaves · public/app routes. **No app-table DDL, no app-code change, no new JS dependency, no `package.json` in `apps/pipeline`.**

## Risks & follow-ups
- **Two-project tax (new standing rule)**: every future migration applies to **both** dev + prod via `db:migrate:all` (T005/T023); the drift test (T020/T024) catches a half-apply on whichever DB it runs. Documented in §8 (T035).
- **`B`=24h is an empirical guess** (OD-1): if Algolia indexing lag ever exceeds B a late item is skipped; the T018 negative control documents the boundary; a stored `ingest_state` cursor remains the deferred escape hatch (spec Decision 4).
- **Autonomous verification is wall-clock-bound** (T033): ≥2 ticks ≈ 8h real time; T032's forced run proves *wiring* immediately, true autonomy is observed over elapsed ticks.
- **Gated/founder-run**: Batches C–D run against live dev Supabase / Railway / Inngest — founder-executed (the sandbox can't reach Supabase). Batches A–B are sandbox/CI-verifiable (ephemeral PG + generated SQL).
- **No release tag at 5.1** — v0.5.0 lands at the Tier-5 capstone (5.10).
