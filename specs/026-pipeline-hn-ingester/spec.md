# Feature Specification: Python Pipeline Scaffold + Hacker News Ingester

**Feature Branch**: `026-pipeline-hn-ingester`

**Created**: 2026-06-05

**Status**: **Decisions settled 2026-06-05** — the five Foundational Decisions are confirmed (see "Decisions settled" below). Spec is ready for `/speckit.plan` **when the founder gives the go** (explicitly held: no plan, tasks, or code yet).

## Decisions settled (2026-06-05)

| # | Decision | Settled outcome |
|---|---|---|
| 1 | Dev/prod DB split | **Separate Supabase _project_ for dev.** Existing project → canonical **prod** (keeps fixtures); new project → **dev**. **And re-point the local web app to dev too** (a clean, complete split — no half-state). prod-pipeline → prod `raw_items`; dev-pipeline → dev `raw_items`. |
| 2 | Pipeline schema + DDL ownership | **As recommended:** migration `0005`, additive, no app table touched; **Drizzle is the single migration authority**; Python reads/writes via a driver; **single `UNIQUE(content_hash)`** as the dedup key, `(source,source_id)` + `(source,source_created_at)` as plain indexes. |
| 3 | Python tooling | **uv** + `pyproject.toml` + `uv.lock`, Python 3.12; `apps/pipeline` stays **out** of the pnpm/Turbo workspace; standalone ruff+pytest CI. |
| 4 | Idempotency/reliability | **Layered:** DB `UNIQUE(content_hash)` + `ON CONFLICT DO NOTHING` is the primary guarantee; Inngest cron `0 */4 * * *`, `concurrency:1`, retries; **stateless watermark from `max(source_created_at)`** (no `ingest_state` table). Keyless Algolia HN; 429/5xx backoff. |
| 5 | Secrets/env | **As recommended:** Railway holds prod `DATABASE_URL` (→ prod Supabase) + Inngest keys; gitignored `apps/pipeline/.env` → dev Supabase; **no Algolia key**; isolation by secret scoping, not code branches. |

> Decisions 2 and 5 had no contested fork at review; recorded as settled-as-recommended — flag any late objection before planning.

**Slice**: Build-plan **5.1** (Tier 5 — Pipeline + Live Data; Weeks 8–11). The **foundation slice** of the most engineering-heavy tier. Tier 5 ships **v0.5.0 — live-data**.

**Input**: User description: "Build-plan 5.1 — `apps/pipeline/` with FastAPI, Inngest for orchestration, deployed on Railway. A Hacker News ingester via the Algolia HN Search API runs every 4 hours and writes to a new `raw_items` table with content-hash dedup. DoD: the job runs autonomously, `raw_items` populates, no duplicates."

---

## Why this slice is different

This is **infrastructure, not a screen**. There is no design PDF, no user-facing surface, no microcopy. The "user" is the operator (the founder) and the consumers are **slices 5.2–5.10**, which all read from the table and conventions this slice lays down. The five Foundational Decisions below are the actual deliverable for review — they are load-bearing for the whole tier and **hard to change once real data is flowing**. The spec is intentionally scoped to *only* the autonomous HN ingest → `raw_items` with dedup; everything downstream is out of scope (see below) but is considered here for forward-compatibility.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The ingest job runs autonomously and `raw_items` populates (Priority: P1)

The operator deploys the pipeline once. Thereafter, every 4 hours and with no human in the loop, the Hacker News ingester wakes on schedule, pulls recent HN items from the Algolia HN Search API, and writes them as rows into `raw_items`. The operator can come back hours or days later and see the table growing on its own.

**Why this priority**: This is the DoD's first clause ("runs autonomously; raw_items populating"). Without autonomous scheduled ingest there is no pipeline.

**Independent Test**: Deploy the pipeline; trigger the scheduled function once (and/or wait for a cron tick); observe `raw_items` row count increase, with rows carrying real HN titles/URLs/authors/timestamps and a populated `source = 'hn'`. Re-observe after the next 4h tick and see new rows appended without manual intervention.

