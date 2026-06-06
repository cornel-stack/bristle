"""The drift GATE (Decision 2, the TS↔Python seam) — now BOTH pipeline tables.
For each of raw_items + processed_items: live introspection == the committed
packages/db contract == the Python column spec. Covers the vector(1536) column,
the GENERATED `kept` column, the HNSW index, and the raw_item_id FK (cascade).
Any divergence (a migration not applied, a hand-edit, Python drift) fails here."""

from __future__ import annotations

import json

import conftest
import pytest

from pipeline import db

# table name → its Python column spec.
TABLES = {
    "raw_items": db.RAW_ITEMS_COLUMNS,
    "processed_items": db.PROCESSED_ITEMS_COLUMNS,
}

# format_type() yields the SAME strings as drizzle getSQLType() — "uuid", "text",
# "vector(1536)", "timestamp with time zone", … — so types compare exactly.
_COLS_SQL = """
SELECT a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull AS not_null,
       a.attgenerated <> '' AS generated
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = $1 AND n.nspname = 'public' AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY a.attname
"""


def _contract(name: str) -> dict:
    return json.loads((conftest.CONTRACTS_DIR / f"{name}.contract.json").read_text())


@pytest.mark.parametrize("table", list(TABLES))
async def test_python_columns_match_contract(table):
    contract = _contract(table)
    assert set(TABLES[table]) == {col["name"] for col in contract["columns"]}


@pytest.mark.parametrize("table", list(TABLES))
async def test_live_columns_match_contract(pool, table):
    contract = _contract(table)
    async with pool.acquire() as c:
        rows = await c.fetch(_COLS_SQL, table)
    live = {
        r["column_name"]: {
            "type": r["data_type"],
            "notNull": r["not_null"],
            "generated": r["generated"],
        }
        for r in rows
    }
    expected = {
        col["name"]: {
            "type": col["type"],
            "notNull": col["notNull"],
            "generated": col.get("generated", False),
        }
        for col in contract["columns"]
    }
    assert live == expected


@pytest.mark.parametrize(
    "table,col",
    [("raw_items", "content_hash"), ("processed_items", "raw_item_id")],
)
async def test_unique_constraint_matches(pool, table, col):
    contract = _contract(table)
    async with pool.acquire() as c:
        rows = await c.fetch(
            """
            SELECT kcu.column_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = $1 AND tc.constraint_type = 'UNIQUE'
            """,
            table,
        )
    live = {r["column_name"] for r in rows}
    contract_unique = {c for uc in contract["uniqueConstraints"] for c in uc["columns"]}
    assert live == contract_unique == {col}


async def test_processed_items_kept_is_generated(pool):
    # The `kept` correctness column MUST be GENERATED (label != 'noise' OR forced_keep).
    async with pool.acquire() as c:
        gen = await c.fetchval(
            "SELECT is_generated FROM information_schema.columns "
            "WHERE table_name='processed_items' AND column_name='kept'"
        )
    assert gen == "ALWAYS"


async def test_processed_items_fk_matches_contract(pool):
    contract = _contract("processed_items")
    async with pool.acquire() as c:
        rows = await c.fetch(
            """
            SELECT confrelid::regclass::text AS ref_table, confdeltype
            FROM pg_constraint
            WHERE conrelid = 'processed_items'::regclass AND contype = 'f'
            """
        )
    assert len(rows) == 1
    assert rows[0]["ref_table"] == "raw_items"
    # pg "char" comes back as bytes via asyncpg; 'c' = ON DELETE CASCADE.
    deltype = rows[0]["confdeltype"]
    assert (deltype.decode() if isinstance(deltype, bytes) else deltype) == "c"
    assert contract["foreignKeys"][0]["refTable"] == "raw_items"
    assert contract["foreignKeys"][0]["onDelete"] == "cascade"


async def test_processed_items_hnsw_index(pool):
    contract = _contract("processed_items")
    async with pool.acquire() as c:
        indexdef = await c.fetchval(
            "SELECT indexdef FROM pg_indexes "
            "WHERE indexname = 'processed_items_embedding_hnsw_idx'"
        )
    assert indexdef is not None and "hnsw" in indexdef.lower()
    idx = next(i for i in contract["indexes"] if i["name"] == "processed_items_embedding_hnsw_idx")
    assert idx["method"] == "hnsw" and idx["columns"] == ["embedding"]
