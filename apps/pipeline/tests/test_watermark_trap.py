"""T018 — the watermark trap GATE (Decision 4). An item indexed late but WITHIN B
must be caught (not permanently skipped); a negative control past B− documents the
boundary. The fetch here faithfully simulates Algolia's `created_at_i >= since`
filter, so the window math is what's under test."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from pipeline.ingest import hn

NOW = datetime(2026, 6, 5, 12, 0, tzinfo=UTC)


def _hit(obj_id: str, created: datetime):
    return {
        "objectID": obj_id,
        "title": f"item {obj_id}",
        "url": f"https://x/{obj_id}",
        "author": "a",
        "created_at_i": int(created.timestamp()),
        "points": 1,
        "num_comments": 0,
    }


def _algolia_like(universe):
    # Mimics the real endpoint: returns only hits at/after the requested lower bound.
    async def fetch(since: datetime):
        return [h for h in universe if datetime.fromtimestamp(h["created_at_i"], tz=UTC) >= since]

    return fetch


async def _run(pool, universe):
    return await hn.run_ingest(
        pool, _algolia_like(universe), now=NOW, lookback_hours=24, backfill_hours=72
    )


async def test_late_item_within_B_is_captured(pool):
    t0 = NOW - timedelta(hours=1)  # the recent item → watermark advances to t0
    recent = _hit("recent", t0)
    await _run(pool, [recent])

    # An item created 5h before the watermark (WITHIN B=24h) — indexed late by HN.
    late = _hit("late", t0 - timedelta(hours=5))
    result = await _run(pool, [recent, late])

    # The window reaches back to t0 − 24h, so the late item is re-scanned + caught;
    # `recent` is re-seen but deduped.
    assert result["inserted"] == 1
    async with pool.acquire() as c:
        ids = {r["source_id"] for r in await c.fetch("SELECT source_id FROM raw_items")}
    assert ids == {"recent", "late"}


async def test_negative_control_past_B_minus_not_captured(pool):
    t0 = NOW - timedelta(hours=1)
    recent = _hit("recent", t0)
    await _run(pool, [recent])

    # An item OLDER than watermark − B (25h before t0): outside the window, so the
    # since-filter excludes it — it is NOT captured. This documents B's boundary.
    too_old = _hit("too_old", t0 - timedelta(hours=25))
    result = await _run(pool, [recent, too_old])

    assert result["inserted"] == 0  # recent deduped; too_old never entered the window
    async with pool.acquire() as c:
        ids = {r["source_id"] for r in await c.fetch("SELECT source_id FROM raw_items")}
    assert "too_old" not in ids
    assert ids == {"recent"}