**Acceptance Scenarios**:

1. **Given** a deployed pipeline and an empty (or partially filled) `raw_items`, **When** the scheduled ingest runs, **Then** new HN items appear as rows with `source='hn'`, a `source_id`, a `content_hash`, the title/url/author/points/comments, the original post time, the full raw payload, and an `ingested_at` stamp.
2. **Given** the job has run once, **When** 4 hours elapse, **Then** the job runs again on its own and appends only items not already present.
3. **Given** the operator inspects the service, **When** they look at run logs, **Then** each run reports how many items were fetched, inserted, and skipped-as-duplicate.

---

### User Story 2 — No duplicates, ever, across overlapping / retried / double-fired runs (Priority: P1)

However the job is invoked — on its normal cron, retried after a failure, accidentally double-fired, or overlapping a previous slow run — the same HN item is **never** written twice. The dedup guarantee holds at the database level, not by hopeful application logic.

**Why this priority**: This is the DoD's correctness clause ("no duplicates") and the part most likely to be scrutinized. A pipeline that double-counts corrupts every downstream frequency/momentum metric in 5.2–5.9.

**Independent Test**: Run the ingest twice back-to-back over an overlapping time window (or invoke the function concurrently). Assert that `count(*)` of `raw_items` equals `count(distinct content_hash)`, and that the second run reports its overlap as skipped-duplicates rather than inserting them.

**Acceptance Scenarios**:

1. **Given** an item already in `raw_items`, **When** a later run re-fetches that same item, **Then** no second row is written and the run counts it as a skip.
2. **Given** two ingest runs executing concurrently (double-fire or overlap), **When** both attempt to write the same item, **Then** exactly one row exists afterward (the database constraint, not a race-prone check-then-insert, enforces this).
3. **Given** a run crashes mid-way after writing some items, **When** the next run executes over the same window, **Then** it re-fetches the window and writes only the items the crashed run missed — no duplicates of the ones it did write.

---

### User Story 3 — A dev pipeline run cannot pollute the production demo database (Priority: P1)

The operator can run and iterate on the pipeline locally without any risk of writing real HN data into the database that serves the live app and its 15 hand-built demo fixtures. Dev writes land in a dev database; prod writes land in a prod database; the two never cross.

**Why this priority**: Through Tier 4 the project ran dev==prod on one shared Supabase. The instant a pipeline writes real rows, that shared-DB posture becomes a hazard: a local test run would inject live HN noise beside the curated fixtures the demo and reviewers depend on (and which slice 5.5 explicitly preserves as test data). This is the founder's stated top concern and is settled in **Foundational Decision 1**.

**Independent Test**: Point a local pipeline run at the dev database, ingest, and confirm `raw_items` grows there; then confirm the prod database's `raw_items` and its `problems`/`categories`/demo-user fixtures are byte-for-byte unchanged.

**Acceptance Scenarios**:

1. **Given** a local dev pipeline run, **When** it writes to `raw_items`, **Then** the rows land in the **dev** database and the **prod** database is untouched.
2. **Given** the prod-deployed pipeline, **When** it runs, **Then** it writes only to the **prod** database, never to dev.
3. **Given** either environment, **When** the ingest writes, **Then** it touches only `raw_items` and writes nothing to any existing app table (`problems`, `categories`, `users`, the 15 fixtures, …).

---

### Edge Cases

