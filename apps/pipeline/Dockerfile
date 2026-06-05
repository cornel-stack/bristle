# Railway build for apps/pipeline (OD-3). uv-based, rooted at this directory.
FROM python:3.12-slim

# uv from the official image.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install locked runtime deps first (cached layer); skip dev tooling + the
# non-package project (Decision 3: package = false).
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
ENV PATH="/app/.venv/bin:$PATH"

# Railway provides $PORT. Serve the Inngest endpoint (/api/inngest) + /health.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn pipeline.main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir src"]
