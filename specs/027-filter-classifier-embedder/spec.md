# Feature Specification: Filter Classifier + Embedder

**Feature Branch**: `027-filter-classifier-embedder`

**Created**: 2026-06-06

**Status**: **All decisions + open questions SETTLED 2026-06-06** — ready for `/speckit.plan`. Slow/keen cadence; **plan only, then STOP** for founder review (no tasks, no code).

**Slice**: Build-plan **5.2** (Tier 5 — Pipeline + Live Data). The second pipeline slice, building directly on 5.1's `raw_items`. Tier 5 ships **v0.5.0**; **no tag at 5.2**.

**Input**: User description: "Build-plan 5.2 — classify every `raw_item` keep/drop and embed the kept items into pgvector, so 5.3 clustering receives filtered, embedded items. Operates on `raw_items` regardless of source. DoD is data-quality, not 'it runs': dropped items are genuinely noise, kept items are genuine developer problems (target 80%+ noise filtered), every kept item has an embedding, a re-run re-processes nothing already done, and `raw_items` is byte-unchanged."

---

## Why this slice is different

5.1 proved the pipeline can **capture** data correctly (autonomous, deduped, isolated). 5.2 is the first slice that makes a **quality judgement** about that data and the first that **spends money per item**. So its DoD is not "the job runs" — it's "the *output is good*": noise is genuinely filtered and the genuine developer problems are retained. That makes (a) a written rubric + a **committed gold eval set** and (b) a cost guard first-class concerns. The consumers are slice **5.3** (clustering reads the kept items + their embeddings) and **5.4** (synthesis). As in 5.1, the deliverable was the spec + SETTLED decisions; those are now all confirmed, so this is cleared for planning.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Every raw item gets a label; kept items get an embedding (Priority: P1)

The operator runs the processor. For each unprocessed `raw_item`, the system assigns a **5-way label** (`complaint` / `bug` / `feature-request` / `wish` / `noise`), a short reason, and a confidence. **Keep/drop is derived** as `label != noise`. For **kept** items only, it produces an embedding stored in pgvector. `raw_items` is never modified; all derived data lands in a separate table.

**Why this priority**: This is the slice — filtered, embedded items are exactly what 5.3 needs. Without it, clustering has nothing to cluster.

**Independent Test**: Point the processor at a populated `raw_items`; afterward, every processed raw item has exactly one derived row with a 5-way label, every kept row (`label != noise`) has a non-null embedding, every `noise` row has none, and `raw_items` is byte-for-byte unchanged.

**Acceptance Scenarios**:

1. **Given** unprocessed raw items, **When** the processor runs, **Then** each gets a 5-way `label` + short reason + confidence in the derived table, **keep/drop derived as `label != noise`**, and `raw_items` is unchanged.
2. **Given** a kept item (`label != noise`), **When** it is written, **Then** it carries a 1536-dim embedding of the item's normalized text; **a `noise` item carries no embedding.**
3. **Given** a populated derived table, **When** 5.3 queries it, **Then** it can read the kept items + embeddings (the HNSW index supports nearest-neighbor search) and may use the four keep-type labels as best-effort secondary signal.

---

### User Story 2 — A re-run re-processes nothing already done (idempotent, incremental) (Priority: P1)

Running the processor again does **no** duplicate work and spends **no** money on already-processed items — it picks up only `raw_items` that lack a derived row. The full set can be reset deliberately (truncate the derived table) to re-process from scratch, but a normal re-run is a no-op over done work.

**Why this priority**: Half the DoD ("a re-run re-processes nothing already done") and the cost guarantee.

**Acceptance Scenarios**:

1. **Given** all raw items already processed, **When** the processor runs again, **Then** it classifies/embeds **zero** items and spends nothing.
2. **Given** a partially-processed set, **When** the processor runs, **Then** it processes only the items with no derived row.
3. **Given** an intentional reset, **When** the derived table is truncated and the processor re-runs, **Then** every item is re-processed; **`raw_items` is untouched by either path.**

---

### User Story 3 — A partial failure never leaves a half-written item (Priority: P1)

