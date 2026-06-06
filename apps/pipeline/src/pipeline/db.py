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


# === Slice 5.2 — processed_items (the derived classify+embed table) ==========

# Python's source of truth for the processed_items column set — asserted == the
# committed contract AND the live table by the drift test. ALL 13 columns (incl.
# the GENERATED `kept` + DB-managed `id`/`processed_at`). Order matches the contract.
PROCESSED_ITEMS_COLUMNS: tuple[str, ...] = (
    "classifier_model",
    "confidence",
    "embedding",
    "embedding_model",
    "forced_keep",
    "id",
    "kept",
    "label",
    "normalized_text",
    "processed_at",
    "prompt_version",
    "raw_item_id",
    "reason",
)

# The WRITABLE subset — `id` (default), `kept` (GENERATED), `processed_at` (default)
# are DB-managed and MUST NOT be written.
_PROCESSED_INSERT_COLUMNS: tuple[str, ...] = (
    "raw_item_id",
    "label",
    "reason",
    "confidence",
    "forced_keep",
    "normalized_text",
    "embedding",
    "classifier_model",
    "prompt_version",
    "embedding_model",
)

# `embedding` ($7) is cast text→vector so we avoid a pgvector codec dependency.
_PROCESSED_INSERT_SQL = f"""
INSERT INTO processed_items ({", ".join(_PROCESSED_INSERT_COLUMNS)})
VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, $9, $10)
ON CONFLICT (raw_item_id) DO NOTHING
RETURNING id
"""


def _vector_literal(embedding: list[float] | None) -> str | None:
    """pgvector text form '[v1,v2,…]' (or None). Cast to ::vector in SQL."""
    if embedding is None:
        return None
    return "[" + ",".join(repr(float(x)) for x in embedding) + "]"


async def unprocessed_raw_items(
    conn: asyncpg.Connection, *, limit: int
) -> list[asyncpg.Record]:
    """The STATELESS pickup (FR-004): raw_items with NO processed_items row — a
    NOT EXISTS join, no cursor. Source-agnostic. Oldest first, bounded by `limit`."""
    return await conn.fetch(
        """
        SELECT r.* FROM raw_items r
        WHERE NOT EXISTS (
            SELECT 1 FROM processed_items p WHERE p.raw_item_id = r.id
        )
        ORDER BY r.ingested_at
        LIMIT $1
        """,
        limit,
    )


async def insert_processed(conn: asyncpg.Connection, row: dict[str, Any]) -> bool:
    """Write one verdict ATOMICALLY (FR-006) — `ON CONFLICT (raw_item_id) DO NOTHING`,
    so overlapping / retried / concurrent processing of the same raw item yields
    exactly one row, no error. Returns True if inserted (False = already processed).
    `kept` is GENERATED by the DB (`label != 'noise' OR forced_keep`) — never passed."""
    returned = await conn.fetchval(
        _PROCESSED_INSERT_SQL,
        row["raw_item_id"],
        row["label"],
        row.get("reason"),
        row.get("confidence"),
        row.get("forced_keep", False),
        row.get("normalized_text"),
        _vector_literal(row.get("embedding")),
        row.get("classifier_model"),
        row.get("prompt_version"),
        row.get("embedding_model"),
    )
    return returned is not None
