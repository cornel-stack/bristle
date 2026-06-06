# Implementation Plan: Filter Classifier + Embedder — Slice 5.2

**Branch**: `027-filter-classifier-embedder` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT until green-lit.** Slow/keen cadence: **per-batch STOP-for-review checkpoints, NOT self-run-to-close.** Provisioning gates are explicit blocks. This is the **first per-item-spend** slice and its DoD is **data-quality, not "it runs"** — the gold-eval harness is the headline deliverable, the cost guard is the safety rail. **No `/speckit.tasks`, no code until the founder says go.** Slice **5.2 of 10** — **no tag** (v0.5.0 is the 5.10 capstone).

## Summary

Stand up the **processor**: a second `apps/pipeline` job that, for every unprocessed `raw_item`, makes **one Claude Haiku tool-use call** → a **5-way `label`** (`complaint`/`bug`/`feature-request`/`wish`/`noise`) + reason + confidence, **derives keep/drop** (`label != 'noise'`), and for kept items **embeds** (OpenAI `text-embedding-3-small` @ 1536) into a new **`processed_items`** table (migration **`0006`**, additive, HNSW index). `raw_items` stays immutable; the processor is a **separate, stateless `NOT EXISTS`-pickup cron** (idempotent on `raw_item_id`), per-item **atomic** (partial failure → unprocessed → retried). The DoD is enforced by a **committed gold eval set** + an eval harness measuring **two-sided** drop≥80%/retention; the spend is bounded by a **per-run cap + daily $ ceiling** with graceful halt. CI mocks both providers — **never real spend**.

## Constitution Check

