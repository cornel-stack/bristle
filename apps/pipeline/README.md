# apps/pipeline

Placeholder. No code ships here in the Walking Skeleton slice.

This directory will hold Bristle's ingestion and synthesis service: Python 3.12 +
FastAPI, orchestrated by Inngest, running ingest → cluster → enrich → synthesize
jobs on a 4–6h batch cadence. Real code arrives in **Tier 5 (Pipeline + Live
Data)** of the build plan.

It is intentionally **outside the JS/TS toolchain**. The pnpm workspace globs
(`pnpm-workspace.yaml`) select only `apps/web` and `packages/*`, so this service
is never seen by pnpm, Turborepo, ESLint, or the monorepo typecheck. It has no
`package.json` by design — adding one would pull it into the JS workspace.
