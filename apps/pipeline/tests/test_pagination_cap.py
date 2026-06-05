"""Pagination-cap regression (Batch B addition) — the volume analogue of the
watermark trap. The mock Algolia ENFORCES the ~1000 paginationLimitedTo, so a
naive pages-until-done fetch would silently drop the oldest items in an over-cap
window. fetch_since must subdivide and return EVERYTHING, with ties at a sub-range
seam neither dropped nor double-counted."""

from __future__ import annotations

import math
from datetime import UTC, datetime

import httpx

from pipeline.ingest import hn


async def _noop_sleep(_d):
    pass


def _dt(ts: int) -> datetime:
    return datetime.fromtimestamp(ts, tz=UTC)


def _parse_range(numeric_filters: str) -> tuple[int, int]:
    lo = hi = 0
    for part in numeric_filters.split(","):
        if ">=" in part:
            lo = int(part.split(">=")[1])
        elif "<" in part:
            hi = int(part.split("<")[1])
    return lo, hi


def _algolia_mock(items: list[dict], *, cap: int, hits_per_page: int):
    """Faithful Algolia: filters [lo, hi), newest-first, reports the true nbHits but
    only lets you PAGINATE through `cap` of them (paginationLimitedTo)."""

    def handler(request: httpx.Request) -> httpx.Response:
        params = request.url.params
        lo, hi = _parse_range(params.get("numericFilters", ""))
        page = int(params.get("page", 0))
        hpp = int(params.get("hitsPerPage", hits_per_page))
        matched = sorted(
            (it for it in items if lo <= it["created_at_i"] < hi),
            key=lambda x: x["created_at_i"],
            reverse=True,
        )
        nb_hits = len(matched)
        retrievable = matched[:cap]  # the cap bites here
        start = page * hpp
        page_hits = retrievable[start : start + hpp]
        nb_pages = max(1, math.ceil(len(retrievable) / hpp))
        return httpx.Response(
            200,
            json={"hits": page_hits, "nbHits": nb_hits, "nbPages": nb_pages, "page": page},
        )

    return handler


async def _fetch_all(items, *, since_ts, until_ts, cap, hpp):
    handler = _algolia_mock(items, cap=cap, hits_per_page=hpp)
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://t") as c:
        return await hn.fetch_since(
            c, "http://t", _dt(since_ts), _dt(until_ts),
            sleep=_noop_sleep, cap=cap, hits_per_page=hpp,
        )


async def test_over_cap_window_is_fully_covered():
    # 250 items, one per second, in a window whose total (250) far exceeds cap (50).
    # A naive page-until-done would return only the newest 50.
    cap, hpp = 50, 20
    items = [
        {"objectID": str(i), "title": f"t{i}", "url": f"u{i}", "created_at_i": 1000 + i}
        for i in range(250)
    ]
    hits = await _fetch_all(items, since_ts=1000, until_ts=1249, cap=cap, hpp=hpp)
    got = [h["objectID"] for h in hits]
    assert len(got) == 250  # zero truncation across subdivision boundaries
    assert set(got) == {str(i) for i in range(250)}
    assert len(got) == len(set(got))  # no double-count


async def test_tie_cluster_on_a_seam_is_not_dropped_or_doubled():
    # Range [1000, 1128) → first bisection mid = (1000 + 1128) // 2 = 1064. Land a
    # 30-item cluster of IDENTICAL created_at_i exactly on that seam; total (70) >
    # cap (50) forces the subdivision. Half-open [lo,mid)/[mid,hi) must place all
    # 30 ties on the right side, once each.
    cap, hpp = 50, 20

    def _item(obj_id: str, created: int) -> dict:
        return {"objectID": obj_id, "title": "x", "url": "u", "created_at_i": created}

    items: list[dict] = []
    items += [_item(f"tie{i}", 1064) for i in range(30)]  # the cluster, exactly on the seam
    items += [_item(f"lo{i}", 1000 + i) for i in range(20)]  # below the seam
    items += [_item(f"hi{i}", 1090 + i) for i in range(20)]  # above the seam
    hits = await _fetch_all(items, since_ts=1000, until_ts=1127, cap=cap, hpp=hpp)
    got = [h["objectID"] for h in hits]
    assert len(got) == 70
    assert len(got) == len(set(got))  # no double-count at the 1064 seam
    assert sum(1 for o in got if o.startswith("tie")) == 30  # every tie present exactly once