If classification succeeds but embedding fails (or vice-versa), or a run is interrupted, the affected item is left **unprocessed** and retried next run — never written half-complete (no kept item without its embedding, no derived row without a raw item).

**Acceptance Scenarios**:

1. **Given** classification succeeds but embedding fails for a kept item, **When** the run ends, **Then** that item has **no** derived row and is retried next run.
2. **Given** two processor runs overlap or double-fire, **When** both reach the same item, **Then** exactly one derived row exists (idempotent on the raw item).
3. **Given** a kept item, **When** its derived row exists, **Then** its embedding is present (keep ⇒ embedding, enforced atomically).

---

### User Story 4 — The slice cannot overspend (Priority: P1)

A single run has a hard cap on items processed, and a daily dollar ceiling stops work past a tripwire — so a runaway loop or an unexpectedly large backlog can't run up an unbounded bill before the full `/admin` cost dashboard (5.6). On breach the run **halts gracefully**: process up to the cap, log, exit, remainder next run — never crash.

**Acceptance Scenarios**:

1. **Given** a backlog larger than the per-run cap, **When** the processor runs, **Then** it processes at most the cap (default ~1,000) and leaves the rest for subsequent runs.
2. **Given** the daily spend ceiling (default $5) is reached, **When** the processor would spend past it, **Then** it stops gracefully and logs the halt (no crash).
3. **Given** the large initial backfill, **When** it is drained, **Then** a **one-shot async Batch-API command** is used (~half price); **steady-state incremental runs are synchronous** (no auto-switch threshold).

---

### Edge Cases

- **Empty body / link-only item** — classify on the available text (title ± body); never crash on a null field.
- **Classifier returns malformed/unparseable output** — the item is left unprocessed (no derived row) and retried; never written as a guessed label (structured tool-use mitigates this).
- **Low-confidence verdict** — **bias to keep**: below the confidence threshold the item is forced to keep regardless of the model's label (a `noise` call under threshold is overridden to kept); the confidence is stored for 5.10 to revisit. (Avoids false-drops, which the DoD penalizes most.)
- **Embedding API transient failure / rate-limit** — backoff + retry; on persistent failure the item stays unprocessed (US3).
- **Re-run after a model/prompt change** — reproducibility metadata (model + prompt/rubric + embedding-model versions, per row) makes verdicts interpretable and enables **selective** re-processing; a deliberate truncate-and-reprocess remains the full reset path.
- **Source-agnostic** — the processor reads `raw_items` of any `source` (hn now; github/so later) identically.
- **A raw item deleted after processing** — the FK behavior must not orphan or error.

---

## Classification rubric *(the keep/drop boundary — the DoD's definition + the classifier prompt's backbone)*

One Haiku tool-use call returns exactly one **`label`**:

| Label | Meaning | Verdict |
|---|---|---|
| `complaint` | Pain with an existing tool / service / workflow | **keep** |
| `bug` | Something is broken | **keep** |
| `feature-request` | A capability that doesn't exist yet | **keep** |
| `wish` | Latent / unmet demand ("is there a tool that…") | **keep** |
| `noise` | Job/hiring posts, launches/self-promotion, news/announcements, answered how-to questions, off-topic, chatter with **no pain or gap** | **drop** |

**Keep/drop = `label != 'noise'`.** The four keep-types are a **best-effort secondary signal** for 5.3/5.4; the classifier is **optimized and measured on the noise-vs-keep boundary only** (the DoD), **not gated on fine four-way accuracy**.

