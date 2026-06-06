"""T019 — 429 / 5xx trigger the backoff path (FR-008, SC-006), and a persistent
failure surfaces (so Inngest retries the step). httpx.MockTransport drives the
status codes; sleep is faked so the test doesn't wait."""

from __future__ import annotations

from datetime import UTC, datetime

import httpx
import pytest

from pipeline.ingest import hn

SINCE = datetime(2026, 1, 1, tzinfo=UTC)
_OK = {"hits": [{"objectID": "1", "title": "T", "url": "u", "created_at_i": 1_700_000_000}]}


async def _noop_sleep(_d):
    pass


async def test_429_then_success_retries_with_backoff():
    calls = {"n": 0}
    slept = []

    def handler(_request):
        calls["n"] += 1
        return httpx.Response(429, json={}) if calls["n"] == 1 else httpx.Response(200, json=_OK)

    async def fake_sleep(d):
        slept.append(d)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://t") as c:
        hits = await hn.fetch_since(c, "http://t", SINCE, sleep=fake_sleep)

    assert calls["n"] == 2  # retried after the 429
    assert slept  # backoff slept at least once
    assert len(hits) == 1


async def test_5xx_then_success_retries():
    calls = {"n": 0}

    def handler(_request):
        calls["n"] += 1
        if calls["n"] <= 2:
            return httpx.Response(503, json={})
        return httpx.Response(200, json={"hits": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://t") as c:
        hits = await hn.fetch_since(c, "http://t", SINCE, sleep=_noop_sleep)

    assert calls["n"] == 3
    assert hits == []


async def test_persistent_429_raises_after_retries():
    def handler(_request):
        return httpx.Response(429, json={})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://t") as c:
        with pytest.raises(httpx.HTTPStatusError):
            await hn.fetch_since(c, "http://t", SINCE, sleep=_noop_sleep)
