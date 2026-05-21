# Feature Specification: Supabase + Drizzle + One Persisted Problem

**Feature Branch**: `004-supabase-drizzle-persisted-problem`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "Slice 1.4 (Tier 1): Wire Supabase Postgres + pgvector to the monorepo via Drizzle (postgres-js, transaction pooler, prepare:false); define a minimal `problems` table matching the ProblemCardFull contract; generate + commit the first migration; seed and render one persisted problem; turn the homepage back into a Server Component that fetches from the database; remove the throwaway theme toggle."

## Overview

This slice replaces the hardcoded card fixture with a real persistence path: a managed Postgres database (with the vector extension provisioned for future semantic work), a version-controlled schema and migration, a typed data-access layer in the shared `db` package, one seeded problem record, and a homepage that reads that record from the database and renders it through the canonical `ProblemCardFull` component built in Slice 1.3. It is the first slice where the product surface is backed by data instead of literals — proving the full read path from database → server render → existing design-system component, end to end and on the deployed preview, before any ingestion, auth, or multi-row UI exists.

The visible change is small by design (one card, looking the same as before); the value is the proven, reproducible, secret-safe data path.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reproducible, version-controlled schema (Priority: P1)

A developer can stand up the problem store from scratch: applying the committed migration against a fresh database creates the `problems` table with every required column — including the nullable vector column that exercises the database's vector extension end to end — and re-applying it is a no-op.

