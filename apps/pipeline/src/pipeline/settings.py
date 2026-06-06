"""Environment + tunables (Decision 5, OD-1). No secrets in code — everything is
read from the environment (Railway in prod; gitignored .env in dev)."""

from __future__ import annotations

import os
from dataclasses import dataclass

# Tunables (Decision 4 / OD-1). B (the lookback buffer) is deliberately wider than
# Algolia's worst-case indexing lag so late/out-of-order items are re-scanned and
# caught; dedup absorbs the overlap. BACKFILL is the empty-table first-run window.
DEFAULT_LOOKBACK_HOURS = 24
DEFAULT_BACKFILL_HOURS = 72
DEFAULT_ALGOLIA_BASE = "https://hn.algolia.com/api/v1"  # public, keyless

# Slice 5.2 — classifier/embedder + cost guard (Decisions 2/3/5, 5.2-OD-3/5/6).
DEFAULT_MAX_ITEMS_PER_RUN = 1000
DEFAULT_DAILY_USD_CEILING = 20.0  # runaway tripwire, NOT $5 (near steady-state)
DEFAULT_FORCED_KEEP_BELOW = 0.5  # STARTING default; calibrated on the gold set (Batch D)
DEFAULT_CLASSIFY_BODY_TOKENS = 500
DEFAULT_EMBED_BODY_TOKENS = 1000
DEFAULT_CLASSIFIER_MODEL = "claude-haiku-4-5-20251001"
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_EMBEDDING_DIMENSIONS = 1536  # locked by problems.embedding consistency (A9)
DEFAULT_PROMPT_VERSION = "v1"


@dataclass(frozen=True)
class Settings:
    database_url: str
    inngest_signing_key: str | None
    inngest_event_key: str | None
    algolia_base: str
    lookback_hours: int
    backfill_hours: int
    # Slice 5.2 — model providers (per-slice ML deps, OD-7) + cost guard.
    anthropic_api_key: str | None
    openai_api_key: str | None
    max_items_per_run: int
    daily_usd_ceiling: float
    forced_keep_below: float
    classify_body_tokens: int
    embed_body_tokens: int
    classifier_model: str
    embedding_model: str
    embedding_dimensions: int
    prompt_version: str


def load_settings() -> Settings:
    """Read settings from the environment. Raises if DATABASE_URL is absent —
    the pipeline must never silently run against the wrong (or no) database."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    return Settings(
        database_url=url,
        inngest_signing_key=os.environ.get("INNGEST_SIGNING_KEY"),
        inngest_event_key=os.environ.get("INNGEST_EVENT_KEY"),
        algolia_base=os.environ.get("ALGOLIA_BASE", DEFAULT_ALGOLIA_BASE),
        lookback_hours=int(os.environ.get("LOOKBACK_HOURS", DEFAULT_LOOKBACK_HOURS)),
        backfill_hours=int(os.environ.get("BACKFILL_HOURS", DEFAULT_BACKFILL_HOURS)),
        anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
        openai_api_key=os.environ.get("OPENAI_API_KEY"),
        max_items_per_run=int(os.environ.get("MAX_ITEMS_PER_RUN", DEFAULT_MAX_ITEMS_PER_RUN)),
        daily_usd_ceiling=float(os.environ.get("DAILY_USD_CEILING", DEFAULT_DAILY_USD_CEILING)),
        forced_keep_below=float(os.environ.get("FORCED_KEEP_BELOW", DEFAULT_FORCED_KEEP_BELOW)),
        classify_body_tokens=int(
            os.environ.get("CLASSIFY_BODY_TOKENS", DEFAULT_CLASSIFY_BODY_TOKENS)
        ),
        embed_body_tokens=int(os.environ.get("EMBED_BODY_TOKENS", DEFAULT_EMBED_BODY_TOKENS)),
        classifier_model=os.environ.get("CLASSIFIER_MODEL", DEFAULT_CLASSIFIER_MODEL),
        embedding_model=os.environ.get("EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL),
        embedding_dimensions=int(
            os.environ.get("EMBEDDING_DIMENSIONS", DEFAULT_EMBEDDING_DIMENSIONS)
        ),
        prompt_version=os.environ.get("PROMPT_VERSION", DEFAULT_PROMPT_VERSION),
    )
