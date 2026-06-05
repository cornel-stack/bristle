"""T015 — content_hash is stable and identity-bearing. The dedup key must be the
SAME for a re-fetched item (so the lookback overlap dedups) and must NOT depend on
volatile signals (points/num_comments) or ingest metadata."""

from __future__ import annotations

from pipeline.ingest import hn


def _hit(**over):
    base = {
        "objectID": "123",
        "title": "Stripe webhooks fail silently",
        "url": "https://news.ycombinator.com/item?id=123",
        "author": "pg",
        "created_at_i": 1_700_000_000,
        "points": 5,
        "num_comments": 2,
    }
    base.update(over)
    return base


def test_same_inputs_same_hash():
    a = hn.content_hash("hn", "123", "Title", "https://x", "body")
    b = hn.content_hash("hn", "123", "Title", "https://x", "body")
    assert a == b


def test_volatile_signals_do_not_affect_hash():
    # Same item, different votes/comments (a later re-fetch) → SAME hash → dedups.
    first = hn.hit_to_row(_hit(points=5, num_comments=2))
    later = hn.hit_to_row(_hit(points=999, num_comments=888))
    assert first["content_hash"] == later["content_hash"]


def test_ingest_metadata_not_in_hash():
    # created_at feeds source_created_at, never the hash.
    a = hn.hit_to_row(_hit(created_at_i=1_700_000_000))
    b = hn.hit_to_row(_hit(created_at_i=1_699_999_000))
    assert a["content_hash"] == b["content_hash"]


def test_surrounding_whitespace_normalized():
    assert hn.content_hash("hn", "1", " T ", "u", "b") == hn.content_hash("hn", "1", "T", "u", "b")


def test_identity_fields_change_the_hash():
    base = hn.content_hash("hn", "1", "T", "u", "b")
    assert base != hn.content_hash("hn", "2", "T", "u", "b")  # source_id
    assert base != hn.content_hash("hn", "1", "T2", "u", "b")  # title
    assert base != hn.content_hash("hn", "1", "T", "u2", "b")  # url
    assert base != hn.content_hash("hn", "1", "T", "u", "b2")  # body
    assert base != hn.content_hash("gh", "1", "T", "u", "b")  # source
