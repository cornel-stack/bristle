"""T019 — idempotent/incremental GATE (FR-004, SC-003). A re-run over fully-
processed data does 0 work (the NOT EXISTS pickup); a partial set processes only
the remainder. Mocked providers — no spend."""

from __future__ import annotations

import conftest

from pipeline import process


async def _run(pool, settings=None):
    return await process.run(
        pool,
        classify_fn=conftest.fixed_classify(label="bug"),
        embed_fn=conftest.fake_embed(),
        settings=settings or conftest.make_settings(),
    )


async def test_rerun_processes_nothing(pool):
    async with pool.acquire() as c:
        for i in range(3):
            await conftest.seed_raw_item(c, str(i))

    r1 = await _run(pool)
    assert r1["processed"] == 3 and r1["kept"] == 3

    r2 = await _run(pool)  # all already processed → NOT EXISTS returns none
    assert r2["processed"] == 0 and r2["kept"] == 0 and r2["dropped"] == 0
    assert r2["usd"] == 0.0  # spent nothing

    async with pool.acquire() as c:
        total = await c.fetchval("SELECT count(*) FROM processed_items")
    assert total == 3


async def test_only_the_remainder_is_processed(pool):
    async with pool.acquire() as c:
        a = await conftest.seed_raw_item(c, "a")
        await conftest.seed_raw_item(c, "b")
        # mark 'a' already processed
        await c.execute("INSERT INTO processed_items (raw_item_id, label) VALUES ($1,'noise')", a)

    r = await _run(pool)
    assert r["processed"] == 1  # only 'b'
    async with pool.acquire() as c:
        total = await c.fetchval("SELECT count(*) FROM processed_items")
    assert total == 2