**Eval methodology (the measuring stick).** Claude Code drafts the rubric (above) and **auto-labels a stratified ~150–200-item sample** of real developer `raw_items`; the **founder corrects that sample**, and the corrected set becomes the **committed gold eval set** the classifier is measured against. *(The founder-correction is a build-time task in the plan — not now.)* The DoD is **two-sided** on the gold set: **drop ≥80% of true noise AND retain the large majority of true problems (low false-drop)** — **retention prioritized** over raw drop-rate.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign every processed `raw_item` a **5-way `label`** (`complaint`/`bug`/`feature-request`/`wish`/`noise`) with a short reason and a confidence, persisted in a **new derived table** — never by mutating `raw_items`. **Keep/drop is derived** as `label != 'noise'`.
- **FR-002**: For **kept** items only (`label != 'noise'`), the system MUST produce and store a **1536-dimension embedding** of the item's normalized text, indexed for nearest-neighbor search. `noise` items MUST NOT carry an embedding.
- **FR-003**: `raw_items` MUST remain **byte-unchanged** by this slice (immutable/append-only); all derived data lives in the new table (FK → `raw_items`).
- **FR-004**: Processing MUST be **idempotent and incremental** — a run processes only `raw_items` with no derived row (a stateless not-exists pickup, no cursor); a re-run over fully-processed data does zero work and spends nothing.
- **FR-005**: Re-processing from scratch MUST be possible by **truncating the derived table** and re-running; this MUST NOT touch `raw_items`.
- **FR-006**: Per item, classification + embedding + persistence MUST be **atomic** — a partial failure leaves the item **unprocessed** (retried), never half-written.
- **FR-007**: The classifier MUST return a **single 5-way `label`** in one tool-use call; keep/drop is **derived**. The four keep-types are **best-effort secondary signal** (5.3/5.4); the classifier is optimized/measured on the **noise-vs-keep boundary**, NOT gated on four-way accuracy.
- **FR-008**: The processor MUST run **autonomously on its own schedule**, decoupled from the 5.1 ingester (a separate scheduled job; no event-chaining this slice).
- **FR-009**: Noise filtering MUST meet a **two-sided** data-quality bar on the committed **gold eval set**: **drop ≥80% of true noise AND retain the large majority of true problems (low false-drop)** — **retention prioritized**.
- **FR-010**: Classification MUST use **title + ~500 tokens of body**; embedding MUST use **title + ~1000 tokens of body** — both **config knobs**.
- **FR-011**: Below a **confidence threshold**, an item MUST be **forced to keep** regardless of the model's label (bias against false-drops); the **confidence MUST be stored** (for 5.10 to revisit).
- **FR-012**: The slice MUST enforce a **hard per-run item cap** (default ~1,000) **and** a **daily dollar ceiling** (default $5); on breach it MUST **halt gracefully** (process up to the cap, log, exit — never crash). Both MUST be observable in logs.
- **FR-013**: Each derived row MUST store **reproducibility metadata**: the **classifier model version, the prompt/rubric version, and the embedding-model version** — enabling selective re-processing when any changes.
- **FR-014**: The initial backfill MUST run via a **one-shot asynchronous Batch-API command** (~half price); **incremental runs are synchronous** (no auto-switch threshold).
- **FR-015**: The migration adding the derived table MUST be **additive** — it MUST NOT alter, drop, or write to any existing table; the derived table is new with an FK to `raw_items` only.
- **FR-016**: The derived schema MUST remain **Drizzle-owned, single-migration-authority**; the contract artifact + drift test MUST be **extended to cover the new table** (today both cover only `raw_items`).
- **FR-017**: Secrets (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, DB) MUST come from the environment per the 5.1 convention (Railway for prod, gitignored local env for dev); none committed.

### Key Entities

