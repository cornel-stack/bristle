"""Test fixtures. Gate-free (OD-5): tests run against an EPHEMERAL
**pgvector/pgvector:pg16** container reached via TEST_DATABASE_URL — never a
Supabase. The real Drizzle-generated pipeline migrations (0005 raw_items + 0006
processed_items, incl. its CREATE EXTENSION vector + HNSW index) are applied per
test for clean tables — the same committed SQL the monorepo uses."""

from __future__ import annotations

import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import asyncpg
import pytest_asyncio

import pipeline.db as db
from pipeline.classify import Verdict
from pipeline.settings import Settings


def make_settings(**over: Any) -> Settings:
    """Test Settings with sane defaults; override per test (e.g. max_items_per_run)."""
    base: dict[str, Any] = dict(
        database_url="postgresql://test",
        inngest_signing_key=None,
        inngest_event_key=None,
        algolia_base="",
        lookback_hours=24,
        backfill_hours=72,
        anthropic_api_key="test",
        openai_api_key="test",
        max_items_per_run=1000,
        daily_usd_ceiling=20.0,
        forced_keep_below=0.5,
        classify_body_tokens=500,
        embed_body_tokens=1000,
        classifier_model="test-haiku",
        embedding_model="test-embed",
        embedding_dimensions=1536,
        prompt_version="v1",
    )
    base.update(over)
    return Settings(**base)


async def seed_raw_item(conn: asyncpg.Connection, source_id: str, **over: Any) -> Any:
    """Insert one raw_items row; returns its id."""
    row = dict(
        source="hn",
        source_id=source_id,
        content_hash=f"h{source_id}",
        title=f"title {source_id}",
        body="some body text",
        url=None,
        author="a",
        points=1,
        num_comments=0,
        source_created_at=datetime(2026, 6, 1, tzinfo=UTC),
        raw={},
    )
    row.update(over)
    return await conn.fetchval(
        """
        INSERT INTO raw_items
          (source, source_id, content_hash, title, body, url, author,
           points, num_comments, source_created_at, raw)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id
        """,
        row["source"], row["source_id"], row["content_hash"], row["title"], row["body"],
        row["url"], row["author"], row["points"], row["num_comments"],
        row["source_created_at"], row["raw"],
    )


def fixed_classify(label="bug", confidence=0.9, forced_keep=False, reason="r"):
    """A mocked classify_fn returning a fixed Verdict (no Anthropic call)."""

    async def fn(_item: dict[str, Any]) -> Verdict:
        return Verdict(label=label, reason=reason, confidence=confidence, forced_keep=forced_keep)

    return fn


def fake_embed(dims: int = 1536):
    """A mocked embed_fn returning a fixed vector (no OpenAI call)."""

    async def fn(_item: dict[str, Any]) -> list[float]:
        return [0.01] * dims

    return fn

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
        parts = migration.read_text().split("--> statement-breakpoint")
        stmts += [s.strip() for s in parts if s.strip()]
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
