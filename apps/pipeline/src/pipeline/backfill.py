"""One-shot Batch-API backfill (Decision 5, 5.2-OD-8). Drains the unprocessed
raw_items backlog via Anthropic's Message Batches API (async, ~half price) for
classification, embeds kept items (OpenAI), and writes results through the SAME
atomic `insert_processed` path (so batch + the incremental cron converge on one
writer + the idempotency guarantee). Runs through the cost guard ($ ceiling).

MUST drain BEFORE the incremental cron is enabled (refinement 2): while a batch is
in flight the items still have no processed_items row, so a live cron would
double-classify them. The atomic ON CONFLICT makes a residual overlap safe anyway.

Run: DATABASE_URL=… ANTHROPIC_API_KEY=… OPENAI_API_KEY=… \
     PYTHONPATH=src uv run python -m pipeline.backfill [RESUME_BATCH_ID]
"""

from __future__ import annotations

import asyncio
import sys
from typing import Any

import anthropic

from pipeline import classify, cost, db, embed
from pipeline.settings import Settings, load_settings


def _build_requests(items: list[dict[str, Any]], settings: Settings) -> list[dict[str, Any]]:
    reqs = []
    for it in items:
        user = classify.build_classify_text(it, settings.classify_body_tokens)
        reqs.append(
            {
                "custom_id": str(it["id"]),
                "params": {
                    "model": settings.classifier_model,
                    "max_tokens": 256,
                    "system": classify.RUBRIC_SYSTEM,
                    "messages": [{"role": "user", "content": user}],
                    "tools": [classify.CLASSIFY_TOOL],
                    "tool_choice": {"type": "tool", "name": classify.CLASSIFY_TOOL["name"]},
                },
            }
        )
    return reqs


def _tool_input(message: Any) -> dict[str, Any] | None:
    for block in message.content:
        if getattr(block, "type", None) == "tool_use":
            return dict(block.input)
    return None


async def run_backfill(
    pool: Any, settings: Settings, *, resume_batch_id: str | None = None, poll_max_s: int = 540
) -> dict[str, Any]:
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    guard = cost.CostGuard(max_items=10**9, daily_ceiling_usd=settings.daily_usd_ceiling)

    # Snapshot the unprocessed backlog + index by id for the result-write phase.
    async with pool.acquire() as conn:
        rows = await db.unprocessed_raw_items(conn, limit=10**9)
    items = {str(r["id"]): dict(r) for r in rows}
    print(f"backlog: {len(items)} unprocessed items")
    if not items and not resume_batch_id:
        return {"processed": 0, "kept": 0, "dropped": 0, "note": "nothing to backfill"}

    # Submit (or resume) the classification batch.
    if resume_batch_id:
        batch_id = resume_batch_id
    else:
        reqs = _build_requests(list(items.values()), settings)
        batch = await client.messages.batches.create(requests=reqs)
        batch_id = batch.id
        print(f"submitted batch {batch_id} ({len(items)} requests)")

    # Poll to completion (bounded; re-run with the batch id to resume).
    waited = 0
    while True:
        b = await client.messages.batches.retrieve(batch_id)
        if b.processing_status == "ended":
            break
        if waited >= poll_max_s:
            print(
                f"batch {batch_id} still {b.processing_status} after {waited}s — "
                "re-run with this id to resume"
            )
            return {"batch_id": batch_id, "status": b.processing_status, "incomplete": True}
        await asyncio.sleep(15)
        waited += 15

    # Retrieve results → classify verdict → embed kept → atomic insert (cost-guarded).
    openai_call = embed.make_openai_call(settings.openai_api_key)
    processed = kept_n = dropped_n = errored = 0
    halted = False
    async for res in await client.messages.batches.results(batch_id):
        if guard.should_halt():
            halted = True
            break
        item = items.get(res.custom_id)
        if item is None:
            continue
        try:
            if res.result.type != "succeeded":
                errored += 1
                continue
            tool_input = _tool_input(res.result.message)
            parsed = classify.parse_verdict(tool_input)
            verdict = classify.apply_forced_keep(parsed, settings.forced_keep_below)
            kept = verdict.label != "noise" or verdict.forced_keep
            embedding = (
                await embed.embed(item, call=openai_call, settings=settings) if kept else None
            )
            embed_text = embed.build_embed_text(item, settings.embed_body_tokens)
            classify_text = classify.build_classify_text(item, settings.classify_body_tokens)
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
            # batch classify is ~half price.
            est = cost.estimate_item_usd(classify_text, embed_text if kept else None)
            guard.record(est / 2)
        except Exception as exc:  # noqa: BLE001
            errored += 1
            print(f"item {res.custom_id} failed (left unprocessed): {exc}")

    return {
        "processed": processed, "kept": kept_n, "dropped": dropped_n,
        "errored": errored, "halted": halted, "halted_reason": guard.halted_reason,
        "usd_est": round(guard.usd, 4), "batch_id": batch_id,
    }


async def _main() -> None:
    settings = load_settings()
    if not settings.anthropic_api_key or not settings.openai_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY and OPENAI_API_KEY must both be set")
    resume = sys.argv[1] if len(sys.argv) > 1 else None
    pool = await db.create_pool(settings.database_url)
    try:
        result = await run_backfill(pool, settings, resume_batch_id=resume)
        print("BACKFILL RESULT:", result)
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(_main())
