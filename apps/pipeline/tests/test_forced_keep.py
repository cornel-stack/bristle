"""T024 — forced-keep end-to-end (FR-011). A sub-threshold noise verdict is forced
to keep: it embeds, `forced_keep` + `confidence` are stored, and `kept` is true."""

from __future__ import annotations

import conftest

from pipeline import process


async def test_forced_keep_persists_and_keeps(pool):
    async with pool.acquire() as c:
        await conftest.seed_raw_item(c, "1")

    # The classifier overrode a low-confidence 'noise' to keep (forced_keep=True).
    r = await process.run(
        pool,
        classify_fn=conftest.fixed_classify(label="noise", confidence=0.2, forced_keep=True),
        embed_fn=conftest.fake_embed(),
        settings=conftest.make_settings(),
    )
    assert r["kept"] == 1 and r["dropped"] == 0

    async with pool.acquire() as c:
        row = await c.fetchrow(
            "SELECT label, forced_keep, kept, confidence, embedding IS NOT NULL AS has_emb "
            "FROM processed_items"
        )
    assert row["label"] == "noise"
    assert row["forced_keep"] is True
    assert row["kept"] is True  # the generated column saved it from being dropped
    assert abs(row["confidence"] - 0.2) < 1e-6  # stored (real) for 5.10 to revisit
    assert row["has_emb"] is True
