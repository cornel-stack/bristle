# Feature Specification: Filter Classifier + Embedder

**Feature Branch**: `027-filter-classifier-embedder`

**Created**: 2026-06-06

**Status**: Draft — **STOP at spec + SETTLED decisions + open questions for founder review** (no plan, tasks, or code until reviewed). Slow/keen cadence.

**Slice**: Build-plan **5.2** (Tier 5 — Pipeline + Live Data). The second pipeline slice, building directly on 5.1's `raw_items`. Tier 5 ships **v0.5.0**; **no tag at 5.2**.

**Input**: User description: "Build-plan 5.2 — classify every `raw_item` keep/drop and embed the kept items into pgvector, so 5.3 clustering receives filtered, embedded items. Operates on `raw_items` regardless of source. DoD is data-quality, not 'it runs': dropped items are genuinely noise, kept items are genuine developer problems (target 80%+ noise filtered), every kept item has an embedding, a re-run re-processes nothing already done, and `raw_items` is byte-unchanged."

---

## Why this slice is different

5.1 proved the pipeline can **capture** data correctly (autonomous, deduped, isolated). 5.2 is the first slice that makes a **quality judgement** about that data and the first that **spends money per item**. So its DoD is not "the job runs" — it's "the *output is good*": noise is genuinely filtered and kept items are genuinely developer problems. That makes (a) a written rubric + a labeled eval set, and (b) a cost guard, first-class concerns. The consumers are slice **5.3** (clustering reads the kept items + their embeddings) and **5.4** (synthesis). As in 5.1, the deliverable for review is the spec + the SETTLED decisions + the open questions; nothing is planned or built until the founder signs off.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Every raw item gets a keep/drop verdict; kept items get an embedding (Priority: P1)

The operator runs the processor. For each `raw_item` that has not yet been processed, the system decides **keep** (a genuine developer problem) or **drop** (noise), records a short reason + a confidence, and — for kept items only — produces an embedding stored in pgvector. `raw_items` itself is never modified; all derived data lands in a separate table.

**Why this priority**: This is the slice — filtered, embedded items are exactly what 5.3 needs. Without it, clustering has nothing to cluster.

**Independent Test**: Point the processor at a populated `raw_items`; afterward, every processed raw item has exactly one verdict row, every **keep** row has a non-null embedding, every **drop** row has none, and `raw_items` is byte-for-byte unchanged.

**Acceptance Scenarios**:

1. **Given** unprocessed raw items, **When** the processor runs, **Then** each gets a `keep`/`drop` verdict + short reason + confidence in the derived table, and `raw_items` is unchanged.
2. **Given** a **keep** verdict, **When** it is written, **Then** it carries a 1536-dim embedding of the item's normalized text; **a drop verdict carries no embedding.**
3. **Given** a populated derived table, **When** 5.3 queries it, **Then** it can read the kept items + embeddings (the HNSW index supports nearest-neighbor search).

---

### User Story 2 — A re-run re-processes nothing already done (idempotent, incremental) (Priority: P1)

Running the processor again does **no** duplicate work and spends **no** money on already-processed items — it picks up only `raw_items` that lack a verdict. The full set can be reset deliberately (truncate the derived table) to re-process from scratch, but a normal re-run is a no-op over done work.

**Why this priority**: This is half the DoD ("a re-run re-processes nothing already done") and the cost guarantee — re-processing 3,200 items every cron tick would be wasteful and expensive.

**Acceptance Scenarios**:

1. **Given** all raw items already processed, **When** the processor runs again, **Then** it classifies/embeds **zero** items and spends nothing.
2. **Given** a partially-processed set, **When** the processor runs, **Then** it processes only the items with no verdict row.
3. **Given** an intentional reset, **When** the derived table is truncated and the processor re-runs, **Then** every item is re-processed; **`raw_items` is untouched by either path.**

---

### User Story 3 — A partial failure never leaves a half-written item (Priority: P1)

If classification succeeds but embedding fails (or vice-versa), or a run is interrupted, the affected item is left **unprocessed** and is retried on the next run — never written half-complete (e.g. a keep verdict with no embedding, or a verdict row with no raw item).

