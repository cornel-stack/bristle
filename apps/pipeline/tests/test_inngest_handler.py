"""Regression guard for the Inngest handler DISPATCH convention. The rest of the
suite exercises the ingester core directly and never goes through the registered
handler — which is why a `(ctx, step)` signature passed CI but failed in Inngest
Cloud with "missing 1 required positional argument: 'step'". This test invokes the
handler the way the Inngest Python SDK (0.5.18) does: with a SINGLE context
argument (steps live on `ctx.step`). A reverted/two-arg handler fails here."""

from __future__ import annotations

import inspect
import logging
import types

from pipeline import db, inngest_fns
from pipeline.ingest import hn
from pipeline.settings import Settings

_SENTINEL = {"fetched": 0, "inserted": 0, "skipped": 0}


def test_handler_signature_is_single_context():
    # The SDK calls fn._handler(ctx) — exactly one required positional. A second
    # required param (the old `step`) is the exact regression we are guarding.
    sig = inspect.signature(inngest_fns.hn_ingest._handler)
    required = [p.name for p in sig.parameters.values() if p.default is p.empty]
    assert required == ["ctx"], (
        f"Inngest invokes the handler with a single context arg; got required params {required}. "
        "Use `async def hn_ingest(ctx)` and reach steps via ctx.step."
    )


async def test_handler_runs_when_called_with_single_context(monkeypatch):
    # Stub out DB + network so this is a pure dispatch test (no Supabase, no HN).
    class _FakePool:
        async def close(self):
            return None

    async def _fake_create_pool(dsn):
        return _FakePool()

    async def _fake_run_ingest(pool, fetch, **kwargs):
        return dict(_SENTINEL)

    monkeypatch.setattr(
        inngest_fns, "load_settings",
        lambda: Settings(
            database_url="postgresql://stub",
            inngest_signing_key=None,
            inngest_event_key=None,
            algolia_base="https://hn.algolia.com/api/v1",
            lookback_hours=24,
            backfill_hours=72,
        ),
    )
    monkeypatch.setattr(db, "create_pool", _fake_create_pool)
    monkeypatch.setattr(hn, "run_ingest", _fake_run_ingest)

    # A single context, the way Inngest passes it (handler only touches ctx.logger).
    ctx = types.SimpleNamespace(logger=logging.getLogger("test-inngest-handler"))

    # The crux: call the REGISTERED handler with ONE positional arg. A `(ctx, step)`
    # handler would raise TypeError here — exactly the Cloud failure.
    result = await inngest_fns.hn_ingest._handler(ctx)
    assert result == _SENTINEL
