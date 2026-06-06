"""T023 — spend-ceiling GATE (FR-012, SC-006). A simulated spend over the daily $
ceiling halts the run GRACEFULLY (processes up to the breach, logs, exits — no
crash, no exception)."""

from __future__ import annotations

import conftest

from pipeline import cost, process


async def test_spend_over_ceiling_halts_gracefully(pool):
    async with pool.acquire() as c:
        for i in range(5):
            await conftest.seed_raw_item(c, str(i))

    # Per-item cost ~ estimate; set a ceiling that trips after ~2 items.
    est = cost.estimate_item_usd("title 0\n\nsome body text", "title 0\n\nsome body text")
    settings = conftest.make_settings(max_items_per_run=1000, daily_usd_ceiling=est * 2.5)

    # Must NOT raise — graceful halt.
    r = await process.run(
        pool,
        classify_fn=conftest.fixed_classify(label="bug"),
        embed_fn=conftest.fake_embed(),
        settings=settings,
    )

    assert r["halted"] is True
    assert r["halted_reason"] and "ceiling" in r["halted_reason"]
    assert 0 < r["processed"] < 5  # processed some, then stopped before the rest

    async with pool.acquire() as c:
        remaining = await c.fetchval(
            "SELECT count(*) FROM raw_items r WHERE NOT EXISTS "
            "(SELECT 1 FROM processed_items p WHERE p.raw_item_id = r.id)"
        )
    assert remaining > 0  # remainder left for the next run