- **Locked stack** (§3): Python 3.12, FastAPI, Inngest, Railway, Supabase + **pgvector**, Drizzle, **Claude Haiku** (filter classification — exactly §3's stated use), **OpenAI `text-embedding-3-small`** (embeddings — exactly §3) — all as specified. **PASS.**
- **OD-7 (Python ML deps)**: two new per-slice deps — the **Anthropic SDK** and **OpenAI SDK** — each justified per-slice (the constitution names these exact models; you don't hand-roll provider clients). Within the OD-7 principle (the JS no-dep rule doesn't transfer to the Python runtime). **CONFIRM in OD-1.**
- **All DB access through Drizzle** governs the web app; the Python pipeline uses asyncpg; **schema stays Drizzle-owned** (migration `0006`). The nuance from 5.1. **PASS.**
- **Additive, no app-table touch** (FR-015): `0006` is `CREATE TABLE processed_items` + FK + HNSW index (+ idempotent `CREATE EXTENSION IF NOT EXISTS vector`). **PASS.**
- **Workspace hygiene**: `apps/pipeline` stays out of pnpm/Turbo; `pipeline-ci.yml` extends (now on `pgvector/pgvector:pg16`). **PASS.**
- **Secrets via env** (§5/5.1 Decision 5): `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` in Railway (prod) / gitignored `apps/pipeline/.env` (dev); nothing committed. **PASS.**
- **Voice** (§6): operator logs only; dry, factual. **PASS.**

## Provisioning gates (the sequence backbone)

Most of 5.2 is **gate-free** — schema + migration authoring, the contract/drift generalization, the Python classifier/embedder/processor modules, and the **full test suite with both providers MOCKED** against an ephemeral **`pgvector/pgvector:pg16`** container. Only the live-spend/live-DB steps gate.

| Gate | Resource (founder-provisioned) | Unblocks | Blocks until present |
|---|---|---|---|
| **GATE-KEYS** | `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` — dev `apps/pipeline/.env` + Railway vars | Any **real** classify/embed: the dev integration run, the gold-set auto-label, the prod deploy + backfill | Batches D–E |
| **GATE-DEV-DB** | dev Supabase (exists since 5.1) | applying `0006` via `db:migrate:all` to dev+prod, dev integration | Batch C |
| **GATE-RAILWAY/INNGEST** | Railway + Inngest (exist since 5.1) | the processor cron registration + the prod backfill | Batch E |

> Gate-free CI honesty: tests run on **`pgvector/pgvector:pg16`** with `0006` applied in `conftest`, and the Anthropic + OpenAI clients **stubbed** — so dedup/atomicity/cap/eval-harness logic is **green before any key or Supabase exists**, and **CI never spends a cent**.

## Architecture

### A. Schema + migration `0006` (Drizzle-owned, gate-free to author)
A new pipeline-namespaced Drizzle table `processedItems` (in `packages/db`) → `drizzle-kit generate` emits **`0006_*.sql`** (offline). Columns: `id` uuid PK; `raw_item_id` uuid FK→`raw_items(id)` **UNIQUE** (idempotency key; `ON DELETE CASCADE`); `label` (text — OD-7 below on text-vs-enum); `reason` text; `confidence` real; `forced_keep` boolean default false; `normalized_text` text; `embedding` **`vector(1536)`** NULL; `classifier_model` text; `prompt_version` text; `embedding_model` text; `processed_at` timestamptz default now(). **Keep/drop is derived** (`label != 'noise'`), not stored. **HNSW index** on `embedding`. The SQL is hand-topped with `CREATE EXTENSION IF NOT EXISTS vector` (self-contained for the standalone conftest apply — the migration-0000 precedent). Applying `0006` is a **gated** step (Batch C).

### B. The TS↔Python contract — now TWO tables (generalize the 5.1 seam)
Today `gen-contract.ts` hardcodes `rawItems`→`raw_items.contract.json`, and `test_schema_contract.py` checks only `raw_items`. **Generalize both**: `gen-contract` iterates a `{rawItems, processedItems}` map → emits `raw_items.contract.json` **and** `processed_items.contract.json` (still chained into `db:generate`); the drift test asserts **each** live table == its committed contract == its Python column spec — extended to cover the **`vector(1536)`** column, the **HNSW index**, and the **FK + UNIQUE** on `raw_item_id`. Python gains a `PROCESSED_ITEMS_COLUMNS` spec alongside `RAW_ITEMS_COLUMNS`.

### C. The Python processor (gate-free to author + unit-test with mocked providers)
New modules under `apps/pipeline/src/pipeline/`:
```
classify.py     # Anthropic client; ONE Haiku tool-use call → {label, reason, confidence};
                # the rubric prompt (from spec); forced-keep on low confidence; model/prompt versions
embed.py        # OpenAI client; text-embedding-3-small @1536; title + body[:~1000 tok]
process.py      # the per-item pipeline: normalize → classify → (embed if kept) → atomic upsert
                #   INSERT … ON CONFLICT (raw_item_id) DO NOTHING; NOT EXISTS pickup; cap + spend guard
cost.py         # token→$ accounting; MAX_ITEMS_PER_RUN + DAILY_USD_CEILING; graceful halt
backfill.py     # one-shot Anthropic Message Batches drain (async) — separate command, gated on keys
settings.py     # (extend) ANTHROPIC_API_KEY, OPENAI_API_KEY, caps, thresholds, model IDs, versions
inngest_fns.py  # (extend) a SECOND scheduled function: the processor cron (separate from hn_ingest)
eval/           # the gold-eval harness (see D)
```
`db.py` gains `unprocessed_raw_items(limit)` (the `NOT EXISTS` pickup) + `insert_processed(...)` (the atomic upsert with the jsonb/vector codecs). Providers are injected (a `classify_fn`/`embed_fn` seam, the 5.1 `fetch` pattern) so tests mock them — **no real spend in CI**.

### D. The data-quality DoD — the gold eval set + harness (the headline, the analogue of 5.1's watermark-trap)
- **Gold set (build-time, founder-in-the-loop)**: a task drafts the rubric (already in the spec), **auto-labels a stratified ~150–200-item sample** of real dev `raw_items` (Claude), the **founder corrects** it, and the corrected labels are **committed** (e.g. `apps/pipeline/eval/gold_set.jsonl`) — the frozen measuring stick.
- **Eval harness (committed test)**: runs the **real classifier prompt** over the gold set (mocked transport in CI replays recorded outputs, OR a gated `--live` mode for a real measured run), computes **two-sided** metrics, and **asserts noise-drop ≥ 80% AND problem-retention ≥ target** (retention prioritized; the target % is OD-6). This is a **quality gate**, not prose — it fails CI if the prompt regresses.

### E. Cost safety + orchestration
- **Cap + ceiling** (`cost.py`): a run processes ≤ `MAX_ITEMS_PER_RUN` (default ~1000) and tracks estimated $ against `DAILY_USD_CEILING` (default $5); on either breach it **halts gracefully** (finish the in-flight item, log `processed/halted/reason`, exit 0) — never crash. Tested: backlog > cap → exactly cap; simulated spend > ceiling → graceful halt.
- **Processor cron** (`inngest_fns.py`): a **separate** Inngest scheduled function (OD-4 — same app/service as the ingester, distinct `fn_id`), `concurrency:1`, retries; **synchronous** per-item processing of the `NOT EXISTS` pickup.
- **Backfill** (`backfill.py`): a **one-shot** Message Batches command (async, ~half price) to drain the initial ~3,200; **gated on keys, founder-run**; steady-state stays the sync cron.

### F. CI + the pgvector container
`pipeline-ci.yml`'s service image `postgres:16` → **`pgvector/pgvector:pg16`** (so `0006`'s extension + vector column + HNSW index apply); the **local ephemeral container** the sandbox spins likewise becomes `pgvector/pgvector:pg16`. Providers mocked throughout — CI is spend-free.