**Why this priority**: Half-written items would silently corrupt 5.3's input (a "kept" item missing its embedding can't be clustered) and would not be retried.

**Acceptance Scenarios**:

1. **Given** classification succeeds but embedding fails for an item, **When** the run ends, **Then** that item has **no** verdict row and is retried next run.
2. **Given** two processor runs overlap or double-fire, **When** both reach the same item, **Then** exactly one verdict row exists (idempotent on the raw item).
3. **Given** a kept item, **When** its verdict row exists, **Then** its embedding is present (keep ⇒ embedding, enforced atomically).

---

### User Story 4 — The slice cannot overspend (Priority: P1)

Because this is the first per-item-cost slice, a single run has a hard cap on how many items it will process, and a spend guard stops or refuses work past a threshold — so a runaway loop or an unexpectedly large backlog can't run up an unbounded bill before the full `/admin` cost dashboard arrives in 5.6.

**Why this priority**: An ungated LLM loop over a growing table is the highest-risk failure of this slice; the build-plan DoD also bounds per-call cost.

**Acceptance Scenarios**:

1. **Given** a backlog larger than the per-run cap, **When** the processor runs, **Then** it processes at most the cap and leaves the rest for subsequent runs (no unbounded run).
2. **Given** the spend guard's threshold is reached, **When** the processor would spend past it, **Then** it stops (and the stop is observable in logs).
3. **Given** a large initial backfill, **When** it is processed, **Then** the cheaper asynchronous batch path is used; **incremental runs** use the synchronous path.

---

### Edge Cases

