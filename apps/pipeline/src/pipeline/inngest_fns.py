"""The Inngest orchestration (Decision 4, OD-3). The scheduled HN ingest: cron
every 4h, concurrency 1 (no overlap), retries. Even with all orchestration
disabled, the DB UNIQUE(content_hash) still prevents duplicates — defense in
depth. Served over FastAPI in main.py (Inngest Cloud holds the cron, triggers the
Railway-hosted endpoint over HTTP)."""

from __future__ import annotations

import os

import inngest

from pipeline import db, process
from pipeline.ingest import hn
from pipeline.settings import load_settings

# Production mode iff a signing key is present (Railway secret store; Decision 5).
# Without one — local dev, CI, the Batch-B tests — the client runs in dev mode, so
# serving needs no key. Signing/event keys are read from the environment, never
# passed in code.
inngest_client = inngest.Inngest(
    app_id="bristle-pipeline",
    is_production=bool(os.environ.get("INNGEST_SIGNING_KEY")),
)


@inngest_client.create_function(
    fn_id="hn-ingest",
    name="Hacker News ingest",
    trigger=inngest.TriggerCron(cron="0 */4 * * *"),
    # concurrency:1 → two runs never overlap (Decision 4). Retries let a transient
    # failure (e.g. Algolia 5xx surviving backoff) re-run the step; dedup makes the
    # re-run safe.
    concurrency=[inngest.Concurrency(limit=1)],
    retries=3,
)
async def hn_ingest(ctx: inngest.Context) -> dict[str, int]:
    # Inngest (Python SDK) invokes the handler with a SINGLE context argument and
    # exposes steps as `ctx.step` — there is NO separate `step` parameter. (A
    # two-arg `(ctx, step)` handler registers fine but fails at dispatch with
    # "missing 1 required positional argument: 'step'", which is what broke the
    # first Cloud invocation.) This is a cron trigger, so there is no event payload
    # to read. We don't use steps here; if we did it would be `await ctx.step.run(...)`.
    settings = load_settings()
    pool = await db.create_pool(settings.database_url)
    try:
        result = await hn.run_ingest(
            pool,
            hn.default_fetch(settings.algolia_base),
            lookback_hours=settings.lookback_hours,
            backfill_hours=settings.backfill_hours,
        )
        ctx.logger.info(
            "hn-ingest fetched=%(fetched)s inserted=%(inserted)s skipped=%(skipped)s",
            result,
        )
        return result
    finally:
        await pool.close()


@inngest_client.create_function(
    fn_id="process-items",
    name="Classify + embed raw items",
    # 30 min after the ingester (every 4h) so it picks up what was just fetched —
    # but DECOUPLED (no event-chaining): a stateless NOT EXISTS pickup (Decision 4).
    trigger=inngest.TriggerCron(cron="30 */4 * * *"),
    # concurrency:1 (like the ingester) → processor runs never overlap; the atomic
    # ON CONFLICT (raw_item_id) is the deeper guarantee. Retries re-run safely
    # (idempotent — a retry re-picks only still-unprocessed items).
    concurrency=[inngest.Concurrency(limit=1)],
    retries=3,
)
async def process_items(ctx: inngest.Context) -> dict[str, object]:
    settings = load_settings()
    classify_fn, embed_fn = process.build_provider_fns(settings)
    pool = await db.create_pool(settings.database_url)
    try:
        result = await process.run(
            pool, classify_fn=classify_fn, embed_fn=embed_fn, settings=settings
        )
        ctx.logger.info("process-items %s", result)
        return result
    finally:
        await pool.close()
