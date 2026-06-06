"""Auto-label a stratified sample of real dev raw_items with Haiku → the DRAFT
gold set (eval/gold_set.draft.jsonl). READ-ONLY: SELECTs raw_items + calls Haiku;
writes only a local JSONL. The founder then corrects `gold_label` → the committed
gold_set.jsonl (T033). Deterministic sample (md5(id) order) so it's reproducible.

Run: DATABASE_URL=<dev session pooler> ANTHROPIC_API_KEY=… \
     PYTHONPATH=src uv run python eval/autolabel.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from collections import Counter
from pathlib import Path

import asyncpg

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from pipeline import classify  # noqa: E402
from pipeline.settings import load_settings  # noqa: E402

N = int(os.environ.get("EVAL_SAMPLE_N", "180"))
OUT = Path(__file__).parent / "gold_set.draft.jsonl"


async def main() -> None:
    settings = load_settings()
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    call = classify.make_anthropic_call(settings.anthropic_api_key)

    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        rows = await conn.fetch(
            "SELECT id, title, body FROM raw_items WHERE source='hn' "
            "ORDER BY md5(id::text) LIMIT $1",
            N,
        )
    finally:
        await conn.close()

    sem = asyncio.Semaphore(int(os.environ.get("EVAL_CONCURRENCY", "3")))

    async def _call_with_backoff(item: dict) -> dict:
        user = classify.build_classify_text(item, settings.classify_body_tokens)
        delay = 1.0
        for attempt in range(7):
            try:
                return await call(
                    system=classify.RUBRIC_SYSTEM,
                    user=user,
                    tool=classify.CLASSIFY_TOOL,
                    model=settings.classifier_model,
                )
            except Exception as exc:  # noqa: BLE001
                if "429" in str(exc) or "rate_limit" in str(exc).lower():
                    if attempt == 6:
                        raise
                    await asyncio.sleep(delay)
                    delay = min(delay * 2, 30)
                    continue
                raise
        raise RuntimeError("unreachable")

    async def label(row: asyncpg.Record) -> dict:
        item = {"title": row["title"], "body": row["body"]}
        async with sem:
            try:
                tool = await _call_with_backoff(item)
                v = classify.parse_verdict(tool)
                return {
                    "raw_item_id": str(row["id"]),
                    "title": row["title"],
                    "body": (row["body"] or "")[:600],
                    "haiku_label": v["label"],
                    "haiku_confidence": v["confidence"],
                    "reason": v["reason"],
                    # provisional gold = Haiku's label; the founder corrects this.
                    "gold_label": v["label"],
                }
            except Exception as exc:  # noqa: BLE001
                return {"raw_item_id": str(row["id"]), "error": str(exc)}

    results = await asyncio.gather(*[label(r) for r in rows])
    OUT.write_text("\n".join(json.dumps(r) for r in results) + "\n")

    dist = Counter(r.get("haiku_label", "ERROR") for r in results)
    kept = sum(1 for r in results if r.get("haiku_label", "noise") != "noise")
    print(f"labeled {len(results)} items → {OUT.name}")
    print(f"haiku label distribution: {dict(dist)}")
    print(f"keep/drop: {kept} keep / {len(results) - kept} drop")


asyncio.run(main())
