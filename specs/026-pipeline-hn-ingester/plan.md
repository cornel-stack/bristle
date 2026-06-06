# Implementation Plan: Python Pipeline Scaffold + HN Ingester — Slice 5.1 (Tier-5 foundation)

**Branch**: `026-pipeline-hn-ingester` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT until green-lit.** Step-wise gating (same as the spec): **per-batch checkpoints, NOT self-run-to-close** — implementation stops at each batch boundary for review. Three founder-provisioned prerequisites are explicit **GATES**; a batch that needs a resource cannot start before it exists. This plan is the *design* and can be written/reviewed now, in parallel with provisioning. **No `/speckit.tasks`, no code until the founder says go.** This is slice **5.1 of 10** in Tier 5 — **no release tag here**; v0.5.0 lands at Tier-5 completion (5.10).

## Summary

Stand up `apps/pipeline/` (Python 3.12 + FastAPI + Inngest, deployed on Railway) and ship one autonomous job: a Hacker News ingester that, every 4h, pulls recent items from the keyless Algolia HN Search API and writes them to a new `raw_items` table with **DB-enforced** content-hash dedup. The schema is added as **Drizzle migration `0005`** (additive, single `UNIQUE(content_hash)`, **no app table touched**); Python treats the table as given. Dedup correctness is a Postgres invariant (`ON CONFLICT (content_hash) DO NOTHING`), not app logic; the **stateless watermark `max(source_created_at) − B`** (B wider than Algolia's indexing lag) re-scans the overlap each run so late/out-of-order items are caught, dedup absorbing the re-scan. Dev/prod are split at the **Supabase-project** level so a dev run can never pollute the prod fixtures.

## Constitution Check

- **Locked stack** (§3): Python 3.12, FastAPI, Inngest, Railway, Supabase Postgres + pgvector, Drizzle — all used as specified; **no alternatives introduced**. **PASS.**
- **"All DB access through Drizzle" (§3/§5)** governs the **web app**; the Python pipeline is a separate service that cannot use Drizzle, so it reads/writes via a Python driver. The **schema stays Drizzle-owned** (single migration history); this is the documented nuance, not a violation. **PASS (noted).**
- **Sanctioned additions** (not new *product* deps, but new tooling for the Python service): **uv** (package manager), **pytest** + **ruff** (the Python analogues of the §3 Vitest/Playwright + ESLint — there is no Python equivalent in the stack yet; flagged for confirmation, not assumed). **httpx** (HTTP client), an async Postgres driver (Decision OD-2), the **inngest** Python SDK. All live *inside* `apps/pipeline`, never in the JS workspace. **CONFIRM in OD-7.**
- **Workspace hygiene** (§8): `apps/pipeline` stays **out** of pnpm/Turbo (no `package.json`); `pnpm-workspace.yaml` + `turbo.json` are **unchanged**. **PASS.**
- **Additive schema, no app-table touch** (spec FR-007): migration `0005` is `CREATE TABLE raw_items` + indexes only. **PASS.**
- **Secrets via env** (§5, spec FR-010): Railway store + gitignored `apps/pipeline/.env`; nothing committed; keyless Algolia. **PASS.**
- **Voice** (§6): no product microcopy ships in this slice (operator logs only) — dry, factual log lines. **PASS.**

## Provisioning gates (the sequence backbone — emphasis 1)

Three prerequisites only the founder can create. Each is a hard gate; tasks are ordered so **nothing runs before its resource exists**. Crucially, **the bulk of design + build is gate-free** (authoring schema/SQL, writing the Python package, and unit/integration tests against an **ephemeral local/CI Postgres**) — so Batches A–B proceed in parallel with provisioning, and only the *apply/deploy* batches block.

| Gate | Resource (founder-provisioned) | Unblocks | Blocks until present |
|---|---|---|---|
| **GATE-DEV-DB** | A **second Supabase project** = dev, with its `DATABASE_URL` (pooler) + `DATABASE_URL_DIRECT` (5432) | Applying the **0000–0005** chain to dev, the **fixture re-seed**, the **two-URL wiring**, the **web-app re-point**, and live-dev integration tests | Batch C |
| **GATE-RAILWAY** | A **Railway** service for `apps/pipeline` + secret store | The **deploy** + the autonomous-on-Railway verification | Batch D |
| **GATE-INNGEST** | **Inngest** account + signing key + event key (prod) | Registering/serving the **cron**, the autonomous-schedule verification | Batch D |

> Gate-free fallback that keeps CI honest without the gates: tests run against an **ephemeral Postgres** (a CI `postgres:16` service / local Docker), to which migration `0005` is applied in-test. So dedup/watermark/drift tests are **green before any Supabase or Railway exists** — the gates are needed only for the *live-environment* acceptance, not for proving the logic.

## Architecture

### A. The schema + migration (Drizzle-owned, gate-free to author)
`raw_items` is defined in a **new pipeline-namespaced Drizzle module** in `packages/db` (e.g. `src/pipeline-schema.ts`, kept separate from the app's `schema.ts`), and `drizzle-kit generate` emits **`0005_*.sql`** (`generate` diffs the snapshot — **needs no DB**, so authoring + review happen before GATE-DEV-DB). Shape + constraints exactly as the spec's Decision 2: `id`, `source`, `source_id`, `content_hash` **UNIQUE**, `title`, `body`, `url`, `author`, `points`, `num_comments`, `source_created_at`, `raw` jsonb, `ingested_at`; plus non-unique btrees `(source, source_created_at)` and `(source, source_id)`. Applying `0005` to a database is a **separate, gated** step (Batch C for dev; Batch D for prod).

### B. The TS↔Python schema contract (the one unenforced seam — emphasis 2)
Decision 2 left "Python stays in sync with the Drizzle schema" unenforced. The plan makes it a **named, failing mechanism — the `raw_items` drift test** — with a single shared reference:

1. **One committed contract artifact**: `packages/db/contracts/raw_items.contract.json` — the canonical column/constraint snapshot, **generated from the Drizzle schema** by a tiny script (`db:contract`), checked in, and reviewed in PRs. (Drizzle schema is the source of truth → the artifact is its serialization.)
2. **Python has one internal source of truth**: a `RAW_ITEMS_COLUMNS` spec (a frozen dataclass/dict) in `apps/pipeline/src/pipeline/db.py` that the insert path uses.
3. **The drift test** (`apps/pipeline/tests/test_schema_contract.py`) does two assertions:
   - **Live vs intended**: introspect `information_schema.columns` + `pg_constraints` for `raw_items` on the connected DB and assert it equals the committed `raw_items.contract.json` (catches a migration not applied / a hand-edit / DB drift).
   - **Python vs intended**: assert `RAW_ITEMS_COLUMNS` equals the committed artifact (catches Python diverging from the Drizzle schema **without needing a live DB**).
   Either mismatch **fails CI**. This ties Drizzle → artifact → {live DB, Python} in one loop.

   *Why this over the alternatives:* generated Python types (option b) add a cross-language codegen build step; a bare checked-in snapshot (option a) doesn't *fail* on drift unless something compares it — the test **is** the comparison. Recommended; the lighter variant (introspection-test only, Python constant as the expected) is the fallback if the `db:contract` generator is judged over-built.

### C. The Python package (gate-free to author + unit-test)
`apps/pipeline/` (uv, Python 3.12, **out of the JS workspace**):
```
apps/pipeline/
  pyproject.toml  uv.lock  .python-version (3.12)  ruff.toml  README.md
  .env.example                      # documents DATABASE_URL + INNGEST_* ; real .env is gitignored
  Dockerfile (or railway.toml/Nixpacks)
  src/pipeline/
    __init__.py
    settings.py                     # env: DATABASE_URL, INNGEST_*, B, BACKFILL_WINDOW, ALGOLIA_BASE
    db.py                           # async pool; RAW_ITEMS_COLUMNS; upsert(); watermark(); max(source_created_at)
    ingest/hn.py                    # Algolia client (httpx), windowed fetch, content_hash(), run-counters
    inngest_fns.py                  # the scheduled function (cron, concurrency:1, retries, steps)
    main.py                         # FastAPI app serving the Inngest endpoint (/api/inngest) + /health
  tests/
    test_content_hash.py            # pure-fn: stable across re-fetch; volatile fields excluded
    test_dedup.py                   # double-run + concurrent-run → count(*)==count(distinct content_hash)
    test_watermark_trap.py          # late/out-of-order item caught (see D)
    test_backfill.py                # empty table → backfill window, no null crash
    test_backoff.py                 # mocked 429 → retry/backoff, no crash, no dup
    test_schema_contract.py         # the drift test (B above)
    conftest.py                     # spins up / connects an ephemeral Postgres, applies 0005
```

### D. Idempotency + watermark as concrete mechanisms (emphasis 3)
- **Dedup (DB invariant):** `content_hash = sha256(norm(source|source_id|title|url|body))` (a pure Python fn excluding volatile `points`/`num_comments`); write path is `INSERT … ON CONFLICT (content_hash) DO NOTHING` with `RETURNING` to tally **inserted vs skipped**. → **`test_dedup.py`**: ingest a fixed payload twice and concurrently; assert `count(*) == count(distinct content_hash)` and run-2 reports all-skipped.
- **Watermark (`max − B`, stateless):** `watermark = max(source_created_at) WHERE source='hn'`; fetch lower bound = `watermark − B`; **empty table → backfill window** (`now − BACKFILL_WINDOW`), never a null-driven crash. → **`test_backfill.py`**.
- **The watermark trap → a verifiable test** (the headline correctness test): **`test_watermark_trap.py`** — seed `raw_items` with a recent item so the watermark advances; then feed the ingester (mocked Algolia response) an item whose `created_at` is **older than the watermark but within B**; run ingest; **assert the late item IS captured**. Negative control: an item older than `watermark − B` is *not* captured (documents B's boundary, justifying OD-1's value). This converts the spec's "watermark trap" edge case from prose into a regression test.
- **Orchestrator (Inngest):** `inngest_fns.py` declares the scheduled function — cron `0 */4 * * *`, **`concurrency: 1`** (no overlap), **retries** + **step** boundaries around fetch/write so a mid-run crash resumes/idempotently re-runs. Even with all orchestration disabled, the DB unique constraint still guarantees no duplicates (defense in depth).

### E. Dev/prod split + web-app re-point (gated: GATE-DEV-DB)
- Apply the full **0000–0005** chain to the **dev** Supabase (`DATABASE_URL_DIRECT` → dev), run the **drift test** against it, then **re-seed the 15 fixtures** with the existing idempotent `pnpm --filter @bristle/db db:seed` pointed at dev (**no new seed code** — env swap only; OD-4).
- **Re-point local dev to dev**: the root `.env.local` `DATABASE_URL`/`DATABASE_URL_DIRECT` switch to dev values (gitignored — not a committed change). **Vercel prod env stays → prod**; `turbo.json` build.env is unchanged (same var *names*, env-specific *values*). Web-app **code is unchanged** — this is purely env + a dev re-seed. Verify the local app reads dev and **prod is byte-for-byte untouched** (SC-004/SC-005).
- **Standing operational consequence**: from now on, **migrations apply to BOTH dev and prod**. Surfaced in Risks.

### F. Deploy + autonomous verification (gated: GATE-RAILWAY + GATE-INNGEST)
- Railway service rooted at `apps/pipeline` (uv build; start = serve FastAPI/Inngest endpoint); secret store holds **prod `DATABASE_URL`** (→ prod Supabase) + **Inngest signing/event keys**.
- Register the function with **Inngest** (serve model: Inngest triggers the cron → HTTP to the Railway-hosted `/api/inngest`; OD-3). Force one run to verify wiring, then confirm **autonomous** growth across **≥2 real ticks** (wall-clock-bound — see Process oddities) with logs reporting `fetched/inserted/skipped`.
- Wire the **standalone Python CI** job (`.github/workflows/pipeline-ci.yml`: uv sync + ruff + pytest against a `postgres:16` service) — **outside** Turbo (OD-7).

## Batching (per-batch checkpoints — STOP for review at each boundary; emphasis 4)

> One commit per task; **at each checkpoint, implementation halts and waits for founder review** before the next batch. Batches A and B are **gate-free** (no provisioned resource required); C and D are **gated**.

- **Batch A — Schema + migration 0005 + the contract mechanism** *(gate-free)*.
  Drizzle `raw_items` module; `drizzle-kit generate` → `0005_*.sql` (review the SQL before it ever runs); the `db:contract` generator + committed `raw_items.contract.json`; the drift-test skeleton.
  **Checkpoint A**: review the `raw_items` shape, the generated `0005` SQL, and the contract artifact. *No DB has been touched.* — STOP.

- **Batch B — Python package + the ingester + the test suite** *(gate-free; tests run on an ephemeral Postgres)*.
  uv scaffold; `settings.py`/`db.py` (driver, upsert, watermark, `RAW_ITEMS_COLUMNS`); `ingest/hn.py` (Algolia client, windowed fetch, `content_hash`, counters, 429 backoff); `inngest_fns.py` + `main.py`; the six tests (content-hash, dedup, **watermark-trap**, backfill, backoff, drift) green against the ephemeral PG.
  **Checkpoint B**: review the ingester logic + **all tests passing locally/CI without any Supabase/Railway**. — STOP.

- **Batch C — Apply to dev + integration + web re-point** *(GATE-DEV-DB)*.
  Apply 0000–0005 to dev; drift test green against dev; re-seed fixtures to dev; flip local `.env.local` → dev; verify app reads dev and **prod untouched**; re-run the dedup/watermark tests as integration against dev.
  **Checkpoint C**: review dev populated, prod untouched, app on dev. — STOP.

- **Batch D — Deploy + autonomous DoD verification + CI** *(GATE-RAILWAY + GATE-INNGEST)*.
  Railway deploy + secrets; Inngest serve + cron; force-run then confirm autonomous growth across ≥2 ticks; logs show counts; `count(*)==count(distinct content_hash)` on prod; wire `pipeline-ci.yml`; CLAUDE.md §8 note.
  **Checkpoint D (slice gate)**: DoD met — autonomous, populating, no duplicates (SC-001…SC-006). **No tag** (Tier-5 release is 5.10). — STOP.

## Open decisions the plan forces (each with a recommendation — emphasis 4)

- **OD-1 — Value of `B` (lookback buffer) + backfill window.** Algolia HN indexing lag is typically seconds–minutes but not contractually bounded. **Recommend `B = 24h`** (re-scanning a day every 4h is free under dedup and absorbs a missed run or two), **`BACKFILL_WINDOW = 72h`** for the empty-table first run. Tunable constants in `settings.py`. *Confirm.*
- **OD-2 — Postgres driver: asyncpg vs psycopg3.** **Recommend `asyncpg`** — async-native, pairs with the async FastAPI/Inngest handler, first-class `executemany`/`ON CONFLICT`. *Alternative:* `psycopg3` (sync+async, fewer footguns) if you'd rather one driver for ad-hoc sync scripts too. *Confirm.*
- **OD-3 — Inngest invocation on Railway.** **Recommend the standard serve model**: FastAPI exposes `/api/inngest`; Inngest Cloud holds the cron and triggers it over HTTP (signing-key verified). *Alternative:* Inngest self-hosted/dev-server for local only. *Confirm prod = Inngest Cloud.*
- **OD-4 — Dev fixture re-seed trigger.** **Recommend reusing the existing idempotent `db:seed`** against the dev URL (no new code). *Confirm.*
- **OD-5 — Ephemeral-Postgres test substrate.** **Recommend a CI `postgres:16` service** (+ local Docker for devs) with `0005` applied in `conftest.py`, so logic tests are gate-free. *Alternative:* `testcontainers`-python. *Confirm.*
- **OD-6 — pgvector now or later.** raw_items needs **no** vector column in 5.1 (embeddings are 5.2). **Recommend: do not add pgvector usage here**; just confirm the extension exists on dev (already on prod). *Confirm.*
- **OD-7 — Python CI + tooling sanction.** **Recommend a standalone `pipeline-ci.yml` (uv + ruff + pytest), outside Turbo**, and sanction uv/pytest/ruff/httpx/inngest/asyncpg as `apps/pipeline`-local additions (the constitution names no Python tooling yet). *Confirm the sanction.*

## Slice-integrity manifest

- **NEW (committed)**:
  - `packages/db/src/pipeline-schema.ts` (raw_items) · `packages/db/drizzle/0005_*.sql` (+ `meta` journal entry) · `packages/db/contracts/raw_items.contract.json` + a `db:contract` generator script.
  - `apps/pipeline/**` — `pyproject.toml`, `uv.lock`, `.python-version`, `ruff.toml`, `.env.example`, Dockerfile/railway config, `src/pipeline/**`, `tests/**`, README update.
  - `.github/workflows/pipeline-ci.yml`.
  - `CLAUDE.md` §8 note + the SPECKIT plan pointer.
- **EDIT (not committed / external)**: root `.env.local` (local → **dev** values; gitignored) · Vercel prod env (stays **prod**; external) · Railway secret store (external).
- **UNCHANGED**: `pnpm-workspace.yaml`, `turbo.json` (pipeline stays excluded; var names already present) · **all app tables + the 15 fixtures + demo user** (prod) · **web-app code** (env-only re-point) · `packages/ui`, `packages/shared` · the `@bristle/ui` leaves · all public/app routes. **No app-table DDL, no app-code change, no new JS dependency.**

## Risks & follow-ups

- **Two-project operational tax (new standing rule):** every future migration now applies to **both** dev and prod Supabase. Cheap but must not be forgotten — document in §8.
- **`B` is an empirical guess** (OD-1): if Algolia lag ever exceeds `B`, a late item is skipped. 24h is generous; the negative-control test documents the boundary; revisit if observed lag grows. *(A stored cursor / `ingest_state` table remains the deferred escape hatch from spec Decision 4.)*
- **Autonomous verification is wall-clock-bound:** "grows across ≥2 ticks" needs ~8h real time. A forced manual trigger verifies *wiring* immediately; true autonomy is confirmed over elapsed ticks (Process oddities).
- **The TS↔Python seam** is guarded by the drift test, not codegen; if the team later wants generated Python models, that's a follow-up (the contract artifact already exists to generate from).
- **Sandbox cannot reach Supabase** (project memory): all gated steps (dev apply, dev integration, Railway deploy) are **founder-run**; the sandbox proves only the gate-free logic (ephemeral-PG tests, generated SQL).
- **No release tag at 5.1** — v0.5.0 is the Tier-5 capstone (5.10).

## Process oddities

- **Gate-free vs gated split is the whole point:** Batches A–B (design + logic + tests on ephemeral PG) are verifiable **in CI/sandbox without any provisioning**; Batches C–D are **founder-run** behind GATE-DEV-DB / GATE-RAILWAY / GATE-INNGEST. The plan is reviewable now; execution waits on gates + go.
- **DoD evidence** is split: *no-duplicates* + *watermark-trap* + *populating* are proven by **pytest on ephemeral PG** (gate-free) and re-confirmed on dev (Batch C); *autonomous on the real cron* is **founder-observed on Railway** across real ticks (Batch D).
- **HTTPS-token push** (SSH agent unavailable in-sandbox), as in prior slices.