## Batching (per-batch checkpoints — STOP for review at each boundary)

> One commit per task; **implementation halts at each checkpoint for founder review.** Batches A–B + D-harness are **gate-free**; C/E are **gated**.

- **Batch A — Schema `0006` + the two-table contract/drift generalization** *(gate-free)*.
  `processedItems` Drizzle table; generate `0006` (+ self-contained `CREATE EXTENSION`); generalize `gen-contract` (both contracts) + `processed_items.contract.json`; extend the drift test (both tables, incl. vector/HNSW/FK/unique); flip CI + the local container to `pgvector/pgvector:pg16`.
  **Checkpoint A**: review the `processed_items` shape + the generated `0006` SQL (additive, no app-table diff) + both contracts. *No DB touched.* — STOP.

- **Batch B — The processor + cost guard + tests (mocked providers)** *(gate-free; pgvector container)*.
  `settings`/`db` extensions; `classify.py` (rubric prompt, tool-use, forced-keep); `embed.py`; `process.py` (NOT EXISTS pickup, atomic `ON CONFLICT` upsert); `cost.py` (cap + ceiling + graceful halt); the second Inngest function. Tests on `pgvector/pgvector:pg16` with both providers stubbed: idempotent re-run (0 work), **partial-failure-leaves-unprocessed** (embed fails after classify → no row → retried), keep⇒embedding / noise⇒no-embedding, cap (backlog>cap→exactly cap), spend-ceiling graceful halt, drift (both tables).
  **Checkpoint B**: ingester-untouched + the full suite green on pgvector container, **zero spend**. — STOP.

- **Batch C — Apply `0006` to dev+prod + drift on live** *(GATE-DEV-DB)*.
  `db:migrate:all` (pre-flight both) → `0006` on dev + prod (additive; prod gets the empty `processed_items`); drift test green against live dev (+ prod); **prod app tables byte-unchanged, shown** (the 5.1 before/after pattern).
  **Checkpoint C**: dev+prod have `processed_items`; prod untouched but for the new empty table. — STOP.

- **Batch D — Gold eval set + the quality gate** *(auto-label is GATE-KEYS; founder-correction is founder-run)*.
  Stratified sample of dev `raw_items`; Claude auto-labels (gated on keys); **founder corrects → commit `gold_set.jsonl`**; the eval harness asserts two-sided drop≥80%/retention≥target. Tune the prompt until the gate passes.
  **Checkpoint D**: the gold set is committed and the **eval gate passes** (the real DoD). — STOP.

- **Batch E — Deploy + backfill + autonomous processing** *(GATE-KEYS + GATE-RAILWAY/INNGEST)*.
  Railway gets the two keys; the processor cron registers; the **one-shot Batch-API backfill** drains the ~3,200 (founder-run); confirm `processed_items` populates, kept⇒embedding holds on real data, a re-run does nothing, cost stays under the guard. §8 note.
  **Checkpoint E (slice gate)**: live processing meets the DoD (filtered, embedded, idempotent, bounded cost, prod isolated). **No tag.** — STOP.

## Open decisions the plan forces (each with a recommendation)

