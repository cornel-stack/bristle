"""FastAPI app (OD-3). Serves the Inngest endpoint at /api/inngest (the serve
model — Inngest Cloud triggers the cron over HTTP, signing-key verified) plus a
/health probe for Railway. Run: uvicorn pipeline.main:app --app-dir src."""

from __future__ import annotations

import fastapi
import inngest.fast_api

from pipeline.inngest_fns import hn_ingest, inngest_client, process_items

app = fastapi.FastAPI(title="Bristle Pipeline")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


# Registers POST/PUT/GET /api/inngest. Signing key from INNGEST_SIGNING_KEY (env).
# Both crons served: hn-ingest (5.1) + process-items (5.2).
inngest.fast_api.serve(app, inngest_client, [hn_ingest, process_items])
