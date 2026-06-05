"""T016 — the dedup GATE (FR-004, SC-003). count(*) == count(distinct content_hash)
under a double run AND a concurrent run. Also documents the intended
points/num_comments freeze: a re-fetch keeps ONE row with first-fetch values."""

from __future__ import annotations

import asyncio

from pipeline.ingest import hn

HIT = {
    "objectID": "1",
    "title": "Stripe webhooks fail silently on Vercel cold starts",
    "url": "https://news.ycombinator.com/item?id=1",
    "author": "patio11",
    "created_at_i": 1_700_000_000,
    "points": 10,
    "num_comments": 3,
}


def _returns(hits):
    async def fetch(_since):
        return [dict(h) for h in hits]

    return fetch


async def _counts(pool):
    async with pool.acquire() as c:
        total = await c.fetchval("SELECT count(*) FROM raw_items")
        distinct = await c.fetchval("SELECT count(DISTINCT content_hash) FROM raw_items")
    return total, distinct


async def test_double_run_no_duplicates(pool):
    fetch = _returns([HIT])
    r1 = await hn.run_ingest(pool, fetch, lookback_hours=24, backfill_hours=72)
    r2 = await hn.run_ingest(pool, fetch, lookback_hours=24, backfill_hours=72)
    assert r1["inserted"] == 1
    assert r2["inserted"] == 0 and r2["skipped"] == 1
    total, distinct = await _counts(pool)
    assert total == distinct == 1


async def test_concurrent_run_no_duplicates(pool):
    # Two runs racing on the same item — the UNIQUE constraint (not app logic)
    # guarantees exactly one row.
    fetch = _returns([HIT])
    await asyncio.gather(
        hn.run_ingest(pool, fetch, lookback_hours=24, backfill_hours=72),
        hn.run_ingest(pool, fetch, lookback_hours=24, backfill_hours=72),
    )
    total, distinct = await _counts(pool)
    assert total == distinct == 1


async def test_points_freeze_first_fetch_wins(pool):
    # The intended freeze: content_hash excludes points/num_comments, so a re-fetch
    # with changed votes is the SAME row — ON CONFLICT DO NOTHING keeps the FIRST
    # values. A known, tested characteristic, not a latent surprise.
    first = {**HIT, "points": 10, "num_comments": 3}
    later = {**HIT, "points": 999, "num_comments": 888}
    await hn.run_ingest(pool, _returns([first]), lookback_hours=24, backfill_hours=72)
    await hn.run_ingest(pool, _returns([later]), lookback_hours=24, backfill_hours=72)
    async with pool.acquire() as c:
        rows = await c.fetch("SELECT points, num_comments FROM raw_items")
    assert len(rows) == 1
    assert rows[0]["points"] == 10 and rows[0]["num_comments"] == 3  # frozen at first fetch