- **OD-1 — New deps (Anthropic + OpenAI SDKs).** **Recommend: accept** both as per-slice ML deps (OD-7; the constitution names these exact models). *Confirm.*
- **OD-2 — `label` as `text` vs a Postgres `enum`.** **Recommend `text`** + a CHECK or app-level validation — forward-compatible (adding a label later doesn't need an `ALTER TYPE`), simpler for the contract/drift introspection. *Alt: pg enum (stricter, heavier migration).* 
- **OD-3 — Confidence threshold for forced-keep.** **Recommend a config knob `FORCED_KEEP_BELOW` (default 0.5)** — tune on the gold set; bias against false-drops. Forced-keep items **do embed** (they're kept). *Confirm the default + that forced_keep is recorded.*
- **OD-4 — One Inngest app/Railway service or separate.** **Recommend: same app + service as the 5.1 ingester, a distinct `fn_id` (`process-items`)** — one deploy, shared secrets; the two crons are independent functions. *Alt: a second service (more isolation, more ops).* 
- **OD-5 — HNSW index params.** **Recommend pgvector defaults (`m=16, ef_construction=64`)** at this corpus size; revisit at scale (a 5.9/5.10 tuning concern). Distance op: **cosine** (`vector_cosine_ops`) to match embedding semantics. *Confirm.*
- **OD-6 — The retention target %.** **Recommend setting it WITH the founder on the gold set** (e.g. retain ≥95% of true problems) once labeled — not guessed now; retention is prioritized over drop-rate. *Confirm the method (set-on-gold-set).* 
- **OD-7 — Eval-set size + stratification.** **Recommend ~150–200 items stratified by source + by Claude's draft label** (so noise and each keep-type are represented). *Confirm size.*
- **OD-8 — Batch-API result handling.** **Recommend: the backfill command submits the batch, polls to completion, then writes results through the SAME atomic `insert_processed` path** (so batch + sync converge on one writer + the idempotency guarantee). *Confirm poll-then-write (vs a webhook).* 
- **OD-9 — Eval harness in CI: replay vs live.** **Recommend: CI runs the harness against recorded/mocked outputs (deterministic, spend-free); a gated `--live` mode** does a real measured run on demand. *Confirm CI stays mocked.*

## Slice-integrity manifest
- **NEW (committed)**: `packages/db/src/pipeline-schema.ts` (+`processedItems`) · `packages/db/drizzle/0006_*.sql` (+ snapshot/journal) · `packages/db/contracts/processed_items.contract.json` · `apps/pipeline/src/pipeline/{classify,embed,process,cost,backfill}.py` + `eval/**` (harness + `gold_set.jsonl`) + tests · `apps/pipeline/.env.example` (+ the two keys).
- **EDIT (committed)**: `packages/db/scripts/gen-contract.ts` (two tables) · `packages/db/package.json` (none needed if `db:contract` stays one script) · `apps/pipeline/src/pipeline/{settings,db,inngest_fns}.py` · `apps/pipeline/pyproject.toml`+`uv.lock` (anthropic, openai) · `apps/pipeline/tests/test_schema_contract.py` (two tables) · `.github/workflows/pipeline-ci.yml` (→ `pgvector/pgvector:pg16`) · `CLAUDE.md` §8 + the SPECKIT plan pointer.
- **EDIT (not committed / external)**: Railway vars (the two keys; external) · dev `apps/pipeline/.env` (gitignored).
- **UNCHANGED**: `raw_items` (immutable) · **all app tables + the 15 fixtures** (prod) · web-app code · `pnpm-workspace.yaml`/`turbo.json` (pipeline stays excluded) · the 5.1 ingester (`hn.py`, `ingest`) · `packages/ui`, `packages/shared`. **No app-table DDL, no app-code change, no new JS dep.**

## Risks & follow-ups
- **The DoD is a model-quality target, not a deterministic invariant** — the gold set + two-sided gate make it measurable, but a prompt that passes the ~180-item gold set can still drift on the full corpus. Mitigation: retention-prioritized bar + forced-keep + the 5.10 quality-tuning pass (which the stored confidence + reproducibility metadata feed).
- **Cost guard is estimate-based** (token→$); the $5 ceiling is a tripwire far above real cost (~$0.0001/item × 1000 ≈ $0.10/run). Real $ accounting is 5.6/5.8.
- **Batch-API latency** — the backfill is async (minutes–hours); the one-shot command polls; not a cron.
- **Two-project tax holds** — `0006` to both dev+prod via the hardened `db:migrate:all`.
- **Sandbox can't reach Supabase reliably** (project memory) — gated steps (C apply, D auto-label, E deploy/backfill) are **founder-run**; the sandbox proves the gate-free logic (mocked-provider tests on the pgvector container).
- **No tag at 5.2** (v0.5.0 = 5.10).

## Process oddities
- **Gate-free vs gated split**: Batches A–B + the D harness/tests are CI/sandbox-verifiable with **mocked providers + a pgvector container** (zero spend, no Supabase); C/D-autolabel/E are founder-run behind GATE-KEYS / GATE-DEV-DB / GATE-RAILWAY. 
- **DoD evidence is split**: idempotency/atomicity/cap/no-half-write + the eval gate are proven by **mocked-provider pytest**; the *live* filtered/embedded/bounded-cost behavior is **founder-observed** on dev (Batch D real `--live` eval) + prod (Batch E backfill).
- **CI never spends** — providers mocked; `--live` eval + backfill are explicit, gated, founder-run.
- **HTTPS-token push** (SSH unavailable in-sandbox), as in 5.1.
