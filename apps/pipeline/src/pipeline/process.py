"""The processor (Decision 4). Per unprocessed raw_item: classify → (embed if
kept) → ATOMIC insert. Idempotent (NOT EXISTS pickup + ON CONFLICT). A per-item
failure leaves the item UNPROCESSED (no row) and retried — never half-written
(FR-006). `classify_fn`/`embed_fn` are injected so tests mock the providers and
NEVER spend (the 5.1 `fetch` pattern)."""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from typing import Any

from pipeline import classify, cost, db, embed
from pipeline.classify import Verdict
from pipeline.settings import Settings

logger = logging.getLogger(__name__)

ClassifyFn = Callable[[dict[str, Any]], Awaitable[Verdict]]
EmbedFn = Callable[[dict[str, Any]], Awaitable[list[float]]]


def is_kept(verdict: Verdict) -> bool:
    """Mirrors the DB generated column `kept = label != 'noise' OR forced_keep`
    (the single source of truth) so we know whether to embed BEFORE the insert."""
    return verdict.label != "noise" or verdict.forced_keep


async def run(
    pool: Any,
    *,
    classify_fn: ClassifyFn,
    embed_fn: EmbedFn,
    settings: Settings,
) -> dict[str, Any]:
    guard = cost.CostGuard(
        max_items=settings.max_items_per_run,
        daily_ceiling_usd=settings.daily_usd_ceiling,
    )
    processed = kept_n = dropped_n = skipped = errored = 0
    halted = False

    async with pool.acquire() as conn:
        # Fetch at most the cap — so a large backlog never over-runs (FR-012).
        items = await db.unprocessed_raw_items(conn, limit=settings.max_items_per_run)

    for rec in items:
        if guard.should_halt():
            halted = True
            break
        item = dict(rec)
        classify_text = classify.build_classify_text(item, settings.classify_body_tokens)
        try:
            verdict = await classify_fn(item)
            kept = is_kept(verdict)
            embedding = await embed_fn(item) if kept else None
            embed_text = embed.build_embed_text(item, settings.embed_body_tokens)
            # ATOMIC: one statement, ON CONFLICT DO NOTHING. Either the full row
            # lands (kept ⇒ embedding present) or nothing does.
            async with pool.acquire() as conn:
                inserted = await db.insert_processed(
                    conn,
                    {
                        "raw_item_id": item["id"],
                        "label": verdict.label,
                        "reason": verdict.reason,
                        "confidence": verdict.confidence,
                        "forced_keep": verdict.forced_keep,
                        "normalized_text": embed_text if kept else classify_text,
                        "embedding": embedding,
                        "classifier_model": settings.classifier_model,
                        "prompt_version": settings.prompt_version,
                        "embedding_model": settings.embedding_model if kept else None,
                    },
                )
            if inserted:
                processed += 1
                kept_n += int(kept)
                dropped_n += int(not kept)
            else:
                skipped += 1  # already processed (a concurrent run won the conflict)
            guard.record(cost.estimate_item_usd(classify_text, embed_text if kept else None))
        except Exception as exc:  # noqa: BLE001 — a failed item must NOT abort the run
            errored += 1
            # No row was written → the item stays unprocessed and is retried.
            logger.warning("process: item %s left unprocessed: %s", item.get("id"), exc)
            guard.record(cost.estimate_item_usd(classify_text, None))

    result = {
        "processed": processed,
        "kept": kept_n,
        "dropped": dropped_n,
        "skipped": skipped,
        "errored": errored,
        "halted": halted,
        "halted_reason": guard.halted_reason,
        "usd": round(guard.usd, 6),
    }
    logger.info("process complete: %s", result)
    return result


def build_provider_fns(settings: Settings) -> tuple[ClassifyFn, EmbedFn]:
    """Wire the REAL providers from settings (used by the cron). Raises if a key is
    missing — the processor must never silently no-op against absent providers."""
    if not settings.anthropic_api_key or not settings.openai_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY and OPENAI_API_KEY must both be set")
    anthropic_call = classify.make_anthropic_call(settings.anthropic_api_key)
    openai_call = embed.make_openai_call(settings.openai_api_key)

    async def classify_fn(item: dict[str, Any]) -> Verdict:
        return await classify.classify(item, call=anthropic_call, settings=settings)

    async def embed_fn(item: dict[str, Any]) -> list[float]:
        return await embed.embed(item, call=openai_call, settings=settings)

    return classify_fn, embed_fn
