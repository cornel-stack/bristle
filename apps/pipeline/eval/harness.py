"""Gold-eval harness — the DoD's measuring stick (FR-009/SC-001). Measures the
classifier TWO-SIDED on a committed gold set: drop ≥ 80% of true noise AND retain
the large majority of true problems (retention prioritized). The boundary is
keep-vs-noise (kept = label != 'noise' OR forced_keep); the four keep-types are
not gated.

Modes (5.2-OD-9):
  --live  : real Haiku over the gold items (the pass/fail DoD; ~$0.20).
  default : REPLAY the stored haiku predictions (deterministic, spend-free) — the
            CI regression guard.

Gold record (eval/gold_set.jsonl), one JSON object per line:
  {raw_item_id, title, body, gold_label, haiku_label, haiku_confidence}
`gold_label` is the human (founder-corrected) truth; haiku_* are the classifier's
recorded prediction used by the replay/regression path.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

GOLD_PATH = Path(__file__).parent / "gold_set.jsonl"
NOISE = "noise"


def load_gold(path: Path = GOLD_PATH) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def derived_kept(label: str, confidence: float | None, forced_keep_below: float) -> bool:
    """Mirrors the DB generated column + forced-keep (FR-011)."""
    if label != NOISE:
        return True
    return confidence is not None and confidence < forced_keep_below


@dataclass
class Metrics:
    n: int
    # confusion on KEEP/DROP vs gold
    tp: int  # gold-keep, predicted-keep (retained problem)
    fn: int  # gold-keep, predicted-drop (FALSE DROP — the costly error)
    fp: int  # gold-noise, predicted-keep (noise leaked through)
    tn: int  # gold-noise, predicted-drop (noise correctly dropped)

    @property
    def noise_drop_rate(self) -> float:
        denom = self.tn + self.fp
        return self.tn / denom if denom else 1.0

    @property
    def retention_rate(self) -> float:
        denom = self.tp + self.fn
        return self.tp / denom if denom else 1.0

    def passes(self, *, min_drop: float, min_retention: float) -> bool:
        return self.noise_drop_rate >= min_drop and self.retention_rate >= min_retention


def evaluate(records: list[dict], *, forced_keep_below: float) -> Metrics:
    tp = fn = fp = tn = 0
    for r in records:
        gold_keep = r["gold_label"] != NOISE
        pred_keep = derived_kept(r["haiku_label"], r.get("haiku_confidence"), forced_keep_below)
        if gold_keep and pred_keep:
            tp += 1
        elif gold_keep and not pred_keep:
            fn += 1
        elif not gold_keep and pred_keep:
            fp += 1
        else:
            tn += 1
    return Metrics(n=len(records), tp=tp, fn=fn, fp=fp, tn=tn)


def calibrate(
    records: list[dict], *, min_drop: float, candidates: list[float] | None = None
) -> tuple[float, Metrics]:
    """Pick the FORCED_KEEP_BELOW that MAXIMIZES retention while keeping
    noise-drop ≥ min_drop (retention prioritized). Higher threshold flips more
    low-confidence noise to keep → retention up, drop down."""
    grid = candidates or [round(0.05 * i, 2) for i in range(0, 21)]  # 0.0 … 1.0
    best: tuple[float, Metrics] | None = None
    for thr in grid:
        m = evaluate(records, forced_keep_below=thr)
        if m.noise_drop_rate >= min_drop:
            if best is None or m.retention_rate > best[1].retention_rate:
                best = (thr, m)
    if best is None:  # no threshold satisfies the drop floor — return the strongest-drop one
        best = min(((thr, evaluate(records, forced_keep_below=thr)) for thr in grid),
                   key=lambda t: t[1].fp)
    return best


def confusion_str(m: Metrics) -> str:
    return (
        f"n={m.n}\n"
        f"                 pred KEEP   pred DROP\n"
        f"  gold KEEP      TP={m.tp:<8} FN={m.fn:<8}  (retention {m.retention_rate:.0%})\n"
        f"  gold NOISE     FP={m.fp:<8} TN={m.tn:<8}  (noise-drop {m.noise_drop_rate:.0%})"
    )