- **Overlapping runs / double-fire** — two invocations race on the same item: the DB unique constraint guarantees one row (Decision 4). Orchestrator concurrency is additionally capped at 1.
- **Mid-run crash** — partial writes are consistent (each insert is independent + idempotent); the next windowed re-fetch completes the gap without duplicating (Decision 4).
- **Algolia rate-limit (HTTP 429) or transient 5xx** — the run backs off and retries; the orchestrator's retry policy re-runs the step; dedup absorbs any re-fetch overlap.
- **Algolia endpoint changes shape / a field is missing** — the full payload is stored in `raw` (jsonb) so a row is never lost to a parsing gap; nullable columns tolerate link-only (Ask HN) posts with no `url`, or posts with no `body`.
- **Empty window** — a run that finds nothing new inserts nothing, logs `fetched=N inserted=0 skipped=N`, and exits cleanly (not an error).
- **Clock skew / watermark boundary** — the fetch window overlaps the previous window deliberately; dedup makes the overlap harmless, so a missed item at the boundary is recovered next run.
- **Schema drift** — the migration is additive and pipeline-namespaced; it must not alter, drop, or re-type any existing app column (Decision 2).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST run a Hacker News ingest autonomously on a fixed schedule of **every 4 hours**, with no manual trigger required after deployment.
- **FR-002**: Each run MUST fetch recent items from the **Algolia HN Search API** and persist each item as a row in a new **`raw_items`** table.
- **FR-003**: `raw_items` MUST be **forward-compatible with multiple sources** — it carries a `source` discriminator (`'hn'` for this slice; `github` / `stackoverflow` arrive in 5.6/5.7) so later ingesters reuse the same table without a reshape.
- **FR-004**: The system MUST guarantee **no duplicate rows** for the same item across any combination of normal, retried, overlapping, or double-fired runs. The guarantee MUST be enforced by a **database unique constraint** (on the content hash), not by application-level check-then-insert.
- **FR-005**: Writes MUST be **idempotent** — re-ingesting an already-seen item is a no-op that the run counts as a skip (insert-or-ignore semantics).
- **FR-006**: A **dev pipeline run MUST NOT write to the production database**. Dev and prod ingest target separate databases (Decision 1); neither can pollute the other.
- **FR-007**: The migration that adds `raw_items` MUST be **additive and pipeline-namespaced** — it MUST NOT alter, drop, re-type, or write to any existing app table (`problems`, `problem_*`, `categories`, `users`, `saved_*`, `alert_*`, `usage_meters`, fixtures).
- **FR-008**: The ingest MUST be **resilient to Algolia rate-limits and transient errors** — backoff + retry on 429/5xx, and recover from a mid-run crash on the next run without duplicating already-written rows.
- **FR-009**: Each run MUST emit **observable run output** — counts of fetched / inserted / skipped-duplicate / errored, sufficient to verify the DoD from logs.
- **FR-010**: All credentials (database connection, orchestrator keys) MUST be supplied via **environment/secrets held by the deploy platform** (Railway) and a gitignored local env for dev — never committed (Decision 5). The Algolia HN endpoint requires **no API key** (Decision 5).
- **FR-011**: The pipeline service MUST live in **`apps/pipeline/` and stay outside the JS/pnpm/Turbo workspace** so it never enters the JS toolchain (Decision 3).
- **FR-012**: The `raw_items` schema MUST remain the **single source of truth in one migration history** (Drizzle-owned in `packages/db`); the Python service reads/writes the table without maintaining a second, divergent schema or migration tool (Decision 2).

### Key Entities

- **`raw_items`** (new; the only table this slice adds): an append-only capture of one ingested source item before any classification or clustering. Attributes (final shape settled in Decision 2): `id`, `source`, `source_id`, `content_hash` (unique — the dedup key), `title`, `body`, `url`, `author`, `points`, `num_comments`, `source_created_at`, `raw` (full payload, jsonb), `ingested_at`. It references **no** app table; downstream slices add classification/embedding/cluster linkage **additively** later.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** (autonomous): With zero manual intervention after deploy, `raw_items` grows on the 4-hour cadence — verifiable by observing row count increase across at least two consecutive scheduled ticks.
- **SC-002** (populating correctly): Every ingested row carries a non-null `source='hn'`, `source_id`, `content_hash`, `source_created_at`, `raw`, and `ingested_at`; spot-checking 10 rows shows real HN titles/links matching the live site.
- **SC-003** (no duplicates — the correctness bar): At all times `count(*) == count(distinct content_hash)` in `raw_items`; running the ingest twice over an overlapping window adds each item at most once; a forced concurrent double-run leaves exactly one row per item.
- **SC-004** (dev isolation): A local dev ingest increases dev `raw_items` while prod `raw_items` and all prod app fixtures remain unchanged (and vice-versa).
- **SC-005** (no app-table impact): After the migration and many ingest runs, every pre-existing app table is structurally and (for the 15 fixtures + demo user) data-identical to before — the pipeline touched only `raw_items`.
- **SC-006** (resilience): An injected 429/timeout during a run does not crash the schedule or produce duplicates; the next run proceeds normally.

