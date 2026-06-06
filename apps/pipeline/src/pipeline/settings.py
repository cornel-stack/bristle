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


@dataclass(frozen=True)
class Settings:
    database_url: str
    inngest_signing_key: str | None
    inngest_event_key: str | None
    algolia_base: str
    lookback_hours: int
    backfill_hours: int


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
    )
