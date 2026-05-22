# Research: Supabase + Drizzle + One Persisted Problem

Phase 0 decisions. Format: Decision / Rationale / Alternatives.

## D1 — `postgres-js` driver with `{ prepare: false }` for runtime
- **Decision**: runtime client = `postgres(DATABASE_URL, { prepare: false })` wrapped by `drizzle()`.
- **Rationale**: user-locked driver; the Supabase Transaction pooler (port 6543) multiplexes connections and does **not** support prepared statements — leaving them on causes query failures. Memoized singleton to reuse the pool across server invocations.
- **Alternatives**: `pg` / `neon-http` — rejected (not the locked driver). Prepared statements on — rejected (pooler incompatibility).

## D2 — Separate `DATABASE_URL_DIRECT` for migrations (resolved Q1)
- **Decision**: migrations + drizzle-kit use `DATABASE_URL_DIRECT` (session mode, port 5432); runtime uses `DATABASE_URL` (pooler).
- **Rationale**: the migrator needs advisory locks and prepared statements the Transaction pooler lacks; session mode provides both. Clean separation avoids subtle migrate failures.
- **Alternatives**: migrate through the pooler with `prepare:false` — rejected per Q1 (fragile; advisory-lock behavior). Single URL — rejected.

## D3 — pgvector via migration `CREATE EXTENSION` prepend (resolved, R5)
- **Decision**: prepend `CREATE EXTENSION IF NOT EXISTS vector;` to the first generated migration, before the `CREATE TABLE`.
- **Rationale**: drizzle-kit doesn't emit extension creation; the `vector(1536)` column type requires the extension to exist first. `IF NOT EXISTS` keeps it idempotent; Supabase allowlists `vector`.
- **Alternatives**: enable via Supabase dashboard manually — rejected (not reproducible / not in the committed migration). Separate pre-migration step — rejected (extra moving part).

## D4 — Upsert on unique `slug` (revised)
- **Decision**: add a `slug` column (`text`, NOT NULL, UNIQUE); seed uses `ON CONFLICT (slug) DO UPDATE` with slug `stripe-webhooks-vercel-cold-starts`. `title` stays a plain `text` column (no uniqueness).
- **Rationale**: a stable, URL-safe identity that doubles as the key for the Tier 2 `/problems/[slug]` route — better than constraining `title` (which may change/duplicate) or embedding a magic UUID.
- **Alternatives**: `UNIQUE(title)` — rejected (titles can change; not URL-safe; no route alignment). Fixed UUID — rejected (opaque). Check-then-insert — rejected (race-prone).

## D5 — `tsx` to run TS migrate/seed scripts
- **Decision**: `db:migrate`/`db:seed` run `.ts` directly via `tsx`.
- **Rationale**: no separate build step for the db package; matches the monorepo's source-first packages.
- **Alternatives**: compile to JS then run — rejected (extra build). `node --experimental-strip-types` — rejected (less stable across the toolchain).

## D6 — `DATABASE_URL` missing → throw (no silent fallback)
- **Decision**: `getDb()` and the scripts throw explicitly if their required URL is unset.
- **Rationale**: spec edge case — a missing connection secret must fail loudly, never render broken/empty data.
- **Alternatives**: default to a local URL — rejected (hides misconfiguration).

## D7 — Narrowing cast for `quote_source`/`sources` text→`SourceKey`
- **Decision**: cast the DB `text`/`text[]` to the `SourceKey` union at the mapping boundary; no runtime validation this slice.
- **Rationale**: the seed is the only writer and supplies valid keys; full runtime validation (Zod) is unwarranted for one trusted seed row.
- **Alternatives**: Zod-parse the row — deferred (worth it once ingestion writes arbitrary data; out of scope now).

## D8 — Request-time dynamic render, no explicit caching
- **Decision**: the async Server Component reads per request; no `revalidate`/`force-static`.
- **Rationale**: simplest correct behavior for a single live row; caching strategy belongs to a later data slice.
- **Alternatives**: ISR/`revalidate` — deferred. Static + build-time fetch — rejected (couples build to DB availability).

## D9 — `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` documented-only (resolved Q3)
- **Decision**: present in `.env.example` and Vercel for forward compat; **not** read by app code this slice. All DB access is via the `postgres-js` connection string.
- **Rationale**: the read path is pure Postgres over the connection string; the Supabase JS client/keys aren't needed until auth/RLS/storage arrive.
- **Alternatives**: omit them now — rejected (user wants them configured ahead of later slices).
