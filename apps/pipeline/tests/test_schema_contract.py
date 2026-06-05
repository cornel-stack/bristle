"""T020 — the raw_items drift GATE (Decision 2, the TS↔Python seam). The live
table (introspected) == the committed packages/db contract == Python
RAW_ITEMS_COLUMNS. Any divergence (a migration not applied, a hand-edit, Python
drifting from the Drizzle schema) fails here."""

from __future__ import annotations

import json

import conftest

from pipeline import db


def _contract():
    return json.loads(conftest.CONTRACT_PATH.read_text())


async def test_live_table_matches_contract(pool):
    contract = _contract()
    async with pool.acquire() as c:
        rows = await c.fetch(
            """
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'raw_items'
            ORDER BY column_name
            """
        )
    live = {
        r["column_name"]: {"type": r["data_type"], "notNull": r["is_nullable"] == "NO"}
        for r in rows
    }
    expected = {
        col["name"]: {"type": col["type"], "notNull": col["notNull"]}
        for col in contract["columns"]
    }
    assert live == expected


async def test_python_columns_match_contract():
    contract = _contract()
    assert set(db.RAW_ITEMS_COLUMNS) == {col["name"] for col in contract["columns"]}


async def test_unique_constraint_matches(pool):
    contract = _contract()
    async with pool.acquire() as c:
        rows = await c.fetch(
            """
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'raw_items' AND tc.constraint_type = 'UNIQUE'
            """
        )
    live_unique = {r["column_name"] for r in rows}
    contract_unique = {col for uc in contract["uniqueConstraints"] for col in uc["columns"]}
    assert live_unique == contract_unique == {"content_hash"}