**Why this priority**: Everything else (seeding, fetching, rendering, deploy) depends on the schema existing and being reproducible. A committed, idempotent migration is the foundation and is independently valuable: it lets any environment (local, preview, production, a teammate's machine) reach a known schema state.

**Independent Test**: Point the migration tool at a fresh database; confirm the `problems` table exists with all specified columns and the vector column is present and nullable; run the migration again and confirm no changes are applied.

**Acceptance Scenarios**:

1. **Given** a fresh database, **When** the committed migration is applied, **Then** a `problems` table exists with: a UUID primary key (server-defaulted), `title`, `category`, `momentum_pct`, `sparkline`, `top_quote`, `quote_source`, `sources`, `last_seen_at`, `created_at` (server-defaulted), and a nullable 1536-dimension vector column.
2. **Given** a database the migration has already been applied to, **When** it is applied again, **Then** the operation completes with no schema changes (idempotent).
3. **Given** the applied schema, **When** the vector column is inspected via SQL, **Then** it exists and is nullable.

---

### User Story 2 - One persisted problem renders locally from the database (Priority: P2)

A visitor opening the running app sees the canonical "Stripe webhooks fail silently on Vercel cold starts" problem card — fetched from the database, not a hardcoded fixture — rendered through the existing `ProblemCardFull` component, visually matching its Slice 1.3 appearance.

**Why this priority**: This is the demonstrable vertical slice — the moment the product reads from real persistence. It depends on US1 (schema) and delivers the visible proof that the data path works.

**Independent Test**: Seed the one canonical problem; open the homepage locally; confirm the Stripe webhooks card renders via `ProblemCardFull` with the same visual treatment as Slice 1.3, sourced from the database; confirm the page tree has no client-component directive.

**Acceptance Scenarios**:

1. **Given** the schema is applied and the seed has run, **When** the homepage is requested, **Then** it fetches the seed problem from the database and renders it through `ProblemCardFull`.
2. **Given** the seeded data, **When** the rendered card is compared to the Slice 1.3 Stripe card, **Then** the card's appearance matches (same category pill, sparkline, title, quote block, source badges, momentum, layout) — only the data source has changed.
3. **Given** the homepage and its component tree, **When** inspected, **Then** there is no client-component directive anywhere in the page tree (the Slice 1.3 theme toggle is gone).
4. **Given** the seed script, **When** it is run twice, **Then** the second run does not create a duplicate (insert-or-update on a stable identity).

---

### User Story 3 - Deployed preview reads from the production database (Priority: P3)

A reviewer opening the deployed preview URL sees the same Stripe webhooks card, fetched from the production database — proving the data path works in the deployed environment, not just locally.

**Why this priority**: Confirms the environment wiring (connection string + secrets configured in the host) works in the real deployment, closing the branch → preview path for a data-backed page. Depends on US1 + US2.

**Independent Test**: With the production database seeded and the deployment's environment configured, open the preview URL; confirm the Stripe webhooks card renders, fetched from the production database.

**Acceptance Scenarios**:

1. **Given** the production database is migrated and seeded, and the deployment environment holds the connection secrets, **When** the preview URL is opened, **Then** the Stripe webhooks card renders, fetched from the production database.

---

### Edge Cases

- **Missing connection secret**: if the database connection string is absent at render/build, the failure must be explicit (a clear error), never a silent render with broken/empty data.
- **Seed row absent (resolved Q5 — non-goal)**: if the homepage's fetch returns no problem, the fetch helper MUST **throw**, surfacing a missing seed as a deployment defect. There is **no** defensive empty-state UI this slice (explicit non-goal); the seed guarantees a row.
- **Database unreachable at request time**: a transient connectivity failure should surface as a server error, not a corrupted page.
- **Pooled connection without prepared statements**: the client must operate against a connection pooler that does not support prepared statements (see FR-003); a configuration that assumes prepared statements would fail and is disallowed.
- **Relative "last seen" time**: the seeded `last_seen_at` is a fixed timestamp, so the card's human-relative time ("Xh/Xd ago") will read differently from Slice 1.3's dynamically-generated fixture as real time passes — see Assumptions.
- **Category key vs display label**: the stored category is a key (e.g. `payments`); the card needs both a key (for color) and a human label (e.g. "Payments") — the mapping must be defined (see Assumptions / Open Questions).
- **Sparkline length**: the schema stores an integer array; the 14-element convention is not enforced by the column type and must be respected by writers.

## Requirements *(mandatory)*

### Functional Requirements

**Persistence & schema (US1)**

- **FR-001**: The shared database package MUST own the schema definition, the migration tooling, and a typed client factory; application code MUST access the database only through this package (CLAUDE.md §5 — all DB access via the ORM).
- **FR-002**: The `problems` table MUST define exactly: `id` (UUID primary key, server-generated default), `title` (text, required), `category` (text, required — a category key such as `payments`/`devtools`/`ai-ml`/`auth-sso`/`deployment`/`analytics`/`mobile`/`email`), `momentum_pct` (integer, required, may be negative), `sparkline` (integer array, required), `top_quote` (text, required), `quote_source` (text, required — one of `gh|hn|so|ph|ap|gp`), `sources` (text array, required), `last_seen_at` (timestamptz, required), `created_at` (timestamptz, required, server-defaulted to now), and `embedding` (1536-dimension vector, nullable).
- **FR-003**: The database client MUST be configured to operate through the managed connection pooler in a mode that does not use prepared statements (the pooler does not support them).
- **FR-004**: The first migration MUST be generated from the schema and committed to the repository; applying it to a fresh database MUST create the full table, and re-applying MUST be a no-op (idempotent).
- **FR-005**: Applying the migration MUST provision the database vector extension so the 1536-dimension vector column is created successfully end to end (even though it is not populated this slice).
- **FR-006**: A migrate command MUST apply pending migrations against a **direct/session-mode** connection (`DATABASE_URL_DIRECT`, Postgres port 5432) — separate from the runtime pooler URL — because the migrator needs advisory locks and prepared statements that the Transaction pooler does not support. Runtime queries continue to use the pooler URL (`DATABASE_URL`).

**Seeding (US2)**

- **FR-007**: A seed command MUST idempotently insert-or-update exactly one canonical problem — the "Stripe webhooks fail silently on Vercel cold starts" record — matching the Slice 1.3 fixture's field values (category `payments`, the same sparkline series, the same quote and `gh` quote source, sources `gh/hn/so`, a positive momentum). Running it more than once MUST NOT create duplicates.
- **FR-008**: The seed's `embedding` MUST be left null (the vector column is exercised structurally only this slice).

**Read path & rendering (US2)**

- **FR-009**: The database package MUST export the schema, the client factory, and a typed helper that fetches a single problem for the homepage. If no problem row exists, the helper MUST **throw** (a missing seed is a deployment defect; no defensive empty state this slice — Q5).
- **FR-010**: The homepage MUST be a Server Component that fetches the seed problem through the database package and renders it via the existing `ProblemCardFull` component; there MUST be no client-component directive anywhere in the page tree.
- **FR-011**: The Slice 1.3 throwaway theme-toggle harness MUST be removed entirely (theme switching returns in a later slice); the page renders in the default Editorial Light theme.
- **FR-012**: A stored problem row MUST map cleanly onto the `ProblemCardFull` prop contract, including deriving the human category **label** from the stored category **key** (see Assumptions).
- **FR-013**: The rendered card MUST match the Slice 1.3 Stripe card's appearance (pill, sparkline, title, quote block, source badges, momentum, layout); only the data source changes.

**Environment & secrets (cross-cutting)**

- **FR-014**: A committed `.env.example` at the repository root MUST document the required variables with placeholder values only: `DATABASE_URL` (Transaction pooler URI, runtime queries), `DATABASE_URL_DIRECT` (direct/session-mode URI, port 5432, migrations only), `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (documented for forward compatibility; **unused by application code this slice** — see Assumptions).
- **FR-015**: Real secret values MUST NOT be committed; the local env file MUST be gitignored and absent from git history. Specifically, no `.env`, `.env.local`, or file matching `.env.*` (except `.env.example`) may appear in `git ls-files`.
- **FR-016**: The runtime and migration connection variables MUST be configured in the deployment host for both the Preview and Production environments (a host-dashboard step, user-owned).
- **FR-017**: Application code in this slice MUST consume the database **only** through the `postgres-js` connection string (`DATABASE_URL` via the pooler), which authenticates via the Postgres role embedded in the URL. No Supabase publishable or secret key is consumed by application code this slice.

**Quality gates (cross-cutting)**

- **FR-018**: Type-check, lint, and a production build of the web app MUST all succeed with no errors.

### Key Entities *(include if feature involves data)*

- **Problem** (the `problems` table): one discovered problem, sufficient to render a single `ProblemCardFull`.
  - `id` — stable unique identifier (server-generated UUID).
  - `title` — the problem statement.
  - `category` — category **key** (maps 1:1 to a Slice 1.3 `categoryColor`); the human label is derived for display.
  - `momentum_pct` — signed percentage change.
  - `sparkline` — integer series (14 values by convention) of recent mention counts.
  - `top_quote` / `quote_source` — the representative quote and its platform key.
  - `sources` — platform keys where the problem appears (drives footer badges).
  - `last_seen_at` — most-recent mention timestamp (rendered relative).
  - `created_at` — row creation timestamp.
  - `embedding` — nullable 1536-dim vector, reserved for future semantic clustering; unpopulated this slice.

- **Row → ProblemCardFull mapping**: `momentum_pct`→`momentum`, `last_seen_at`→`lastSeenIso`, `category`(key)→`categoryColor` **and** a derived `category` label; all other fields map by name. (See Assumptions.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A root `.env.example` documents the required variables (`DATABASE_URL`, `DATABASE_URL_DIRECT`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) with placeholder values; the local env file is gitignored and never appears in git history. *(AC-1)*
- **SC-002**: The database package contains a schema defining the `problems` table exactly per the contract above. *(AC-2)*
- **SC-003**: The schema-generation step produces a migration file committed to the repository. *(AC-3)*
- **SC-004**: Applying the migration (via the direct/session connection, `DATABASE_URL_DIRECT`) to a fresh database succeeds and is idempotent (a second run makes no changes). *(AC-4)*
- **SC-005**: The seed step inserts-or-updates the one canonical "Stripe webhooks" problem matching the Slice 1.3 fixture, with no duplication on re-run. *(AC-5)*
- **SC-006**: The homepage is a Server Component that fetches and renders the seed problem via `ProblemCardFull`, with no client-component directive anywhere in the page tree. *(AC-6)*
- **SC-007**: The local homepage renders the Stripe webhooks card with the same appearance as Slice 1.3 — only the data source has changed. *(AC-7)*
- **SC-008**: The deployed preview renders the same card, fetched from the production database. *(AC-8)*
- **SC-009**: The vector column exists in the table (verified via SQL) and is null for the seed row. *(AC-9)*
- **SC-010**: Type-check, lint, and the web production build each complete with success and no errors. *(AC-10)*
- **SC-011**: No `.env`, `.env.local`, or file matching `.env.*` (except `.env.example`) appears in `git ls-files`. *(AC-11, narrowed)*

## Assumptions

- **Slice numbering**: this is slice **004** (001 walking skeleton, 002 Spec Kit wiring, 003 design tokens + card). Directory/branch: `004-supabase-drizzle-persisted-problem`. The build plan may label it "Slice 1.4."
- **Tech choices are pre-decided by the user** (recorded so plan/implementation honor them): managed Postgres + vector extension; ORM with the `postgres-js` driver (not `pg`/`neon-http`); client initialized with prepared statements disabled (pooler constraint); connection string is the **Transaction pooler** URI.
- **Category label derivation (resolved Q4)**: the stored `category` is a key; the human pill label is derived via a fixed key→label map **codified as a const map in `packages/shared`** (so `apps/web` and any future consumer share one source of truth). Labels: `payments`→"Payments", `devtools`→"Devtools", `ai-ml`→"AI / ML", `auth-sso`→"Auth & SSO", `deployment`→"Deployment", `analytics`→"Analytics", `mobile`→"Mobile", `email`→"Email". No `category_label` column is added.
- **Migration vs runtime connection separation (resolved Q1)**: migrations run against `DATABASE_URL_DIRECT` (direct/session mode, port 5432) because the migrator needs advisory locks + prepared statements the pooler lacks; runtime queries use `DATABASE_URL` (Transaction pooler, prepared statements disabled). Two distinct connection variables.
- **Supabase project/credentials and host env vars are user-owned prerequisites** (provisioning the database, enabling the vector extension if not auto-enabled by the migration, and setting the connection variables in the deployment dashboard for Preview + Production) — mirroring the Slice 1.1 Vercel-dashboard pattern.
- **`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` are documented-only this slice (resolved Q3)**: they appear in `.env.example` for forward compatibility but are **not consumed by application code** in Slice 1.4. All database access flows through the `postgres-js` connection string (`DATABASE_URL` via the pooler), authenticating via the Postgres role embedded in that URL. No publishable or secret Supabase key, and no "service-role" concept, is involved in this slice's code path.
- **Single card, not two**: the homepage now renders the **one** seeded problem; Slice 1.3's second (LLM) fixture and the toggle are removed. "Identical to Slice 1.3" refers to the Stripe **card's** appearance, not the two-card showcase composition.
- **Relative-time drift is acceptable**: the seed stores a fixed `last_seen_at`, so the card's relative time will diverge from Slice 1.3's dynamic fixture over time; "identical appearance" is judged modulo the naturally-changing relative timestamp.
- **Array length is convention, not constraint**: the integer-array column does not enforce 14 elements; the seed supplies 14.
- **Default theme is Editorial Light** (no toggle, no `data-theme`); Editorial Dark is unreachable until the next-themes slice.

## Clarifications

All five open questions were resolved by the user on 2026-05-22 and folded into the requirements above:

- **Q1 — Migration connection → option (b)**: add `DATABASE_URL_DIRECT` (direct/session mode, port 5432) used by `db:migrate` only; the pooler `DATABASE_URL` stays for runtime queries (FR-006, FR-014, SC-004).
- **Q2 — Secret-leak safeguard → drop AC-11 as written**: narrowed to "no `.env`/`.env.local`/`.env.*` (except `.env.example`) in `git ls-files`" (FR-015, SC-011). The repo-wide pre-commit hook from a prior chore already covers secret-pattern detection; no new tooling this slice.
- **Q3 — Supabase keys → documented-only**: `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` are in `.env.example` for forward compat but unused by application code; all DB access flows through the `postgres-js` connection string. The "service-role server-side only" wording is removed (FR-017, Assumptions).
- **Q4 — Category labels → approved**: fixed key→label map codified as a const in `packages/shared` (FR-012, Assumptions).
- **Q5 — Empty state → out of scope (non-goal)**: the fetch helper throws if no row exists; no defensive empty-state UI (FR-009, Edge Cases).

## Non-Goals (this slice)

- No defensive empty-state UI — a missing seed row throws (Q5).
- No `next-themes`, no theme toggle, no Editorial Dark reachability.
- No auth, RLS policies, or Supabase client/key usage in application code.
- No tables beyond `problems`; no embedding generation; no real-time subscriptions.
- No new secret-scanning tooling (relies on the existing pre-commit hook).
