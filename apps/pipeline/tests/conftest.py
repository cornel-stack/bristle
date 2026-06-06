"""Test fixtures. Gate-free (OD-5): tests run against an EPHEMERAL
**pgvector/pgvector:pg16** container reached via TEST_DATABASE_URL — never a
Supabase. The real Drizzle-generated pipeline migrations (0005 raw_items + 0006
processed_items, incl. its CREATE EXTENSION vector + HNSW index) are applied per
test for clean tables — the same committed SQL the monorepo uses."""

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
CONTRACTS_DIR = _REPO_ROOT / "packages/db/contracts"
CONTRACT_PATH = CONTRACTS_DIR / "raw_items.contract.json"  # kept for the 5.1 drift test

# The PIPELINE migrations (0005+), applied in order. The app schema (0000–0004) is
# frozen and not needed by pipeline tests; pipeline migrations are self-contained
# (0006 includes CREATE EXTENSION IF NOT EXISTS vector). Future pipeline migrations
# (0007+) are picked up automatically.
_PIPELINE_MIGRATIONS = sorted(
    p for p in _REPO_ROOT.glob("packages/db/drizzle/*.sql") if p.name[:4] >= "0005"
)
# The pipeline tables these migrations own — dropped (CASCADE) before each test.
_PIPELINE_TABLES = ("processed_items", "raw_items")


def _migration_statements() -> list[str]:
    if not _PIPELINE_MIGRATIONS:
        raise RuntimeError("no pipeline migrations (0005+) found under packages/db/drizzle/")
    stmts: list[str] = []
    for migration in _PIPELINE_MIGRATIONS:
        # Drizzle separates statements with this marker.
        stmts += [s.strip() for s in migration.read_text().split("--> statement-breakpoint") if s.strip()]
    return stmts


@pytest_asyncio.fixture
async def pool():
    """Fresh pipeline tables (drop + apply 0005…) on the ephemeral DB, per test."""
    p = await db.create_pool(TEST_DSN)
    async with p.acquire() as conn:
        await conn.execute(f"DROP TABLE IF EXISTS {', '.join(_PIPELINE_TABLES)} CASCADE")
        for stmt in _migration_statements():
            await conn.execute(stmt)
    try:
        yield p
    finally:
        await p.close()
