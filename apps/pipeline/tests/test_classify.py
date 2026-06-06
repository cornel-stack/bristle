"""T018 — classifier tool-schema + forced-keep (pure, mocked Anthropic call)."""

from __future__ import annotations

import conftest
import pytest

from pipeline import classify


async def test_valid_tool_result_parses():
    s = conftest.make_settings(forced_keep_below=0.5)

    async def call(**_kw):
        return {"label": "bug", "reason": "broke", "confidence": 0.9}

    v = await classify.classify({"title": "t", "body": "b"}, call=call, settings=s)
    assert v.label == "bug" and v.confidence == 0.9 and v.forced_keep is False


async def test_malformed_result_raises_left_unprocessed():
    s = conftest.make_settings()

    async def bad_label(**_kw):
        return {"label": "garbage", "reason": "x", "confidence": 0.9}

    async def bad_conf(**_kw):
        return {"label": "bug", "reason": "x", "confidence": 2}

    with pytest.raises(ValueError):
        await classify.classify({"title": "t"}, call=bad_label, settings=s)
    with pytest.raises(ValueError):
        await classify.classify({"title": "t"}, call=bad_conf, settings=s)


async def test_low_confidence_noise_is_forced_keep():
    s = conftest.make_settings(forced_keep_below=0.5)

    async def call(**_kw):
        return {"label": "noise", "reason": "unsure", "confidence": 0.3}

    v = await classify.classify({"title": "t"}, call=call, settings=s)
    assert v.label == "noise" and v.forced_keep is True  # overridden → will be KEPT


async def test_high_confidence_noise_is_not_forced():
    s = conftest.make_settings(forced_keep_below=0.5)

    async def call(**_kw):
        return {"label": "noise", "reason": "job post", "confidence": 0.95}

    v = await classify.classify({"title": "t"}, call=call, settings=s)
    assert v.forced_keep is False  # confidently noise → dropped