---

## Foundational Decisions *(the deliverable for review — settle these before any plan/tasks/code)*

> Each decision is grounded in the **current** repo state, lays out the real options, and gives a recommendation marked **[DECISION — confirm]**. They are sequenced because later ones depend on earlier ones. 5.2–5.10 inherit all five.

### Decision 1 — Dev/prod database split *(the one the founder cares most about)*

**Grounded context.** Today there is **one shared Supabase project**, used as both dev and prod. The wiring (verified):
- `DATABASE_URL` → Supabase **Transaction pooler** (port 6543), opened with `prepare: false` (the pooler can't do prepared statements). This is the app's runtime + the seed script.
- `DATABASE_URL_DIRECT` → Supabase **session/direct** connection (port 5432). Used **only** by the Drizzle migrator (`drizzle.config.ts`), which needs advisory locks + prepared statements the pooler lacks.
- Both are declared in the root `.env.local` and in `turbo.json`'s `build.env`. The shared project holds the 15 demo problems, the `demo@bristle.dev` user, and all Tier-4 fixtures.

This was fine for hand-seeded fixtures (a re-seed is deterministic and idempotent). It becomes a hazard the moment a pipeline writes **real, non-deterministic** HN rows: a single local test run would inject live noise into the database the demo and reviewers read — and slice **5.5 explicitly preserves the fixture seed data "as test data,"** so prod must stay curated.

**Options.**

| # | Option | Isolation | Cost / effort | Notes |
|---|---|---|---|---|
| a | **Separate Supabase _project_ for dev** | Full (separate Postgres, pooler, pgvector) | Free tier allows 2 projects; ~30 min one-time setup | Mirrors prod semantics exactly; the existing project becomes canonical **prod**, a new one becomes **dev** |
| b | Supabase **branching** (preview branch DBs) | Full, ephemeral | Paid feature on current plans; branch lifecycle to manage | Nice for PR previews later; heavier than needed now |
| c | Separate **schema** in one project (`pipeline_dev` vs `public`) | Partial (same instance, same creds) | Cheap | `search_path` juggling; a bad migration/run can still reach prod tables; doesn't protect the demo data as cleanly |
| d | **Env-switched connections** only (no second DB) | None (same DB, different URL var) | Cheap | Just renames the risk; a dev run still hits the one prod DB |
| e | **Status quo** (dev==prod) | None | Zero | Unacceptable once real data flows — the hazard this decision exists to remove |

**[SETTLED → option (a)]: a separate Supabase _project_ for dev**, created now while no real data exists (so the split is painless and there's nothing to migrate). Concretely:
- The **existing** Supabase project is **promoted to canonical PROD**. It keeps the 15 fixtures + demo user (5.5's "test data").
- A **new** Supabase project becomes **DEV**. Migration `0005` (and the full existing migration chain) is applied to it, and the fixtures are re-seeded there for local work.
- **prod-pipeline writes to:** the PROD project's `raw_items` (Railway's `DATABASE_URL` → prod).
- **dev-pipeline writes to:** the DEV project's `raw_items` (local `apps/pipeline/.env` → dev).
- **app prod reads** prod; **local app dev reads** dev. Both keep the same two-URL pattern (pooler for runtime, direct for the migrator).

*Fallback if a second project is unwanted:* option (c) separate schema, accepting weaker isolation. Option (e) is explicitly rejected.

*Sub-question — [SETTLED]:* **re-point the local web app to dev too** (a clean full dev/prod split). No half-state — both the pipeline and the local web app read dev; prod stays untouched and serves the live app.

---

### Decision 2 — Pipeline schema additions (`raw_items`) + who owns the DDL

**Grounded context.** The last migration is **`0004_worried_black_bird`** (the 4.1 app-fixtures schema). `raw_items` does not exist — this slice's migration is **`0005`**, the first since Tier 4. Drizzle owns the migration history (`packages/db/drizzle/`, `_journal.json` has 5 entries 0000–0004). The app schema lives in `packages/db/src/schema.ts` (+ `auth-schema.ts`).

**Proposed `raw_items` shape (additive, pipeline-namespaced):**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, default `gen_random_uuid()` | surrogate key |
| `source` | `text` NOT NULL | `'hn'` now; `'github'` / `'stackoverflow'` later (FR-003) |
| `source_id` | `text` NOT NULL | the Algolia `objectID` (the HN item id) |
| `content_hash` | `text` NOT NULL **UNIQUE** | sha256 hex over normalized **stable** content (`source` + `source_id` + `title` + `url` + `body`) — **the dedup guarantee (Decision 4)**; deliberately excludes volatile `points`/`num_comments` so a re-fetch hashes identically |
| `title` | `text` | nullable (defensive) |
| `body` | `text` | story/comment text; null for link-only posts |
| `url` | `text` | external link; null for Ask HN |
| `author` | `text` | HN author handle |
| `points` | `integer` | volatile signal; not in the hash |
| `num_comments` | `integer` | volatile signal; not in the hash |
| `source_created_at` | `timestamptz` NOT NULL | original HN post time (for watermarking) |
| `raw` | `jsonb` NOT NULL | full Algolia hit, for lossless reprocessing in 5.2+ |
| `ingested_at` | `timestamptz` NOT NULL default `now()` | when we captured it |

**Constraints/indexes:** `UNIQUE (content_hash)` (the dedup key); a **non-unique** btree index on `(source, source_created_at)` for watermark queries and a btree on `(source, source_id)` for lookups/debugging. A *single* unique constraint keeps `INSERT … ON CONFLICT (content_hash) DO NOTHING` unambiguous (Decision 4). *(Alternative: also make `(source, source_id)` unique — rejected for now to avoid two conflict targets on one insert; `source_id` is already folded into the hash.)*

**Sub-decision — DDL ownership.** The constitution §3 says "all database access through Drizzle" — but that rule governs the **web app**; the pipeline is a separate Python service that cannot use Drizzle. The question is who owns the *schema*:

| Option | Result |
|---|---|
| **Drizzle owns all DDL** (define `raw_items` in `packages/db`, generate `0005`); Python reads/writes via a Python driver against the existing table | **One** linear migration history; the web app gets typed access to `raw_items` for free in 5.5; Python never defines schema |
| Python owns pipeline DDL (a second migrator, e.g. Alembic) | Two divergent migration histories on one database — drift risk, ordering hazards |

**[SETTLED]: Drizzle remains the single migration authority.** `raw_items` is added as Drizzle migration `0005` (in a `packages/db` schema module, namespaced separately from `problems`); the Python service treats the table as given and reads/writes it with a Python driver (Decision 3). **Confirmed: the migration touches no app table** — it only `CREATE TABLE raw_items` + its indexes (FR-007).

---

### Decision 3 — Python in a pnpm/Turbo monorepo

**Grounded context.** `apps/pipeline/` exists as a **README-only placeholder** and is **deliberately outside** the JS workspace: `pnpm-workspace.yaml` globs only `apps/web` + `packages/*`, and the README states it has "no `package.json` by design — adding one would pull it into the JS workspace." So pnpm, Turborepo, ESLint, and the monorepo typecheck never see it. That posture is correct and should be preserved.

**Options / shape.**
- **Dependency tooling:** **uv** (recommended — fast, single tool, `pyproject.toml` + `uv.lock`, first-class on Railway) vs **poetry** (mature but slower, heavier).
- **Layout** (proposed): `apps/pipeline/{pyproject.toml, uv.lock, .python-version (3.12), src/pipeline/{__init__.py, main.py (FastAPI app + Inngest handler), ingest/hn.py, db.py, settings.py}, tests/, README.md, Dockerfile-or-Nixpacks}`.
- **Monorepo coexistence:** the service is **built and deployed independently on Railway** (its own build, rooted at `apps/pipeline/`); Turbo's task graph stays JS-only and never invokes Python. A **separate Python CI job** (ruff + pytest) runs outside the Turbo pipeline.

**[SETTLED]: keep `apps/pipeline` out of the pnpm/Turbo workspace (no `package.json`); use uv + `pyproject.toml` + `uv.lock`; Python 3.12; a FastAPI app exposing the Inngest endpoint; a standalone ruff+pytest CI job.** This honors the existing deliberate exclusion and the constitution's locked stack (FastAPI, Inngest, Railway, Python 3.12).

---

### Decision 4 — Idempotency + reliability of an autonomous job *(the correctness claim)*

**Grounded context.** The DoD is a correctness claim ("runs autonomously, no duplicates"). The constitution locks **Inngest** for scheduling/retries/fan-out and a **4–6h** batch cadence (this slice: 4h).

**The guarantee, layered:**
1. **Dedup is a database invariant, not app logic.** `UNIQUE (content_hash)` + `INSERT … ON CONFLICT (content_hash) DO NOTHING`. Because the constraint is enforced by Postgres, **no** interleaving of overlapping / retried / double-fired runs can produce a second row — even two concurrent inserts of the same item resolve to exactly one row. This is the heart of SC-003.
2. **Windowed re-fetch with deliberate overlap.** Each run fetches HN items by `created_at` over a window that overlaps the previous window (e.g. last ~5h for a 4h cadence). The overlap guarantees no boundary item is missed; dedup makes the overlap free of cost. *(The watermark can be derived from `max(source_created_at)` in `raw_items` — no separate cursor table needed for 5.1.)*
3. **Crash recovery by construction.** Each item insert is independent and idempotent, so a mid-run crash leaves a consistent partial state; the next windowed run re-covers the window and fills only the gaps.
4. **Orchestrator reliability (Inngest):** a scheduled function on cron `0 */4 * * *`; **`concurrency: 1`** so two runs never overlap; **step durability + retries** on the fetch/write steps; an **idempotency key** on the scheduled event to neutralize double-fires. *(Even if all of these failed, layer 1 still prevents duplicates — defense in depth.)*
5. **Algolia specifics:** the **HN endpoint `https://hn.algolia.com/api/v1`** is public and **needs no API key** (surfaced in Decision 5); handle **429** and transient **5xx** with bounded exponential backoff, then let Inngest retry the step.

**[SETTLED]: the layered model above**, with the DB unique constraint as the primary, non-negotiable guarantee and Inngest concurrency/retries as belt-and-suspenders. *Sub-question — [SETTLED]:* derive the watermark **statelessly from `max(source_created_at)`**; no `ingest_state` table at 5.1 (revisit if multi-source/cost telemetry needs it later).

---

### Decision 5 — Secrets / env, and how the pipeline reaches the chosen DB

**Grounded context.** Today secrets live in the root `.env.local` (gitignored) and are mirrored into Vercel + `turbo.json` build env for the web app. The pipeline is a new, separately-deployed Railway service that needs its own secret store.

**Proposed wiring:**
- **Railway (prod pipeline) holds:** `DATABASE_URL` → the **PROD** Supabase from Decision 1 (Transaction pooler, `prepare:false` semantics, reached from Python via an async driver); the **Inngest** signing key + event key; and (later, 5.2+) the LLM/embedding keys. The pipeline is a long-lived worker, so it connects through the **pooler** for runtime writes; the migrator (direct/5432 URL) stays a Drizzle/`packages/db` concern (Decision 2), so the pipeline only needs the runtime URL.
- **Local dev pipeline reads** `apps/pipeline/.env` (**gitignored**) → the **DEV** Supabase from Decision 1 + a local/dev Inngest dev-server key.
- **No Algolia key** is configured — the HN Algolia endpoint is keyless. Only the base URL is needed (a constant, not a secret).

**[SETTLED]: the wiring above:** Railway secret store for prod (DB → prod Supabase, Inngest keys), gitignored `apps/pipeline/.env` for dev (DB → dev Supabase), no Algolia credential. The pipeline reaches the Decision-1 database purely by which `DATABASE_URL` its environment carries — prod env → prod DB, dev env → dev DB — so the dev/prod isolation is enforced by **secret scoping, not by code branches**.

---

## Assumptions

- **A1 — Dev/prod split is in scope for this slice** (Decision 1), because it is unsafe to defer past the first real write. If the founder prefers, the *schema-level* split (option c) is the lighter fallback, but a second project is recommended.
- **A2 — `raw_items` is the only schema change.** No app table is touched; no `problems`/`categories`/fixtures change. Downstream columns (classification, embedding refs, cluster id) are added additively in 5.2+ / their own migrations, not here.
- **A3 — Drizzle stays the single migration authority** (Decision 2); Python does not introduce a second migrator.
- **A4 — `apps/pipeline` stays out of the pnpm/Turbo workspace** (Decision 3); no `package.json` is added.
- **A5 — content_hash hashes stable content only** (excludes volatile `points`/`num_comments`) so re-fetches dedup cleanly (Decision 2/4).
- **A6 — Algolia HN endpoint is public/keyless**, generous rate limits, and is the agreed HN source (per the build plan's "Algolia API").
- **A7 — "Autonomous" means orchestrator-scheduled** (Inngest cron), not a hand-run script; the DoD's autonomy is satisfied by the deployed schedule.
- **A8 — Volume at 5.1 scale is small** (hundreds–low-thousands of HN items/run), so window-refetch is fine and no cursor table or pagination-state store is needed yet.

## Out of scope (this slice — considered only for forward-compatibility)

- **Classification / filtering** (complaint/feature/wish/bug/noise) and **embeddings** in pgvector — slice **5.2**.
- **Clustering** of raw items into problems — slice **5.3**.
- **Enrichment + synthesis** into the `problems` table — slice **5.4**.
- **Fixtures → live-data swap** (re-pointing the app's reads, flipping the `getAppUser` seam) — slice **5.5** (which also preserves the fixtures as test data).
- **GitHub Issues / Stack Overflow ingesters** + `tracked_repos` — slices **5.6 / 5.7**.
- **Admin dashboard, cost controls, momentum aggregates, quality tuning** — slices **5.8–5.10**.
- Backfill of historical HN beyond the rolling ingest window; comment-tree ingestion; non-HN sources.

## Dependencies

- **Supabase** — a second (dev) project provisioned (Decision 1); pgvector already enabled on the existing project (used later, not in 5.1).
- **Railway** — a project/service for `apps/pipeline` with a secret store (Decision 5).
- **Inngest** — account + signing/event keys for scheduling, retries, concurrency (Decision 4).
- **Algolia HN Search API** (`hn.algolia.com/api/v1`) — public, keyless (Decision 5).
- **`packages/db`** — owner of migration `0005` adding `raw_items` (Decision 2); the existing two-URL connection convention (`DATABASE_URL` pooler / `DATABASE_URL_DIRECT` migrator).
- The constitution's locked stack: Python 3.12 + FastAPI, Inngest, Railway, Supabase Postgres + Drizzle.

## Review gate

**Decisions settled 2026-06-05** (see the summary table at top). The spec is ready for `/speckit.plan` — but planning is **explicitly held** until the founder gives the go. No `/speckit.plan`, `/speckit.tasks`, or code has been started. Next external prerequisites before/while planning: provision the **dev Supabase project** (Decision 1), a **Railway** service + secret store (Decision 5), and **Inngest** keys (Decision 4).
