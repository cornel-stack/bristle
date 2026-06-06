# Tasks: Filter Classifier + Embedder — Slice 5.2

**Feature**: `specs/027-filter-classifier-embedder/` | **Branch**: `027-filter-classifier-embedder` | **Inputs**: spec.md · plan.md (all `5.2-OD-n` resolved)

> ## ⛔ DON'T-IMPLEMENT until green-lit. Slow/keen cadence: **per-batch STOP-for-review checkpoints** (A–E), one commit per task. Three provisioning **GATES** (KEYS / dev-DB / Railway+Inngest) block their batches; **Batches A–B + the eval HARNESS are gate-free** (mocked providers on a `pgvector/pgvector:pg16` container — **CI never spends**). **The DoD is data-quality** — the gold-eval `--live` gate is the headline. **No code until the founder says go.** **No tag at 5.2** (v0.5.0 = the 5.10 capstone).

## Execution model

5 batches, **40 tasks** (incl. 5 checkpoint + 3 gate tasks + 11 test tasks). The gold-eval gate, cost guard, atomicity, and two-table contract are **explicit gate tasks, not afterthoughts**.

| Batch | Theme | Tasks | Gate |
|---|---|---|---|
| **A** | `processed_items` + migration `0006` + two-table contract/drift + pgvector CI | T001–T008 | none (gate-free) |
| **B** | Classifier + embedder + processor + cost guard + tests (mocked providers, pgvector container) | T009–T024 | none (gate-free) |
| **C** | Apply `0006` to dev+prod + live drift + prod-unchanged proof | T025–T029 | **GATE-DEV-DB** |
| **D** | Gold eval set + the `--live` two-sided quality gate (the real DoD) | T030–T035 | **GATE-KEYS** (auto-label) + founder-run |
| **E** | Deploy + cron + Batch-API backfill + autonomous DoD + §8 | T036–T040 | **GATE-KEYS + GATE-RAILWAY/INNGEST** |

**User-story coverage**: US1 (label+embed, FR-001/002) → A+B+E · US2 (idempotent/incremental, FR-004/005) → T015/T019/T028 · US3 (no half-write, FR-006) → T016/T020 · US4 (cost cap, FR-010/012) → T017/T021/T022 + the backfill T038 · DoD (FR-009 two-sided) → Batch D.

### Count cross-check
NEW committed: `packages/db` — `processedItems` in `pipeline-schema.ts`, `drizzle/0006_*.sql` (+journal/snapshot), `contracts/processed_items.contract.json` · `apps/pipeline/src/pipeline/{classify,embed,cost,process,backfill}.py` + `eval/{harness.py, gold_set.jsonl}` + 8 new tests · `apps/pipeline/.env.example` keys. EDIT in-app: `packages/db/scripts/gen-contract.ts` (two tables), `apps/pipeline/src/pipeline/{settings,db,inngest_fns}.py`, `apps/pipeline/pyproject.toml`+`uv.lock` (anthropic, openai), `apps/pipeline/tests/{conftest,test_schema_contract}.py`, `.github/workflows/pipeline-ci.yml` (→ pgvector), `CLAUDE.md` §8. **0** app-table DDL · **0** app-code change · **0** new JS dep · new deps = **anthropic + openai only** · `apps/pipeline` stays OUT of pnpm/Turbo · the 5.1 ingester (`hn.py`/`ingest`) UNCHANGED.

## Standing constraints (every task)
**`raw_items` immutable** — derived data in `processed_items` only (FR-003). **Additive `0006`** — no app-table DDL (FR-015). **Keep/drop derived** `label != 'noise'` (FR-001) — not stored. **Atomic per item** — `ON CONFLICT (raw_item_id) DO NOTHING`; partial failure → unprocessed → retried, never half-written (FR-006). **Stateless `NOT EXISTS` pickup** — no cursor (FR-004). **Only kept items embed** (FR-002). **CI mocks both providers → never spends** (5.2-OD-9); the `--live` eval + the Batch backfill are the only real-spend paths, both gated/founder-run. **Drizzle = single migration authority**; contract + drift cover **both** tables. **Two-project tax**: `0006` to dev+prod via the hardened `db:migrate:all` (pre-flight both). **No tag at 5.2.**