- **Empty body / link-only item** — classify on the available text (title ± body); never crash on a null field.
- **Classifier returns malformed/unparseable output** — the item is left unprocessed (no verdict row) and retried; never written as a guessed verdict (structured tool-use output mitigates this).
- **Embedding API transient failure / rate-limit** — backoff + retry; on persistent failure the item stays unprocessed (US3).
- **Re-run after a model/prompt change** — verdicts are not silently mixed across model versions if reproducibility metadata is recorded (open question f); otherwise a deliberate truncate-and-reprocess is the reset path.
- **Source-agnostic** — the processor reads `raw_items` of any `source` (hn now; github/so later) identically.
- **Confidence near the keep/drop boundary** — how low-confidence items are handled is an open question (e).
- **A raw item deleted after processing** — the FK + cascade behavior must not orphan or error (handled by the derived table's FK).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign every processed `raw_item` a **keep/drop** verdict with a short reason and a confidence, persisted in a **new derived table** — never by mutating `raw_items`.
- **FR-002**: For **keep** verdicts only, the system MUST produce and store a **1536-dimension embedding** of the item's normalized text, indexed for nearest-neighbor search. **Drop** verdicts MUST NOT carry an embedding.
- **FR-003**: `raw_items` MUST remain **byte-unchanged** by this slice (immutable/append-only); all derived data lives in the new table (FK → `raw_items`).
- **FR-004**: Processing MUST be **idempotent and incremental** — a run processes only `raw_items` with no verdict row (a stateless not-exists pickup, no cursor); a re-run over fully-processed data does zero work and spends nothing.
- **FR-005**: Re-processing from scratch MUST be possible by **truncating the derived table** and re-running; this MUST NOT touch `raw_items`.
- **FR-006**: Per item, classification + embedding + persistence MUST be **atomic** — a partial failure leaves the item **unprocessed** (retried), never half-written (no keep-without-embedding, no verdict-without-raw-item).
- **FR-007**: The classifier MUST decide **keep/drop only** (genuine developer problem vs noise) — **not** a fine-grained category (deferred to 5.3/5.4). *(Intentional deviation from build-plan 5.2's 5-bucket wording — see "Build-plan deviation".)*
- **FR-008**: The processor MUST run **autonomously on its own schedule**, decoupled from the 5.1 ingester (a separate scheduled job; no event-chaining ingester→processor in this slice).
- **FR-009**: Noise filtering MUST meet the data-quality bar: **≥80% of noise is dropped**, measured against a labeled evaluation set (the rubric + eval set is an open question — a).
- **FR-010**: The slice MUST enforce a **hard per-run item cap** and a **spend guard** that stops/refuses work past a threshold; both MUST be observable in logs.
- **FR-011**: The migration adding the derived table MUST be **additive** — it MUST NOT alter, drop, or write to any existing table (`raw_items`, `problems`, app tables); the derived table is new with an FK to `raw_items` only.
- **FR-012**: The derived schema MUST remain **Drizzle-owned, single-migration-authority**; the contract artifact + drift test MUST be **extended to cover the new table** (today both cover only `raw_items`).
- **FR-013**: Secrets (model-provider keys, DB) MUST come from the environment per the 5.1 convention (Railway for prod, gitignored local env for dev); none committed.

### Key Entities

- **`processed_items`** (new; the only table this slice adds): one row per processed `raw_item`. Attributes (final shape in Decision 1): `id`, `raw_item_id` (FK → `raw_items`, **unique** — the idempotency key), `verdict` (`keep`/`drop`), `reason` (short text), `confidence`, `normalized_text` (what was classified/embedded), `embedding` (1536-dim vector, **null for drop**), `processed_at`, and — pending open question (f) — model/prompt-version metadata. Indexed by an **HNSW** index on `embedding` for 5.3's nearest-neighbor joins.
- **Verdict** (value): `keep` (a genuine developer problem — kept for clustering) or `drop` (noise — excluded). Reason + confidence accompany it.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** (filtered): Against a labeled evaluation set, **≥80% of true noise is dropped** and kept items are genuine developer problems (precision/recall targets to be set with the rubric — open question a).
- **SC-002** (embedded): **100% of keep verdicts carry a 1536-dim embedding**; 0% of drop verdicts do; the embedding index answers nearest-neighbor queries (5.3's prerequisite).
- **SC-003** (incremental/idempotent): A re-run over fully-processed data classifies/embeds **0** items and spends **$0**; a partial set processes exactly the unprocessed remainder.
- **SC-004** (immutable source): After any number of processor runs (including a truncate-and-reprocess), `raw_items` is **byte-for-byte unchanged** (row count + content identical).
- **SC-005** (no half-writes): At all times, **every `keep` row has an embedding and every verdict row has a valid `raw_item`** — no half-written items, including after an injected mid-item failure.
- **SC-006** (bounded cost): A run never processes more than the per-run cap; the spend guard halts work past its threshold; the initial backfill uses the cheaper async batch path. Per the build-plan, average per-item classification cost stays low (target order **~$0.0001/item**, validated once the cap/threshold units are set — open question c).
- **SC-007** (no app-table impact): Every pre-existing table is structurally + data-identical after the migration and many runs; only `processed_items` is added.

---

## Build-plan deviation (raised, per constitution §7)

Build-plan 5.2 literally says the classifier labels each `raw_item` as **complaint / feature-request / wish / bug / noise** (five buckets). This spec **intentionally simplifies that to a binary keep/drop** (+ reason + confidence): the four non-noise buckets all mean "keep," and the *fine-grained* category is **deferred to clustering/synthesis (5.3/5.4)**, where it's more naturally derived per-cluster than per-raw-item. The data-quality DoD ("80%+ noise filtered") maps cleanly onto keep/drop. This is a deliberate, surfaced deviation for confirmation — not an oversight. *(If the founder wants the 5-way label retained on `processed_items` for later use, that's a small additive column, listed under open questions.)*

---

## SETTLED Decisions *(confirm at review; inherited by 5.3+)*

### Decision 1 — Data model: a new immutable-respecting derived table **[SETTLED]**
`raw_items` stays **immutable/append-only**; all derived data goes in a **new `processed_items` table**, FK → `raw_items` with a **unique `raw_item_id`** (the idempotency key). It holds the verdict (`keep`/`drop`), a short reason, confidence, the normalized text used, and the embedding vector (**nullable — only kept items embed**). **Re-processing = `TRUNCATE processed_items` + re-run**; `raw_items` is never mutated. **Migration `0006`** is **additive**: the new table + the vector column + an **HNSW** index. *Grounded note:* **pgvector is already enabled** — `CREATE EXTENSION IF NOT EXISTS vector` is in migration `0000` and `problems.embedding vector(1536)` already exists on dev + prod — so `0006` only adds the table/index; it still includes `CREATE EXTENSION IF NOT EXISTS vector` at the top so the migration is **self-contained when `conftest` applies it standalone** (the 5.1 pattern). **Drizzle stays the single migration authority** (Python reads/writes via asyncpg, the 5.1 pattern). The **`gen-contract` generator + drift test are extended to `processed_items`** (today both are `raw_items`-specific: `packages/db/scripts/gen-contract.ts` hardcodes `rawItems`→`raw_items.contract.json`, and `apps/pipeline/tests/test_schema_contract.py` checks only `raw_items`). `0006` applies to **both dev and prod** via the dual-target `db:migrate:all` (pre-flight both).

### Decision 2 — Classifier: Claude Haiku, keep/drop via tool-use **[SETTLED]**
**Claude Haiku** classifies keep/drop + short reason + confidence — **not** category assignment. **Structured tool-use schema** for reliable output (a malformed response leaves the item unprocessed, not guessed). **Verified current (June 2026 web check):** `claude-haiku-4-5-20251001` is **still the latest Haiku** (4.5, released Oct 2025; no newer Haiku has shipped), pricing ~$1/$5 per Mtok. New Python dependency: the **Anthropic SDK** — a justified per-slice ML dep under OD-7 (each pipeline ML dep is its own per-slice decision; not pre-sanctioned by 5.1's floor).

### Decision 3 — Embedder: OpenAI `text-embedding-3-small` @ 1536 dims **[SETTLED]**
**`text-embedding-3-small` at 1536 dimensions.** **Verified current (June 2026 web check):** it's still the recommended production default ($0.02/1M tokens); `text-embedding-3-large` @ 3072 exists as a higher-quality alternative but is a bigger storage + index commitment. **The 1536 dimension is a HARD schema commitment** (vector column width + HNSW index) and **matches the existing `problems.embedding vector(1536)`** — consistency across the app. Embed **title + a bounded slice of body** (slice length is open question b). **HNSW** index (incremental-friendly, unlike IVFFlat which wants a built corpus). New Python dependency: the **OpenAI SDK** (per-slice ML dep, OD-7).

### Decision 4 — Orchestration: a separate, stateless-pickup processor cron **[SETTLED]**
A **separate Inngest scheduled job** that processes **unprocessed items** (`raw_items` with no `processed_items` row — a `NOT EXISTS` / left-join pickup, **no cursor**, the same stateless spirit as 5.1's watermark), **decoupled from the ingester**. **Idempotent via `ON CONFLICT` on `raw_item_id`.** Per item, **classify + embed + insert atomically** so a partial failure leaves the item unprocessed and retried — never half-written. **Event-chaining ingester→processor is explicitly out of scope** for this slice.

### Decision 5 — Cost controls ship now (mini, ahead of the 5.6 dashboard) **[SETTLED]**
As the first per-item-spend slice, it ships with a **hard `MAX_ITEMS_PER_RUN` cap** and a **spend guard** now (the full `/admin` cost dashboard is 5.6). The **initial backfill (~3,200 items, growing)** uses **Anthropic's Message Batches API** (~half cost, asynchronous); **incremental runs are synchronous**. New secrets **`ANTHROPIC_API_KEY` + `OPENAI_API_KEY`** — gitignored `apps/pipeline/.env` for dev, **Railway variables** for prod, scoped exactly like the 5.1 secrets (Decision 5 of 5.1).

---

## Open Questions *(for founder review — NOT resolved in this spec)*

- **(a) Classification rubric + eval set — the DoD's measuring stick.** The keep/drop **prompt** and the written boundary of "genuine developer problem" vs "noise" need defining, **plus a labeled evaluation set** so "≥80% noise filtered" (FR-009/SC-001) is measured objectively rather than asserted. *How is the 80% computed and validated, and who labels the eval set?* This is the single biggest open item — the slice's DoD is unmeasurable without it.
- **(b) Embedding input bounds.** The **bounded body-slice length** (token budget) for `title + body[:N]`. (Settled sub-point: **drop items are not embedded** — only kept items.)
- **(c) Cost-guard units + breach behavior.** The `MAX_ITEMS_PER_RUN` **value**, and the spend guard's **threshold + units** (a daily $ ceiling vs a per-run item count) and **behavior on breach** (hard stop vs process-then-alert).
- **(d) Batch-vs-sync boundary.** At what **backlog size** does a run switch from synchronous to the async Batch API (a fixed threshold, or always-batch above N)?
- **(e) Confidence handling.** Is there a **confidence threshold** below which an item is left unprocessed / flagged for review rather than auto kept/dropped — or is every item forced to a verdict?
- **(f) Reproducibility metadata.** Should `processed_items` store the **model IDs + a prompt/schema version** so verdicts are interpretable (and re-processable) when models or the prompt change? (Relates to the "re-run after model change" edge case.) *Also:* whether to retain the build-plan's 5-way label as an optional additive column for 5.3/5.4.

---

## Assumptions

- **A1 — `processed_items` is the only schema change** (additive; FR-011). No app table, no `raw_items` change.
- **A2 — Drizzle stays the single migration authority** (Decision 1); the contract + drift mechanism generalize to the new table; Python uses asyncpg.
- **A3 — pgvector is already enabled on dev + prod** (migration `0000`); `0006` adds only the table/index (with a self-contained `CREATE EXTENSION IF NOT EXISTS vector` for standalone conftest apply).
- **A4 — Models verified current** (June 2026): Haiku `claude-haiku-4-5-20251001`; OpenAI `text-embedding-3-small` @ 1536. Both are the recommended current defaults.
- **A5 — Source-agnostic** — operates on any `raw_items.source`.
- **A6 — Only kept items are embedded** (drop ⇒ no embedding); this is settled, not open.
- **A7 — No event-chaining** ingester→processor this slice; the processor is an independent scheduled job.
- **A8 — Volume** at 5.2 is the ~3,200 backfill + incremental; the per-run cap bounds each run; full corpus grows over time.

## Dependencies

- **Slice 5.1** — `raw_items` (the input), the dual-target `db:migrate:all`, the `gen-contract`/drift mechanism, the dev/prod Supabase split, the Inngest/Railway deploy path.
- **pgvector** — already enabled on dev + prod (migration `0000`).
- **Anthropic API** (Haiku 4.5 + Message Batches) and **OpenAI API** (`text-embedding-3-small`) — new keys.
- **Railway / Inngest** — the processor deploys + schedules alongside the 5.1 ingester.
- **`packages/db`** — owner of migration `0006` + the extended contract artifacts.
- **Standing CI caveat** — the standing pipeline CI runs on the **ephemeral container, never dev/prod**; it now needs **pgvector** in that container (use **`pgvector/pgvector:pg16`** instead of plain `postgres:16` / `postgres:16-alpine`, for both the GitHub Actions service and the local ephemeral container).

## Out of scope (this slice — considered for forward-compatibility)

- **Clustering** of kept items (5.3) — this slice only filters + embeds.
- **Enrichment + synthesis** into `problems` (5.4); **fine-grained category** assignment (5.3/5.4).
- The full **`/admin` cost dashboard + audit log UI** (5.6) — this slice ships only a hard cap + spend guard.
- **Event-chaining** ingester→processor; **re-embedding** on model upgrades (a future migration concern).
- Caching of LLM calls beyond the idempotent "don't reprocess" guarantee (the build-plan's "LLM wrapper with caching" — the idempotency *is* the cache here; a content-cache is deferrable).

## Review gate

**STOP here.** Confirm the five SETTLED decisions and resolve the six open questions (especially **(a)** the rubric + eval set — the DoD is unmeasurable without it) before any `/speckit.plan`, `/speckit.tasks`, or code. This slice is load-bearing for 5.3 (clustering reads its output) and is the first to spend per item.
