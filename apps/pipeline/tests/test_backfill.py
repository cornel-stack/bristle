"""T017 — the watermark window: max(source_created_at) − B normally; a bounded
72h backfill when raw_items is empty (no null crash)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from pipeline.ingest import hn

NOW = datetime(2026, 6, 5, 12, 0, tzinfo=UTC)


def test_backfill_window_when_no_watermark():
    since = hn.compute_since(None, NOW, lookback_hours=24, backfill_hours=72)
    assert since == NOW - timedelta(hours=72)


def test_lookback_window_when_watermark_present():
    wm = NOW - timedelta(hours=1)
    since = hn.compute_since(wm, NOW, lookback_hours=24, backfill_hours=72)
    assert since == wm - timedelta(hours=24)


async def test_run_ingest_empty_table_uses_backfill(pool):
    # Empty raw_items → watermark None → fetch is called with the backfill lower
    # bound, never None.
    captured = {}

    async def fetch(since):
        captured["since"] = since
        return []

    await hn.run_ingest(pool, fetch, now=NOW, lookback_hours=24, backfill_hours=72)
    assert captured["since"] == NOW - timedelta(hours=72)


async def test_run_ingest_uses_lookback_after_first_rows(pool):
    # After ingesting an item at t0, the next run's window is t0 − B.
    t0 = NOW - timedelta(hours=2)
    seed = {
        "objectID": "seed",
        "title": "T",
        "url": "u",
        "created_at_i": int(t0.timestamp()),
        "points": 1,
        "num_comments": 0,
    }

    async def seed_fetch(_since):
        return [seed]

    await hn.run_ingest(pool, seed_fetch, now=NOW, lookback_hours=24, backfill_hours=72)

    captured = {}

    async def fetch(since):
        captured["since"] = since
        return []

    await hn.run_ingest(pool, fetch, now=NOW, lookback_hours=24, backfill_hours=72)
    assert captured["since"] == t0 - timedelta(hours=24)