---

## Batch A — Schema `0006` + two-table contract/drift + pgvector CI *(GATE-FREE)*

- [ ] **T001** [P] Add `processedItems` to `packages/db/src/pipeline-schema.ts` — Drizzle table per plan §A: `id` uuid PK; `raw_item_id` uuid FK→`raw_items(id)` **UNIQUE** `ON DELETE CASCADE`; `label` text; `reason` text; `confidence` real; `forced_keep` boolean default false; `normalized_text` text; `embedding` `vector(1536)` NULL; `classifier_model`/`prompt_version`/`embedding_model` text; `processed_at` timestamptz default now(). Export `ProcessedItem`/`NewProcessedItem`. (FR-001/002/013, 5.2-OD-2)
- [ ] **T002** Wire `processedItems` into the drizzle-kit `schema` array + the `@bristle/db` barrel (alongside `rawItems`); confirm no app-table diff. (FR-016)
- [ ] **T003** Generate migration `0006`: `pnpm --filter @bristle/db db:generate` → `0006_*.sql`; **hand-top with `CREATE EXTENSION IF NOT EXISTS vector`** (self-contained standalone apply, the 0000 precedent) and **the HNSW index** `USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64)` if drizzle-kit doesn't emit HNSW params. Hand-verify: `CREATE TABLE processed_items` + FK + unique + HNSW only — **zero diff to any existing table**. (FR-011/015, SC-008, 5.2-OD-5)
- [ ] **T004** Generalize `packages/db/scripts/gen-contract.ts` — iterate a `{raw_items: rawItems, processed_items: processedItems}` map → emit **both** `raw_items.contract.json` (unchanged) **and** `processed_items.contract.json` (incl. the `vector(1536)` column, the HNSW index, the FK + unique on `raw_item_id`); keep it chained into `db:generate`. Run it; commit both contracts. (FR-012/016)
- [ ] **T005** [P] Flip the **CI** service image in `.github/workflows/pipeline-ci.yml` from `postgres:16` → **`pgvector/pgvector:pg16`** (so `0006`'s extension + vector column + HNSW apply). (Dependencies — CI caveat)
- [ ] **T006** [P] Update `apps/pipeline/tests/conftest.py` + the README dev command to spin the local ephemeral container as **`pgvector/pgvector:pg16`** (not `postgres:16-alpine`); conftest applies **`0006`** (+ `0005` if the test needs `raw_items`). (OD-5 container)
- [ ] **T007** [P] Add `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` (+ the new tunables) to `apps/pipeline/.env.example` with comments (real values gated — Railway prod / gitignored dev). (FR-017, 5.1 Decision 5)
- [ ] **T008** **CHECKPOINT A (non-code gate)** — STOP for review: the `processed_items` shape (T001), the generated `0006` SQL is additive (`CREATE TABLE` + FK + unique + HNSW + `CREATE EXTENSION IF NOT EXISTS`, zero app-table diff; T003), and **both** contracts (T004). **No database touched.** Do not start Batch B until reviewed.

## Batch B — Classifier + embedder + processor + cost guard + tests *(GATE-FREE; `pgvector/pgvector:pg16` container, both providers MOCKED)*

- [ ] **T009** Add `anthropic` + `openai` to `apps/pipeline/pyproject.toml`; `uv sync` → `uv.lock`. (5.2-OD-1, standing OD-7)
- [ ] **T010** Extend `apps/pipeline/src/pipeline/settings.py` — `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `MAX_ITEMS_PER_RUN` (default 1000), `DAILY_USD_CEILING` (default **$20**), `FORCED_KEEP_BELOW` (default 0.5 — starting, calibrated in D), `CLASSIFY_BODY_TOKENS` (~500), `EMBED_BODY_TOKENS` (~1000), `CLASSIFIER_MODEL=claude-haiku-4-5-20251001`, `EMBEDDING_MODEL=text-embedding-3-small`, `PROMPT_VERSION`. (FR-010/011/012/013/017, 5.2-OD-3)
- [ ] **T011** Extend `apps/pipeline/src/pipeline/db.py` — `PROCESSED_ITEMS_COLUMNS` spec; `unprocessed_raw_items(conn, limit)` (the `NOT EXISTS` pickup, source-agnostic); `insert_processed(conn, row)` = atomic `INSERT … ON CONFLICT (raw_item_id) DO NOTHING` with the pgvector codec for `embedding`. (FR-004/006, SC-003/005)
- [ ] **T012** Create `apps/pipeline/src/pipeline/classify.py` — Anthropic client; **one Haiku tool-use call** → `{label, reason, confidence}` (5-way enum schema); the **rubric prompt from the spec**; **forced-keep** when `confidence < FORCED_KEEP_BELOW` (override `noise` → kept, set `forced_keep`); records `classifier_model` + `prompt_version`; a malformed/invalid tool result raises (item left unprocessed). Injectable transport for tests. (FR-001/007/011, Decision 2)
- [ ] **T013** Create `apps/pipeline/src/pipeline/embed.py` — OpenAI client; `text-embedding-3-small` @ 1536; input `title + body[:EMBED_BODY_TOKENS]`; returns the 1536-vector; records `embedding_model`. Injectable transport. (FR-002/010, Decision 3)
- [ ] **T014** Create `apps/pipeline/src/pipeline/cost.py` — token→$ accounting for both providers; tracks a run against `MAX_ITEMS_PER_RUN` + `DAILY_USD_CEILING`; exposes a `should_halt()` + a graceful-halt result (`processed/halted/reason`); never raises on breach. (FR-012, SC-006)
- [ ] **T015** Create `apps/pipeline/src/pipeline/process.py` — the per-item pipeline: `unprocessed_raw_items` → normalize → `classify_fn` → (`embed_fn` if `label != 'noise'`) → **atomic** `insert_processed`; **injectable `classify_fn`/`embed_fn` seam** (the 5.1 `fetch` pattern, so tests mock providers); honors the cost guard + per-run cap; run-counters (processed/kept/dropped/halted). (FR-001/002/004/006/012)
- [ ] **T016** Extend `apps/pipeline/src/pipeline/inngest_fns.py` — a **SECOND** scheduled function `fn_id="process-items"` (distinct from `hn-ingest`; same app/service — 5.2-OD-4), `concurrency:1`, retries; single-context handler (the 5.1 convention); invokes `process.run`. (FR-008, Decision 4)
- [ ] **T017** Extend `apps/pipeline/tests/test_schema_contract.py` — assert **both** live tables (`raw_items` + `processed_items`) == their committed contracts == their Python column specs, incl. the `vector(1536)` column, the **HNSW index**, and the **FK + unique** on `raw_item_id`. (FR-012/016 — the two-table contract risk)
- [ ] **T018** [P] **`tests/test_classify.py`** — `test_classify_toolschema`: a malformed tool result → raises → item left unprocessed (not guessed); a valid result → `{label,reason,confidence}`; mocked Anthropic transport. (FR-007, edge case)
- [ ] **T019** [P] **`tests/test_process_idempotent.py` (GATE)** — re-run over fully-processed data does **0 work** (the `NOT EXISTS` pickup returns none); a partial set processes only the remainder; mocked providers. (FR-004, SC-003)
- [ ] **T020** [P] **`tests/test_atomic_partial_failure.py` (GATE)** — embed **fails after** classify for a kept item → **no `processed_items` row** → retried next run; concurrent/double-run → exactly one row (`ON CONFLICT`). (FR-006, SC-005)
- [ ] **T021** [P] **`tests/test_embedding_invariant.py`** — every kept row (`label != 'noise'`) has a 1536-vector; every `noise` row has `embedding IS NULL`; a forced-keep item embeds. (FR-002, SC-002)
- [ ] **T022** [P] **`tests/test_cost_cap.py` (GATE)** — a backlog > `MAX_ITEMS_PER_RUN` processes **exactly the cap**, remainder left for next run. (FR-012, SC-006)
- [ ] **T023** [P] **`tests/test_spend_ceiling.py` (GATE)** — a simulated spend > `DAILY_USD_CEILING` **halts gracefully** (processes up to the breach, logs, exits 0 — **no crash**). (FR-012, SC-006)
- [ ] **T024** [P] **`tests/test_forced_keep.py`** — `confidence < FORCED_KEEP_BELOW` forces keep regardless of a `noise` label, the item **embeds**, and `forced_keep=true` + `confidence` are stored. (FR-011)
  **CHECKPOINT B (non-code gate)** — STOP for review: the 5.1 ingester untouched + the **full suite green on `pgvector/pgvector:pg16` with both providers mocked, ZERO spend**. Do not start Batch C until reviewed.

## Batch C — Apply `0006` to dev+prod + live drift + prod-unchanged proof *(GATE: GATE-DEV-DB)*

- [ ] **T025** **GATE-DEV-DB** (non-code) — confirm dev Supabase reachable (exists since 5.1); capture a **PROD app-table baseline** (row counts, `processed_items` absent) before applying. (SC-008)
- [ ] **T026** Run `pnpm --filter @bristle/db db:migrate:all` → `0006` to **dev AND prod** (pre-flight both; additive — prod gets the empty `processed_items`). (FR-015, two-project tax)
- [ ] **T027** Run the **two-table drift test** against live **dev** (+ prod) — both tables == their contracts. (FR-012, SC-008)
- [ ] **T028** Run a **dev integration smoke** with mocked providers against live dev (or a tiny real `--live` sample, gated) → confirm `unprocessed_raw_items` picks up HN rows + the atomic insert works on real pgvector. (FR-004/006)
- [ ] **T029** **CHECKPOINT C (non-code gate)** — STOP: dev+prod have `processed_items`; **prod app tables byte-unchanged SHOWN** (before/after counts identical, only the empty `processed_items` added — the 5.1 pattern). Do not start Batch D until reviewed.

## Batch D — Gold eval set + the `--live` quality gate (the real DoD) *(GATE: GATE-KEYS for auto-label; founder-run correction)*

- [ ] **T030** **GATE-KEYS** (non-code) — confirm `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` in dev `apps/pipeline/.env` (gitignored). (FR-017)
- [ ] **T031** Create `apps/pipeline/eval/harness.py` — loads `gold_set.jsonl`, runs the classifier prompt over each item, computes **two-sided** metrics (noise-drop rate + problem-retention rate), and **asserts drop ≥ 80% AND retention ≥ target**; `--live` (real Haiku, ~$0.20) vs the default **mocked/replay** mode (5.2-OD-9). (FR-009, SC-001)
- [ ] **T032** Draft + **auto-label a stratified ~150–200-item HN-only sample** of dev `raw_items` (stratified by Claude's draft label) → `apps/pipeline/eval/gold_set.draft.jsonl`. (5.2-OD-7 — HN-only)
- [ ] **T033** **FOUNDER correction (founder-run)** — the founder reviews/corrects the draft labels → commit the frozen **`apps/pipeline/eval/gold_set.jsonl`**; **set the retention target on the labeled set** (5.2-OD-6) and **calibrate `FORCED_KEEP_BELOW`** to meet it (5.2-OD-3). (FR-009/011, the DoD's measuring stick)
- [ ] **T034** [P] **`tests/test_eval_regression.py`** — CI runs `harness.py` in mocked/replay mode over the committed gold set as the **regression guard** (deterministic, spend-free); fails if the prompt regresses below the committed thresholds. (5.2-OD-9, SC-001)
- [ ] **T035** **CHECKPOINT D (the DoD gate)** — STOP: `gold_set.jsonl` + the retention target + the calibrated threshold are committed, and the **`--live` eval asserts drop ≥ 80% AND retention ≥ target**. This is the slice's real DoD (FR-009/SC-001). Do not start Batch E until reviewed.

## Batch E — Deploy + cron + Batch-API backfill + autonomous DoD + §8 *(GATES: GATE-KEYS + GATE-RAILWAY/INNGEST)*

- [ ] **T036** **GATE-RAILWAY/INNGEST** (non-code) — Railway holds `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` (+ the tunables); the deploy builds the updated `apps/pipeline`. (FR-017)
- [ ] **T037** Register/serve the **`process-items`** cron (same app/service as `hn-ingest`, distinct `fn_id`; 5.2-OD-4); a forced run processes a small live batch → `processed_items` populates on prod. (FR-008)
- [ ] **T038** Create `apps/pipeline/src/pipeline/backfill.py` + a one-shot command — **Anthropic Message Batches**: submit the ~3,200 backlog, **poll to completion, write results through the SAME atomic `insert_processed` path** (5.2-OD-8); **founder-run**, gated on keys; cost under the guard. (FR-014, SC-006)
- [ ] **T039** **(SLICE DoD verification — founder-observed)** Confirm on prod: `processed_items` populates; **kept ⇒ embedding** on real data; a **re-run does nothing** (idempotent); cost stays under the guard; **prod app tables still byte-unchanged**. (SC-002/003/004/005/006/008)
- [ ] **T040** [P] `CLAUDE.md` §8 note — the 5.2 conventions (`processed_items`/`0006`, the keep/drop-derived 5-way label, the processor cron, the cost guard, the gold-eval gate, the two-table contract) + the **durable `5.2-OD-n`** (esp. 5.2-OD-7 the HN-only-calibration follow-up) + a reaffirmation that the standing **OD-7** Python-dep principle still governs the two new ML deps. **CHECKPOINT E (slice gate)** — STOP: live DoD met. **NO TAG** (Tier-5 release is the 5.10 capstone).

## Slice-integrity manifest
**NEW (committed)**: `packages/db/drizzle/0006_*.sql` (+journal/snapshot) · `packages/db/contracts/processed_items.contract.json` · `apps/pipeline/src/pipeline/{classify,embed,cost,process,backfill}.py` · `apps/pipeline/eval/{harness.py, gold_set.jsonl}` · `apps/pipeline/tests/{test_classify,test_process_idempotent,test_atomic_partial_failure,test_embedding_invariant,test_cost_cap,test_spend_ceiling,test_forced_keep,test_eval_regression}.py`.
**EDIT (committed)**: `packages/db/src/pipeline-schema.ts` (+`processedItems`), `src/index.ts`, `scripts/gen-contract.ts` (two tables) · `apps/pipeline/src/pipeline/{settings,db,inngest_fns}.py` · `apps/pipeline/{pyproject.toml,uv.lock}` (anthropic, openai) · `apps/pipeline/tests/{conftest,test_schema_contract}.py` · `apps/pipeline/.env.example` · `.github/workflows/pipeline-ci.yml` (→ `pgvector/pgvector:pg16`) · `CLAUDE.md` §8 + SPECKIT pointer.
**EDIT (not committed / external)**: Railway vars (the two keys) · dev `apps/pipeline/.env` (gitignored).
**UNCHANGED**: `raw_items` (immutable) · all app tables + the 15 fixtures (prod) · web-app code · `pnpm-workspace.yaml`/`turbo.json` · the **5.1 ingester** (`hn.py`, `ingest/`) · `packages/ui`, `packages/shared`. **No app-table DDL, no app-code change, no new JS dep.**

## Risks & follow-ups
- **The DoD is a model-quality target** — the gold set + the two-sided `--live` gate make it measurable, but a prompt passing the ~180-item HN gold set can drift on the full corpus; retention-prioritized bar + forced-keep + the stored confidence/repro metadata feed the 5.10 tuning pass.
- **5.2-OD-7 (HN-only) follow-up** — the gold set + threshold are **HN-calibrated**; 5.6–5.10 MUST extend the gold set per source + re-measure the gate before trusting the filter on GitHub/SO.
- **Cost guard is estimate-based** — `$20/day` is a runaway tripwire well above steady-state; real $ accounting is 5.6/5.8. CI never spends (mocked); `--live` eval (~$0.20) + the backfill are the only real-spend paths, gated/founder-run.
- **Two-project tax holds** — `0006` to both via the hardened `db:migrate:all`.
- **Sandbox↔Supabase DNS flakiness** (project memory) — gated steps (C/D-autolabel/E) are founder-run; the sandbox proves the gate-free mocked-provider logic on the pgvector container.
- **No tag at 5.2** (v0.5.0 = 5.10).
