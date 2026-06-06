"""T020 — atomicity GATE (FR-006, SC-005). A partial failure (embed fails after
classify) leaves the item UNPROCESSED (no row) → retried; concurrent processing
of the SAME raw_item yields exactly one row via ON CONFLICT, no error."""

from __future__ import annotations

import asyncio

import conftest

from pipeline import db, process


async def test_embed_failure_leaves_item_unprocessed(pool):
    async with pool.acquire() as c:
        rid = await conftest.seed_raw_item(c, "1")

    async def boom_embed(_item):
        raise RuntimeError("embedding provider down")

    # A kept item whose embed fails → no row written, never half-written.
    r = await process.run(
        pool,
        classify_fn=conftest.fixed_classify(label="bug"),  # kept → tries to embed
        embed_fn=boom_embed,
        settings=conftest.make_settings(),
    )
    assert r["processed"] == 0 and r["errored"] == 1

    async with pool.acquire() as c:
        rows = await c.fetchval("SELECT count(*) FROM processed_items WHERE raw_item_id=$1", rid)
    assert rows == 0  # NOT half-written

    # Next run (provider healthy) processes it — proof it was retried, not lost.
    r2 = await process.run(
        pool,
        classify_fn=conftest.fixed_classify(label="bug"),
        embed_fn=conftest.fake_embed(),
        settings=conftest.make_settings(),
    )
    assert r2["processed"] == 1


async def test_concurrent_same_item_yields_exactly_one_row(pool):
    # Two atomic inserts of the SAME raw_item racing → exactly one row, no error
    # (the ON CONFLICT (raw_item_id) path; pairs with the processor's concurrency:1).
    async with pool.acquire() as c:
        rid = await conftest.seed_raw_item(c, "1")

    async def insert_once():
        async with pool.acquire() as conn:
            return await db.insert_processed(
                conn, {"raw_item_id": rid, "label": "bug", "embedding": [0.01] * 1536}
            )

    results = await asyncio.gather(insert_once(), insert_once(), insert_once())
    assert sum(results) == 1  # exactly one INSERT won; the others were no-ops

    async with pool.acquire() as c:
        total = await c.fetchval("SELECT count(*) FROM processed_items WHERE raw_item_id=$1", rid)
    assert total == 1