- **`processed_items`** (new; the only table this slice adds): one row per processed `raw_item`. Attributes (final shape in Decision 1): `id`; `raw_item_id` (FK → `raw_items`, **unique** — the idempotency key); **`label`** (5-way enum); `reason` (short text); `confidence` (numeric); `forced_keep` (bool — set when low-confidence overrode a `noise` call, FR-011); `normalized_text` (what was embedded); `embedding` (1536-dim vector, **null for `noise`**); **`classifier_model`, `prompt_version`, `embedding_model`** (reproducibility, FR-013); `processed_at`. **Keep/drop is derived** (`label != 'noise'`), not stored separately. **HNSW** index on `embedding` for 5.3's nearest-neighbor joins.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** (filtered, two-sided): On the committed gold eval set, **≥80% of true noise is dropped AND the large majority of true problems are retained** (low false-drop, retention prioritized) — measured, not asserted.
- **SC-002** (embedded): **100% of kept rows carry a 1536-dim embedding**; 0% of `noise` rows do; the embedding index answers nearest-neighbor queries (5.3's prerequisite).
- **SC-003** (incremental/idempotent): A re-run over fully-processed data classifies/embeds **0** items and spends **$0**; a partial set processes exactly the unprocessed remainder.
- **SC-004** (immutable source): After any number of runs (including truncate-and-reprocess), `raw_items` is **byte-for-byte unchanged**.
- **SC-005** (no half-writes): At all times, **every kept row has an embedding and every derived row has a valid `raw_item`** — including after an injected mid-item failure.
- **SC-006** (bounded cost): A run never exceeds the per-run cap; the daily $ ceiling halts work gracefully; the backfill uses the async batch path. Average per-item classification cost stays low (build-plan target order **~$0.0001/item**).
- **SC-007** (reproducible): Every derived row carries its classifier-model, prompt/rubric, and embedding-model versions, enabling selective re-processing.
- **SC-008** (no app-table impact): Every pre-existing table is structurally + data-identical after the migration and many runs; only `processed_items` is added.

---

## Build-plan reconciliation *(constitution §7 — resolved)*

Build-plan 5.2 labels each item **complaint / bug / feature-request / wish / noise** (five buckets). This is **retained**: `processed_items.label` stores the 5-way value, and **keep/drop is derived** as `label != 'noise'`. The simplification is only in **what's optimized/gated**: the DoD measures the **noise-vs-keep boundary**, and the four keep-types are best-effort secondary signal for 5.3/5.4 (not gated on four-way accuracy). So the build-plan's vocabulary is preserved on the row while the quality bar stays on the keep/drop decision that this slice exists to make.

---

## SETTLED Decisions *(all confirmed 2026-06-06; inherited by 5.3+)*

### Decision 1 — Data model: a new immutable-respecting derived table **[SETTLED]**
`raw_items` stays **immutable/append-only**; derived data goes in a **new `processed_items` table** (FK → `raw_items`, **unique `raw_item_id`** = idempotency key) holding the **5-way `label`**, reason, confidence, `forced_keep`, normalized text, the nullable embedding, and **reproducibility metadata** (classifier model, prompt/rubric version, embedding model). **Re-processing = `TRUNCATE processed_items` + re-run**; `raw_items` never mutated. **Migration `0006`** is **additive**: the table + the vector column + an **HNSW** index. *Grounded (accepted):* **pgvector is already enabled** (migration `0000` + `problems.embedding vector(1536)` on dev+prod), so `0006` only adds the table/index — but **includes `CREATE EXTENSION IF NOT EXISTS vector`** so it's self-contained when `conftest` applies it standalone (5.1 pattern). **Drizzle stays the single migration authority** (Python via asyncpg). The **`gen-contract` generator + drift test are extended to `processed_items`** (today both are `raw_items`-specific). `0006` applies to **both dev and prod** via the dual-target `db:migrate:all` (pre-flight both).

### Decision 2 — Classifier: Claude Haiku, 5-way label via tool-use; keep/drop derived **[SETTLED]**
**One Claude Haiku tool-use call** returns a **5-way `label`** + short reason + confidence; **keep/drop = `label != 'noise'`**. The four keep-types are best-effort secondary signal — **measured on the noise-vs-keep boundary only**. **Verified current (June 2026):** `claude-haiku-4-5-20251001` is the latest Haiku (4.5, Oct 2025; none newer), ~$1/$5 per Mtok. **Low-confidence → forced keep** (FR-011). Structured tool-use means a malformed response leaves the item unprocessed, not guessed. New Python dependency: the **Anthropic SDK** (per-slice ML dep under OD-7).

### Decision 3 — Embedder: OpenAI `text-embedding-3-small` @ 1536 dims **[SETTLED]**
**`text-embedding-3-small` at 1536 dimensions** — verified current (June 2026; `-3-large` @ 3072 is the higher-quality, bigger-commitment alternative). **1536 is locked by consistency with the existing `problems.embedding vector(1536)`.** Embed **title + ~1000 tokens of body** (config knob, FR-010). **HNSW** index (incremental-friendly). New Python dependency: the **OpenAI SDK** (per-slice ML dep, OD-7).

### Decision 4 — Orchestration: a separate, stateless-pickup processor **[SETTLED]**
A **separate Inngest scheduled job** processing **unprocessed items** (`raw_items` with no `processed_items` row — a `NOT EXISTS`/left-join pickup, **no cursor**), **decoupled from the ingester**. **Idempotent via `ON CONFLICT` on `raw_item_id`.** Per item, **classify + embed + insert atomically** so a partial failure leaves the item unprocessed and retried. **Event-chaining ingester→processor is out of scope.** *(Plus the one-shot backfill command of Decision 5 — async, run once.)*

### Decision 5 — Cost controls ship now (mini, ahead of the 5.6 dashboard) **[SETTLED]**
A **hard `MAX_ITEMS_PER_RUN` cap (default ~1,000)** AND a **daily dollar ceiling (default $5** — a runaway tripwire well above real cost); on breach, **halt gracefully** (process up to the cap, log, exit, remainder next run — never crash). The **initial ~3,200-item backfill** drains via a **one-shot Anthropic Message Batches command** (~half cost, async); **steady-state incremental runs are synchronous** (no auto-switch threshold). New secrets **`ANTHROPIC_API_KEY` + `OPENAI_API_KEY`** — gitignored `apps/pipeline/.env` for dev, **Railway variables** for prod (5.1's Decision 5 scoping).

---

## Assumptions

- **A1 — `processed_items` is the only schema change** (additive; FR-015). No app table, no `raw_items` change.
- **A2 — Drizzle stays the single migration authority**; the contract + drift mechanism generalize to the new table; Python uses asyncpg.
- **A3 — pgvector is already enabled on dev + prod** (migration `0000`); `0006` adds only the table/index (with a self-contained `CREATE EXTENSION IF NOT EXISTS vector`).
- **A4 — Models verified current** (June 2026): Haiku `claude-haiku-4-5-20251001`; OpenAI `text-embedding-3-small` @ 1536.
- **A5 — Source-agnostic** — operates on any `raw_items.source`.
- **A6 — Only kept items are embedded** (`noise` ⇒ no embedding).
- **A7 — No event-chaining** ingester→processor; the processor is an independent scheduled job; the backfill is a one-shot command.
- **A8 — The gold eval set is built during implementation** (Claude drafts + auto-labels ~150–200; founder corrects → committed); the DoD is measured against it.
- **A9 — 1536 is locked** by consistency with `problems.embedding`.

## Dependencies

- **Slice 5.1** — `raw_items` (input), the dual-target `db:migrate:all`, the `gen-contract`/drift mechanism, the dev/prod Supabase split, the Inngest/Railway deploy path.
- **pgvector** — already enabled on dev + prod (migration `0000`).
- **Anthropic API** (Haiku 4.5 + Message Batches) and **OpenAI API** (`text-embedding-3-small`) — new keys.
- **Railway / Inngest** — the processor deploys + schedules alongside the 5.1 ingester.
- **`packages/db`** — owner of migration `0006` + the extended contract artifacts.
- **Standing CI caveat** — the standing pipeline CI runs on the **ephemeral container, never dev/prod**; it now needs **pgvector** → use **`pgvector/pgvector:pg16`** (GitHub Actions service **and** the local ephemeral container).

## Out of scope (this slice — considered for forward-compatibility)

- **Clustering** of kept items (5.3); **enrichment + synthesis** into `problems` (5.4).
- Using the four keep-type labels as anything beyond stored secondary signal (5.3/5.4 decide).
- The full **`/admin` cost dashboard + audit-log UI** (5.6) — this slice ships only the cap + $ ceiling.
- **Event-chaining** ingester→processor; **re-embedding** on model upgrades (future migration); a content-cache of LLM calls (the idempotency *is* the cache here).

## Review gate

**STOP after the plan.** All five SETTLED decisions are confirmed and the six former open questions are resolved into the spec above. The next step is `/speckit.plan` — and then a STOP for founder review before any `/speckit.tasks` or code. This slice is load-bearing for 5.3 and is the first to spend per item.
