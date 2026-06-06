"""T022 — cost cap GATE (FR-012, SC-006). A backlog larger than MAX_ITEMS_PER_RUN
processes exactly the cap; the remainder is left for the next run."""

from __future__ import annotations

import conftest

from pipeline import process


async def test_backlog_over_cap_processes_exactly_cap(pool):
    async with pool.acquire() as c:
        for i in range(5):
            await conftest.seed_raw_item(c, str(i))

    settings = conftest.make_settings(max_items_per_run=2)  # cap below the backlog
    r = await process.run(
        pool,
        classify_fn=conftest.fixed_classify(label="bug"),
        embed_fn=conftest.fake_embed(),
        settings=settings,
    )
    assert r["processed"] == 2  # exactly the cap, not all 5

    async with pool.acquire() as c:
        done = await c.fetchval("SELECT count(*) FROM processed_items")
        remaining = await c.fetchval(
            "SELECT count(*) FROM raw_items r WHERE NOT EXISTS "
            "(SELECT 1 FROM processed_items p WHERE p.raw_item_id = r.id)"
        )
    assert done == 2 and remaining == 3  # the rest await the next run
