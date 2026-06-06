"""Embedder (Decision 3). OpenAI text-embedding-3-small @ 1536 dims (locked by
problems.embedding consistency). Embeds title + a bounded slice of body (FR-010).
The OpenAI call is an injectable seam so tests never spend."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from pipeline.settings import Settings

# call(text, model, dimensions) -> the embedding vector.
EmbedCall = Callable[..., Awaitable[list[float]]]

_CHARS_PER_TOKEN = 4  # coarse chars→tokens factor (no tiktoken dep)


def build_embed_text(item: dict[str, Any], body_tokens: int) -> str:
    """Title + a bounded slice of body (FR-010, EMBED_BODY_TOKENS). Tolerant of nulls."""
    title = (item.get("title") or "").strip()
    body = (item.get("body") or "").strip()[: body_tokens * _CHARS_PER_TOKEN]
    return f"{title}\n\n{body}".strip() or "(no text)"


async def embed(item: dict[str, Any], *, call: EmbedCall, settings: Settings) -> list[float]:
    text = build_embed_text(item, settings.embed_body_tokens)
    vec = await call(
        text=text,
        model=settings.embedding_model,
        dimensions=settings.embedding_dimensions,
    )
    if len(vec) != settings.embedding_dimensions:
        raise ValueError(
            f"embedding has {len(vec)} dims, expected {settings.embedding_dimensions}"
        )
    return vec


def make_openai_call(api_key: str) -> EmbedCall:
    """The production call — one embeddings request. Lazy SDK import so tests
    (which inject `call`) need no key."""
    import openai

    client = openai.AsyncOpenAI(api_key=api_key)

    async def call(*, text: str, model: str, dimensions: int) -> list[float]:
        resp = await client.embeddings.create(model=model, input=text, dimensions=dimensions)
        return list(resp.data[0].embedding)

    return call
