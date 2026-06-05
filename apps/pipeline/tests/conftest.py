"""Test fixtures. Gate-free (OD-5): tests run against an EPHEMERAL postgres:16
reached via TEST_DATABASE_URL — never a Supabase. Migration 0005 (the real
Drizzle-generated SQL) is applied per test for a clean raw_items."""

from __future__ import annotations

import os
from pathlib import Path

import pytest_asyncio

import pipeline.db as db

TEST_DSN = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@127.0.0.1:55432/pipeline_test",
)

# Repo root: apps/pipeline/tests/ → ../../.. The drift test + schema setup read the
# SAME committed artifacts the rest of the monorepo uses (no test-only schema).
_REPO_ROOT = Path(__file__).resolve().parents[3]
MIGRATION_0005 = next(iter(sorted(_REPO_ROOT.glob("packages/db/drizzle/0005_*.sql"))), None)
CONTRACT_PATH = _REPO_ROOT / "packages/db/contracts/raw_items.contract.json"


def _migration_statements() -> list[str]:
    if MIGRATION_0005 is None:
        raise RuntimeError("migration 0005 not found under packages/db/drizzle/")
    sql = MIGRATION_0005.read_text()
    # Drizzle separates statements with this marker.
    return [s.strip() for s in sql.split("--> statement-breakpoint") if s.strip()]


@pytest_asyncio.fixture
async def pool():
    """A fresh raw_items (drop + apply 0005) on the ephemeral DB, per test."""
    p = await db.create_pool(TEST_DSN)
    async with p.acquire() as conn:
        await conn.execute("DROP TABLE IF EXISTS raw_items CASCADE")
        for stmt in _migration_statements():
            await conn.execute(stmt)
    try:
        yield p
    finally:
        await p.close()
