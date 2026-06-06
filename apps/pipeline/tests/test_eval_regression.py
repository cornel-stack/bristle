"""T034 — the gold-eval REGRESSION GUARD (mocked/replay, deterministic, spend-free
— 5.2-OD-9). Replays the stored Haiku predictions in the committed gold set
against the founder's labels and asserts the two-sided bar holds. This is CI's
no-regress check; the certified pass/fail is the `--live` run (T035).

FORCED_KEEP_BELOW=0.5 (kept per the founder). The retention floor is PROVISIONAL
— finalized against representative sources in 028 per 5.2-OD-7 (the gold set here
is story-titles-only)."""

from __future__ import annotations

from eval import harness

FORCED_KEEP_BELOW = 0.5
MIN_DROP = 0.80
MIN_RETENTION_PROVISIONAL = 0.80


def test_gold_set_regression_guard():
    recs = harness.load_gold()
    assert len(recs) >= 150, f"gold set too small: {len(recs)}"

    m = harness.evaluate(recs, forced_keep_below=FORCED_KEEP_BELOW)

    # Two-sided bar on the replayed predictions vs the founder's gold labels.
    assert m.noise_drop_rate >= MIN_DROP, f"noise-drop regressed:\n{harness.confusion_str(m)}"
    assert m.retention_rate >= MIN_RETENTION_PROVISIONAL, (
        f"retention regressed (provisional floor):\n{harness.confusion_str(m)}"
    )
