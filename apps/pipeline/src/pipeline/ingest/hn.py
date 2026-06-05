"""Hacker News ingester (keyless Algolia HN Search API). Pure helpers
(content_hash, compute_since, hit_to_row) are split from I/O (fetch_since,
run_ingest) so the correctness properties are unit-testable without the network."""

from __future__ import annotations

import asyncio
import hashlib
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from pipeline import db

logger = logging.getLogger(__name__)

# A fetch is: given a lower-bound timestamp, return the upstream hits at or after it.
FetchFn = Callable[[datetime], Awaitable[list[dict[str, Any]]]]

# hn.algolia.com caps RETRIEVABLE results per query at ~1000 (paginationLimitedTo):
# beyond this, pages return nothing. search_by_date is newest-first, so paging an
# over-cap window would silently drop the OLDEST items in it. We subdivide the
# [since, now] window by created_at_i until each sub-range is under the cap, then
# paginate within it — so the full window is covered regardless of volume.
ALGOLIA_PAGINATION_CAP = 1000

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


async def _fetch_page(
    client: httpx.AsyncClient,
    url: str,
    *,
    lo: int,
    hi: int,
    page: int,
    tags: str,
    hits_per_page: int,
    sleep: Callable[[float], Awaitable[None]],
) -> dict[str, Any]:
    # Half-open range [lo, hi): created_at_i>=lo AND created_at_i<hi. An item at
    # exactly a sub-range boundary belongs to exactly ONE side, so ties at a seam
    # are never dropped or double-counted (HN timestamps are second-granular).
    return await _request_with_backoff(
        client,
        url,
        {
            "tags": tags,
            "numericFilters": f"created_at_i>={lo},created_at_i<{hi}",
            "hitsPerPage": hits_per_page,
            "page": page,
        },
        sleep=sleep,
    )


async def _collect_range(
    client: httpx.AsyncClient,
    url: str,
    lo: int,
    hi: int,
    *,
    tags: str,
    hits_per_page: int,
    cap: int,
    sleep: Callable[[float], Awaitable[None]],
    out: list[dict[str, Any]],
) -> None:
    """Recursively collect every hit in [lo, hi). If the range holds more than the
    cap, bisect it by time and recurse; otherwise paginate it fully."""
    if hi <= lo:
        return
    first = await _fetch_page(
        client, url, lo=lo, hi=hi, page=0, tags=tags, hits_per_page=hits_per_page, sleep=sleep
    )
    nb_hits = int(first.get("nbHits", len(first.get("hits", []))))
    if nb_hits > cap:
        if hi - lo > 1:
            mid = lo + (hi - lo) // 2
            await _collect_range(
                client, url, lo, mid, tags=tags, hits_per_page=hits_per_page,
                cap=cap, sleep=sleep, out=out,
            )
            await _collect_range(
                client, url, mid, hi, tags=tags, hits_per_page=hits_per_page,
                cap=cap, sleep=sleep, out=out,
            )
            return
        # Degenerate: a single second holding more than the cap — beyond what the
        # API can paginate. Vanishingly unlikely on HN; collect the cap and warn
        # rather than fail (the only residual truncation path, made loud).
        logger.warning(
            "HN ingest: >%d items at created_at_i=%d — pagination cap may truncate this second",
            cap,
            lo,
        )
    out.extend(first.get("hits", []))
    nb_pages = int(first.get("nbPages", 1))
    for page in range(1, nb_pages):
        payload = await _fetch_page(
            client, url, lo=lo, hi=hi, page=page, tags=tags,
            hits_per_page=hits_per_page, sleep=sleep,
        )
        out.extend(payload.get("hits", []))


async def fetch_since(
    client: httpx.AsyncClient,
    base: str,
    since: datetime,
    until: datetime | None = None,
    *,
    sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    tags: str = "story",
    hits_per_page: int = ALGOLIA_PAGINATION_CAP,
    cap: int = ALGOLIA_PAGINATION_CAP,
) -> list[dict[str, Any]]:
    """Fetch EVERY HN item created in [since, until] from the Algolia HN endpoint,
    subdividing the window under the pagination cap so a high-volume window is
    never silently truncated. `until` defaults to now."""
    until = until or datetime.now(tz=UTC)
    url = f"{base.rstrip('/')}/search_by_date"
    lo = int(since.timestamp())
    hi = int(until.timestamp()) + 1  # half-open upper bound; +1 includes the latest second
    out: list[dict[str, Any]] = []
    await _collect_range(
        client, url, lo, hi, tags=tags, hits_per_page=hits_per_page, cap=cap, sleep=sleep, out=out
    )
    return out


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
