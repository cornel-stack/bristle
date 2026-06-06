"""Database access for the pipeline (asyncpg, OD-2). The `raw_items` schema is
Drizzle-owned (Decision 2) — this module never defines DDL, only reads/writes."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

import asyncpg

# Python's single source of truth for the raw_items column set — asserted equal to
# the committed packages/db/contracts/raw_items.contract.json AND the live table by
# the drift test (test_schema_contract). If the Drizzle schema changes without this
# list following, the drift test fails CI. Order matches the contract (sorted).
RAW_ITEMS_COLUMNS: tuple[str, ...] = (
    "author",
    "body",
    "content_hash",
    "id",
    "ingested_at",
    "num_comments",
    "points",
    "raw",
    "source",
    "source_created_at",
    "source_id",
    "title",
    "url",
)

# The columns the ingester writes. `id` + `ingested_at` are DB-defaulted; the rest
# come from the upstream item.
_INSERT_COLUMNS: tuple[str, ...] = (
    "source",
    "source_id",
    "content_hash",
    "title",
    "body",
    "url",
    "author",
    "points",
    "num_comments",
    "source_created_at",
    "raw",
)

_INSERT_SQL = f"""
INSERT INTO raw_items ({", ".join(_INSERT_COLUMNS)})
VALUES ({", ".join(f"${i + 1}" for i in range(len(_INSERT_COLUMNS)))})
ON CONFLICT (content_hash) DO NOTHING
RETURNING id
"""


async def _init_conn(conn: asyncpg.Connection) -> None:
    # Let us pass/read `raw` as a Python dict against the jsonb column.
    await conn.set_type_codec(
        "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )


async def create_pool(dsn: str, *, min_size: int = 1, max_size: int = 5) -> asyncpg.Pool:
    return await asyncpg.create_pool(dsn, min_size=min_size, max_size=max_size, init=_init_conn)


async def watermark(conn: asyncpg.Connection, source: str) -> datetime | None:
    """The stateless watermark (Decision 4): the latest upstream timestamp we hold
    for `source`. None when the table has no rows for it (→ backfill path)."""
    return await conn.fetchval(
        "SELECT max(source_created_at) FROM raw_items WHERE source = $1", source
    )


async def upsert_items(conn: asyncpg.Connection, rows: list[dict[str, Any]]) -> tuple[int, int]:
    """Write rows with the DEDUP INVARIANT — `ON CONFLICT (content_hash) DO NOTHING`
    (FR-004). The unique constraint, not app logic, prevents duplicates, so this is
    safe under overlapping / retried / concurrent runs. The conflicting row keeps
    its FIRST-fetch values (the points/num_comments freeze — a known, tested
    characteristic, see test_dedup). Returns (inserted, skipped)."""
    inserted = 0
    for r in rows:
        returned = await conn.fetchval(
            _INSERT_SQL,
            r["source"],
            r["source_id"],
            r["content_hash"],
            r.get("title"),
            r.get("body"),
            r.get("url"),
            r.get("author"),
            r.get("points"),
            r.get("num_comments"),
            r["source_created_at"],
            r["raw"],
        )
        if returned is not None:
            inserted += 1
    return inserted, len(rows) - inserted
