"""Keep/drop classifier (Decision 2). ONE Claude Haiku tool-use call → a 5-way
`label` + short reason + confidence; keep/drop is DERIVED downstream
(`kept = label != 'noise' OR forced_keep`). Low-confidence noise → forced-keep
(FR-011, bias against false-drops). The Anthropic call is an injectable seam so
tests never spend (the 5.1 `fetch` pattern)."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from pipeline.settings import Settings

# The 5-way label (build-plan vocabulary). Keep = anything but noise (5.2-OD-2 text).
LABELS = ("complaint", "bug", "feature-request", "wish", "noise")

# The rubric IS the prompt's backbone (spec → "Classification rubric"). The DoD
# gates the noise-vs-keep boundary; the four keep-types are best-effort.
RUBRIC_SYSTEM = """\
You classify items from developer forums to find genuine problems worth solving.
Return exactly one label via the classify_item tool:

- complaint: pain with an existing tool / service / workflow.  (KEEP)
- bug: something is broken.  (KEEP)
- feature-request: a capability that does not exist yet.  (KEEP)
- wish: latent / unmet demand ("is there a tool that…").  (KEEP)
- noise: job/hiring posts, launches/self-promotion, news/announcements, answered
  how-to questions, off-topic, or chatter with NO pain or gap.  (DROP)

Judge the noise-vs-keep boundary carefully — that is what matters. `reason` is one
short clause. `confidence` is your certainty in [0,1] that the label is correct."""

CLASSIFY_TOOL: dict[str, Any] = {
    "name": "classify_item",
    "description": "Record the classification of a developer-forum item.",
    "input_schema": {
        "type": "object",
        "properties": {
            "label": {"type": "string", "enum": list(LABELS)},
            "reason": {"type": "string", "description": "one short clause"},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        },
        "required": ["label", "reason", "confidence"],
    },
}

# call(system, user, tool, model) -> the tool_use input dict {label, reason, confidence}.
ClassifyCall = Callable[..., Awaitable[dict[str, Any]]]

# A rough chars→tokens factor (no tiktoken dep); the body bound is a coarse knob.
_CHARS_PER_TOKEN = 4


@dataclass(frozen=True)
class Verdict:
    label: str
    reason: str | None
    confidence: float | None
    forced_keep: bool


def build_classify_text(item: dict[str, Any], body_tokens: int) -> str:
    """Title + a bounded slice of body (FR-010). Tolerant of nulls."""
    title = (item.get("title") or "").strip()
    body = (item.get("body") or "").strip()[: body_tokens * _CHARS_PER_TOKEN]
    return f"{title}\n\n{body}".strip() or "(no text)"


def parse_verdict(tool_input: dict[str, Any]) -> dict[str, Any]:
    """Validate the tool result. A malformed/invalid result RAISES → the item is
    left unprocessed and retried (never written as a guessed verdict, FR-007)."""
    label = tool_input.get("label")
    if label not in LABELS:
        raise ValueError(f"classifier returned invalid label: {label!r}")
    conf = tool_input.get("confidence")
    if not isinstance(conf, int | float) or not (0.0 <= float(conf) <= 1.0):
        raise ValueError(f"classifier returned invalid confidence: {conf!r}")
    reason = tool_input.get("reason")
    return {"label": label, "reason": reason, "confidence": float(conf)}


def apply_forced_keep(parsed: dict[str, Any], forced_keep_below: float) -> Verdict:
    """FR-011: a sub-threshold NOISE call is overridden to keep (forced_keep=True);
    `kept` is then DB-derived as true. Keep-type labels are already kept. The raw
    confidence is preserved either way (for 5.10)."""
    forced = parsed["label"] == "noise" and parsed["confidence"] < forced_keep_below
    return Verdict(
        label=parsed["label"],
        reason=parsed["reason"],
        confidence=parsed["confidence"],
        forced_keep=forced,
    )


async def classify(item: dict[str, Any], *, call: ClassifyCall, settings: Settings) -> Verdict:
    text = build_classify_text(item, settings.classify_body_tokens)
    tool_input = await call(
        system=RUBRIC_SYSTEM,
        user=text,
        tool=CLASSIFY_TOOL,
        model=settings.classifier_model,
    )
    return apply_forced_keep(parse_verdict(tool_input), settings.forced_keep_below)


def make_anthropic_call(api_key: str) -> ClassifyCall:
    """The production call — one forced tool-use Haiku request, returns the tool
    input. Imports the SDK lazily so tests (which inject `call`) need no key."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)

    async def call(*, system: str, user: str, tool: dict[str, Any], model: str) -> dict[str, Any]:
        msg = await client.messages.create(
            model=model,
            max_tokens=256,
            system=system,
            messages=[{"role": "user", "content": user}],
            tools=[tool],
            tool_choice={"type": "tool", "name": tool["name"]},
        )
        for block in msg.content:
            if getattr(block, "type", None) == "tool_use":
                return dict(block.input)
        raise ValueError("classifier returned no tool_use block")

    return call
