# apps/pipeline

Bristle's ingestion + synthesis service: **Python 3.12 + FastAPI**, orchestrated by
**Inngest**, deployed on **Railway**. Tier 5 of the build plan. Slice 5.1 ships the
foundation: a Hacker News ingester (keyless Algolia HN Search API) that runs every
4h and writes to `raw_items` with **DB-enforced content-hash dedup**.

**Outside the JS workspace by design.** No `package.json` — pnpm/Turborepo/ESLint
never see this directory (`pnpm-workspace.yaml` selects only `apps/web` + `packages/*`).
Tooling: **uv** (`pyproject.toml` + `uv.lock`), **ruff**, **pytest**.

The `raw_items` schema is **Drizzle-owned** (`packages/db`, migration `0005`); this
service reads/writes it via **asyncpg** and never defines schema (Decision 2). The
Python `RAW_ITEMS_COLUMNS` is checked against the committed
`packages/db/contracts/raw_items.contract.json` by the drift test.

## Layout

```
src/pipeline/
  settings.py       env + tunables (B=24h lookback, 72h backfill — OD-1)
  db.py             asyncpg pool, RAW_ITEMS_COLUMNS, upsert (ON CONFLICT DO NOTHING), watermark
  ingest/hn.py      Algolia client, content_hash, windowed fetch, counters, 429/5xx backoff
  inngest_fns.py    the scheduled function (cron 0 */4 * * *, concurrency:1, retries)
  main.py           FastAPI app serving /api/inngest + /health
tests/              content_hash · dedup · backfill · watermark_trap · backoff · schema_contract
```

## Develop

```sh
uv sync                                   # create .venv + uv.lock
uv run ruff check .                       # lint
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/pipeline_test \
  uv run pytest                           # tests against an EPHEMERAL postgres:16 (never Supabase)
```

The tests are **gate-free** — they run against a throwaway Postgres with migration
`0005` applied in `conftest.py`; no Supabase or Railway is required.
