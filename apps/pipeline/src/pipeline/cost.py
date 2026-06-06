"""Cost guard (Decision 5). A hard per-run item cap AND a daily-$ tripwire; on
breach the processor HALTS GRACEFULLY (the loop stops, logs, exits 0) — this
module never raises. Estimate-based: a runaway tripwire well above steady-state,
not real billing (that's 5.6/5.8). $ accumulation is per-run here; true daily
accumulation needs the 5.6 usage table."""

from __future__ import annotations

from dataclasses import dataclass

# Pricing per 1M tokens (USD), verified June 2026.
HAIKU_INPUT_USD_PER_MTOK = 1.0
HAIKU_OUTPUT_USD_PER_MTOK = 5.0
EMBED_USD_PER_MTOK = 0.02

_CHARS_PER_TOKEN = 4
_RUBRIC_SYSTEM_TOKENS = 400  # the fixed rubric system prompt
_CLASSIFY_OUTPUT_TOKENS = 40  # the tool result is tiny


def _tokens(text: str) -> int:
    return max(1, len(text) // _CHARS_PER_TOKEN)


def estimate_item_usd(classify_text: str, embed_text: str | None) -> float:
    """Rough $ for one item: a Haiku classify call + (if kept) an embedding call."""
    in_tok = _tokens(classify_text) + _RUBRIC_SYSTEM_TOKENS
    classify_usd = (
        in_tok / 1e6 * HAIKU_INPUT_USD_PER_MTOK
        + _CLASSIFY_OUTPUT_TOKENS / 1e6 * HAIKU_OUTPUT_USD_PER_MTOK
    )
    embed_usd = 0.0 if embed_text is None else _tokens(embed_text) / 1e6 * EMBED_USD_PER_MTOK
    return classify_usd + embed_usd


@dataclass
class CostGuard:
    """Tracks a run against the per-run item cap + the daily-$ ceiling. Checked at
    the top of each loop iteration; `record` after each processed item."""

    max_items: int
    daily_ceiling_usd: float
    items: int = 0
    usd: float = 0.0
    halted_reason: str | None = None

    def should_halt(self) -> bool:
        if self.items >= self.max_items:
            self.halted_reason = f"per-run cap reached ({self.max_items} items)"
            return True
        if self.usd >= self.daily_ceiling_usd:
            self.halted_reason = f"daily $ ceiling reached (${self.daily_ceiling_usd:.2f})"
            return True
        return False

    def record(self, usd: float) -> None:
        self.items += 1
        self.usd += usd
