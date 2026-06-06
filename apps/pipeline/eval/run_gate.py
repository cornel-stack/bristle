"""The --live gold-eval gate (T035, the certified pass/fail — 5.2-OD-9). Re-runs
REAL Haiku over the committed gold items and scores its predictions against the
founder's labels: two-sided (noise-drop ≥ 80% AND problem-retention ≥ provisional
floor). Prints the certified confusion matrix; exits non-zero if it fails.

Run: ANTHROPIC_API_KEY=… PYTHONPATH=src:. uv run python eval/run_gate.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from eval import harness  # noqa: E402
from pipeline import classify  # noqa: E402
from pipeline.settings import load_settings  # noqa: E402

FORCED_KEEP_BELOW = 0.5
MIN_DROP = 0.80
MIN_RETENTION_PROVISIONAL = 0.80  # provisional — finalized in 028 (5.2-OD-7)


async def main() -> None:
    settings = load_settings()
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    call = classify.make_anthropic_call(settings.anthropic_api_key)
    gold = harness.load_gold()
    sem = asyncio.Semaphore(3)

    async def predict(rec: dict) -> dict:
        item = {"title": rec.get("title"), "body": rec.get("body")}
        user = classify.build_classify_text(item, settings.classify_body_tokens)
        delay = 1.0
        async with sem:
            for attempt in range(7):
                try:
                    tool = await call(
                        system=classify.RUBRIC_SYSTEM,
                        user=user,
                        tool=classify.CLASSIFY_TOOL,
                        model=settings.classifier_model,
                    )
                    v = classify.parse_verdict(tool)
                    return {
                        "gold_label": rec["gold_label"],
                        "haiku_label": v["label"],
                        "haiku_confidence": v["confidence"],
                    }
                except Exception as exc:  # noqa: BLE001
                    if ("429" in str(exc) or "rate_limit" in str(exc).lower()) and attempt < 6:
                        await asyncio.sleep(delay)
                        delay = min(delay * 2, 30)
                        continue
                    raise

    records = await asyncio.gather(*[predict(r) for r in gold])
    m = harness.evaluate(records, forced_keep_below=FORCED_KEEP_BELOW)
    print(f"--- LIVE gold-eval gate (FORCED_KEEP_BELOW={FORCED_KEEP_BELOW}) ---")
    print(harness.confusion_str(m))
    drop_ok = m.noise_drop_rate >= MIN_DROP
    ret_ok = m.retention_rate >= MIN_RETENTION_PROVISIONAL
    print(f"noise-drop ≥ {MIN_DROP:.0%}: {'PASS' if drop_ok else 'FAIL'} ({m.noise_drop_rate:.1%})")
    print(
        f"retention ≥ {MIN_RETENTION_PROVISIONAL:.0%} (PROVISIONAL): "
        f"{'PASS' if ret_ok else 'FAIL'} ({m.retention_rate:.1%})"
    )
    ok = drop_ok and ret_ok
    print("GATE:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


asyncio.run(main())
