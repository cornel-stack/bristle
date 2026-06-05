"""Hacker News ingester (keyless Algolia HN Search API). Pure helpers
(content_hash, compute_since, hit_to_row) are split from I/O (fetch_since,
run_ingest) so the correctness properties are unit-testable without the network."""

from __future__ import annotations

import asyncio
import hashlib
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from pipeline import db

# A fetch is: given a lower-bound timestamp, return the upstream hits at or after it.
FetchFn = Callable[[datetime], Awaitable[list[dict[str, Any]]]]

_FIELD_SEP = "\x1f"  # ASCII unit separator — unambiguous join delimiter


def content_hash(
    source: str,
    source_id: str,
    title: str | None,
    url: str | None,
    body: str | None,
) -> str:
    """THE dedup key (Decision 4). sha256 over normalized STABLE, identity-bearing
    fields ONLY: source | source_id | title | url | body. Matches the contract in
    packages/db/src/pipeline-schema.ts EXACTLY — it deliberately EXCLUDES volatile
    signals (points, num_comments) and all ingest metadata, so the same item
    re-fetched via the lookback overlap hashes identically and dedups.

    Normalization: each field stripped of surrounding whitespace, None → "",
    joined by the unit separator."""
    parts = [source, source_id, title or "", url or "", body or ""]
    canonical = _FIELD_SEP.join(p.strip() for p in parts)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def compute_since(
    watermark: datetime | None,
    now: datetime,
    lookback_hours: int,
    backfill_hours: int,
) -> datetime:
    """The stateless fetch lower bound (Decision 4). With a watermark: max −
    lookback B (NOT strict >max), so late/out-of-order items within B are
    re-scanned and caught. Empty table (no watermark): a bounded backfill window."""
    if watermark is None:
        return now - timedelta(hours=backfill_hours)
    return watermark - timedelta(hours=lookback_hours)


def hit_to_row(hit: dict[str, Any]) -> dict[str, Any]:
    """Map an Algolia HN hit to a raw_items row. Tolerant of missing fields (Ask HN
    has no url; link posts have no text) — the full payload is kept in `raw`."""
    title = hit.get("title") or hit.get("story_title")
    url = hit.get("url") or hit.get("story_url")
    body = hit.get("story_text") or hit.get("comment_text")
    source_id = str(hit["objectID"])
    created = datetime.fromtimestamp(int(hit["created_at_i"]), tz=UTC)
    return {
        "source": "hn",
        "source_id": source_id,
        "content_hash": content_hash("hn", source_id, title, url, body),
        "title": title,
        "body": body,
        "url": url,
        "author": hit.get("author"),
        "points": hit.get("points"),
        "num_comments": hit.get("num_comments"),
        "source_created_at": created,
        "raw": hit,
    }


async def _request_with_backoff(
    client: httpx.AsyncClient,
    url: str,
    params: dict[str, Any],
    *,
    sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    max_retries: int = 5,
    base_delay: float = 0.5,
) -> dict[str, Any]:
    """GET with bounded exponential backoff on 429 / 5xx (FR-008). Re-raises after
    max_retries so a persistent outage surfaces (and Inngest retries the step)."""
    for attempt in range(max_retries + 1):
        resp = await client.get(url, params=params)
        if resp.status_code == 429 or resp.status_code >= 500:
            if attempt == max_retries:
                resp.raise_for_status()
            await sleep(base_delay * (2**attempt))
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError("unreachable")  # pragma: no cover


async def fetch_since(
    client: httpx.AsyncClient,
    base: str,
    since: datetime,
    *,
    sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    tags: str = "story",
    hits_per_page: int = 1000,
    max_pages: int = 10,
) -> list[dict[str, Any]]:
    """Fetch HN items created at/after `since` from the Algolia HN endpoint,
    paginating. `search_by_date` + numericFilters gives newest-first by created_at."""
    url = f"{base.rstrip('/')}/search_by_date"
    since_unix = int(since.timestamp())
    hits: list[dict[str, Any]] = []
    for page in range(max_pages):
        payload = await _request_with_backoff(
            client,
            url,
            {
                "tags": tags,
                "numericFilters": f"created_at_i>={since_unix}",
                "hitsPerPage": hits_per_page,
                "page": page,
            },
            sleep=sleep,
        )
        page_hits = payload.get("hits", [])
        hits.extend(page_hits)
        if len(page_hits) < hits_per_page:
            break
    return hits


def default_fetch(base: str) -> FetchFn:
    """The production fetch: a fresh httpx client per run against the keyless HN API."""

    async def fetch(since: datetime) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            return await fetch_since(client, base, since)

    return fetch


async def run_ingest(
    pool: Any,
    fetch: FetchFn,
    *,
    now: datetime | None = None,
    source: str = "hn",
    lookback_hours: int,
    backfill_hours: int,
) -> dict[str, int]:
    """One ingest run: read the watermark, compute the window, fetch, map, upsert.
    Idempotent by construction — dedup is the DB invariant in db.upsert_items."""
    now = now or datetime.now(tz=UTC)
    async with pool.acquire() as conn:
        wm = await db.watermark(conn, source)
    since = compute_since(wm, now, lookback_hours, backfill_hours)
    hits = await fetch(since)
    rows = [hit_to_row(h) for h in hits]
    async with pool.acquire() as conn:
        inserted, skipped = await db.upsert_items(conn, rows)
    return {"fetched": len(rows), "inserted": inserted, "skipped": skipped}
