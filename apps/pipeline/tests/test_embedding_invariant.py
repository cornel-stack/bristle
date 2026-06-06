"""T021 — embedding invariant (FR-002, SC-002). Every KEPT row has a 1536-vector;
every dropped (noise, not forced) row has none; a forced-keep noise item embeds."""

from __future__ import annotations

import conftest

from pipeline import process


async def _process_one(pool, classify_fn):
    return await process.run(
        pool,
        classify_fn=classify_fn,
        embed_fn=conftest.fake_embed(),
        settings=conftest.make_settings(),
    )


async def test_kept_has_embedding_noise_has_none(pool):
    async with pool.acquire() as c:
        await conftest.seed_raw_item(c, "keep")  # → bug
        await conftest.seed_raw_item(c, "drop")  # → noise

    # Process the 'keep' item as bug, the 'drop' item as confident noise.
    async def classify_fn(item):
        from pipeline.classify import Verdict

        if item["source_id"] == "drop":
            return Verdict(label="noise", reason="r", confidence=0.95, forced_keep=False)
        return Verdict(label="bug", reason="r", confidence=0.9, forced_keep=False)

    r = await _process_one(pool, classify_fn)
    assert r["kept"] == 1 and r["dropped"] == 1

    async with pool.acquire() as c:
        rows = await c.fetch(
            "SELECT label, kept, embedding IS NOT NULL AS has_emb FROM processed_items "
            "JOIN raw_items ON raw_items.id = processed_items.raw_item_id ORDER BY source_id"
        )
    by = {("keep" if r["label"] != "noise" else "drop"): r for r in rows}
    assert by["keep"]["kept"] is True and by["keep"]["has_emb"] is True
    assert by["drop"]["kept"] is False and by["drop"]["has_emb"] is False


async def test_forced_keep_noise_still_embeds(pool):
    async with pool.acquire() as c:
        await conftest.seed_raw_item(c, "1")

    # A low-confidence noise that was forced-keep → KEPT → must embed.
    classify_fn = conftest.fixed_classify(label="noise", confidence=0.2, forced_keep=True)
    r = await _process_one(pool, classify_fn)
    assert r["kept"] == 1 and r["dropped"] == 0

    async with pool.acquire() as c:
        row = await c.fetchrow(
            "SELECT label, forced_keep, kept, embedding IS NOT NULL AS has_emb FROM processed_items"
        )
    assert row["label"] == "noise" and row["forced_keep"] is True
    assert row["kept"] is True and row["has_emb"] is True
