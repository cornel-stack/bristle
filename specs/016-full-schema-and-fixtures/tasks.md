# Tasks: Full Product Schema + 15 Fixture Problems (Slice 4.1)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Data model**: [data-model.md](./data-model.md) · **Contracts**: [contracts/schema-and-types.md](./contracts/schema-and-types.md) · **Quickstart**: [quickstart.md](./quickstart.md)

**Branch**: `016-full-schema-and-fixtures` · **Base**: `d69dede` (main, slice-015 merged)

**Status**: DRAFT — held for founder shape-approval. **DON'T-IMPLEMENT guard active**: do not `/speckit.implement`, do not write code, do not commit tasks.md until explicit go (established pattern, slices 013–015). One commit per task (CLAUDE.md §7).

---

## Task count (re-verify at STOP 5 — slice-011/12/13 count-drift lesson)

**23 tasks total** — **22 code/commit-producing + 1 doc (§8 note)**. Five batches / five STOPs.

| Batch | STOP | Tasks | Count | Theme |
|---|---|---|---|---|
| 0 | 1 | T001–T005 | 5 | Schema extend + 15 tables + migration 0004 |
| A | 2 | T006–T008 | 3 | Source registry + shared Zod contracts |
| B | 3 | T009–T013 | 5 | Seed: 8 categories + 15 problems + hero depth |
| C | 4 | T014–T018 | 5 | Seed: demo user + user-scoped fixtures |
| D | 5 | T019–T023 | 5 | Typed queries + Tier-2 verify + gates + §8 note |

---

## Count cross-check matrix (re-assert verbatim at STOP 5)

| Metric | Count |
|---|---|
| New tables (migration 0004) | **15** |
| `problems` columns added | **7** (all nullable/defaulted — additive) |
| Migration statements | **22** (7 `ADD COLUMN` + 15 `CREATE TABLE`) |
| Source **badges rendered** | **5** (github, hackernews, stackexchange, appstore, forums — **no PH/Play**) |
| Source keys | **6** (→ 5 badges; so/se roll up) |
| Fixture problems | **15** (13 depicted + 2 fillers incl. **Analytics**) |
| Detail-complete fixtures (no empty page-2 section) | **15** (hero voluminous; other 14 compact-but-complete) |
| `compare_card` authored | **15** (all draggable into Compare) |
| Categories seeded | **8** canonical (§4.1a-tinted) |
| Demo users | **1** (fixed, deterministic) |
| New shared files | **2** (sources.ts, fixtures-contracts.ts) |
| New typed queries | **2** (getDashboardProblems, getProblemDetail) |
| New deps / new env vars / lockfile changes | **0 / 0 / 0** |
| `apps/web` files changed | **0** (no screens this slice) |

---

## ⚠️ Binding Design-delta (read before Batch A + B)

**`Core_app.pdf` shows SIX source badges; the canonical live set is FIVE.** Product Hunt + Google Play are **NOT seeded and NOT rendered** (founder override of the isLive-false default — no fixture the pipeline can't later fill). The source registry (T006), the hero donut + all `problem_sources` (T011/T012), and the Library source facets are **five sources only**: GitHub, Hacker News, Stack Exchange (SO + network → one badge), Apple App Store, developer Forums. Compare "X of 6" → **"X of 5"**. Hero breakdown: GitHub 20 / HN 13 / Stack Exchange 9 / App Store 3 / Forums 2 = 47. Do not reintroduce PH/Play chasing pixel-parity; the model stays extensible (FR-021/22) for a one-line re-add later.

## Idempotency strategy (D6 — applies to every seed task)

- **Natural-key upsert** (`onConflictDoUpdate`): `problems.slug`, `categories.key`, `users.email` (demo), `saved_collections (user_id,name)`, `alert_rules (user_id,name)`, `user_saved_problems (user_id,problem_id)`, `usage_meters (user_id,metric)`.
- **Replace-children** (delete-by-parent-then-insert, scoped to seeded parents): the unkeyed lists — `problem_quotes`, `problem_sources`, `existing_solutions`, `wtp_signals`, `problem_personas`, `problem_frequency_points`, `problem_related`, `alert_notifications`, `problem_activity_log`, `dashboard_fixtures`.
- Re-running `db:seed` MUST leave row counts unchanged and raise no constraint error (SC-002).

---

## Phase 0 — Schema + migration 0004 (STOP 1) · T001–T005

All schema edits in `packages/db/src/schema.ts`; **edit BEFORE `db:generate`** (slice-013/14/15 lesson). Same file → sequential (no [P]).

- [X] T001 [US1] Extend the existing `problems` table in `packages/db/src/schema.ts` — add 7 **nullable/defaulted** columns: `synthesis text`, `demand_status text`, `momentum_bucket text`, `mention_count_60d integer`, `first_seen_at timestamptz`, `updated_at timestamptz default now()`, `compare_card jsonb`. **Preserve all 11 existing columns** (`slug, title, category, momentum_pct, sparkline, top_quote, quote_source, sources, last_seen_at, created_at, embedding`) — no rename, no drop, no NOT-NULL relaxation. (dep: none)
- [X] T002 [US1] Add the 7 **problem-scoped child tables** in `schema.ts` per data-model.md §2: `problem_quotes`, `problem_sources`, `existing_solutions`, `wtp_signals`, `problem_personas`, `problem_frequency_points`, `problem_related` (FK → `problems`; `problem_related.related_problem_id` self-FK nullable). Export `$inferSelect`/`$inferInsert` types. (dep: T001)
- [X] T003 [US1] Add the **catalog + dashboard tables** in `schema.ts` per data-model.md §3: `categories` (key uniq, tint token keys, `problem_count`, `is_custom`, `created_by_user_id` FK nullable, `momentum_series jsonb`) + `dashboard_fixtures` (`user_id` FK, key, payload jsonb, uniq `(user_id,key)`). (dep: T002)
- [X] T004 [US1] Add the **5 user-scoped tables** in `schema.ts` per data-model.md §4: `saved_collections`, `user_saved_problems`, `alert_rules`, `alert_notifications`, `usage_meters` (FKs → `users`/`problems`/`saved_collections`; uniques per D6). `pnpm --filter @bristle/db typecheck` clean. (dep: T003)
- [X] T005 [US1] Generate + apply migration **0004**: `pnpm --filter @bristle/db db:generate` → `drizzle/0004_<name>.sql`. **HAND-VERIFY the SQL before migrating** — on `problems` ONLY `ADD COLUMN` (each nullable or with DEFAULT), **no `DROP`, no `ALTER … SET NOT NULL`**; plus `CREATE TABLE` × 15. Append a reverse-order `-- ROLLBACK` block (slice-015 convention). Then `pnpm --filter @bristle/db db:migrate` (DATABASE_URL_DIRECT). (dep: T004) **[GATE TASK]**

**STOP 1 gate** — foreground tsx probe (pooler fallback) confirms: all 16 product tables present (`problems` + 15 new); `problems` now has the 7 new columns; the 4 existing `problems` rows are still valid (new cols null/defaulted ⇒ Tier-2 premise holds — full render check is STOP 5). `typecheck` clean. Migration is additive-only on `problems`. Re-assert nothing in `apps/web` or Tier-3 tables changed.

---

## Phase A — Source model + shared Zod contracts (STOP 2) · T006–T008

Reusable contracts in `packages/shared` (CLAUDE.md §5). T006/T007 are separate files → **[P]**.

- [X] T006 [P] [US3] Create `packages/shared/src/sources.ts` — `SourceKey` (`gh,hn,so,se,appstore,forum`), `BadgeKey` (`github,hackernews,stackexchange,appstore,forums`), `SOURCE_REGISTRY: Record<SourceKey,{key,label,badgeKey}>`, `resolveBadge(key)` (so+se→`stackexchange`, forum→`forums`), `SOURCE_BADGES: readonly BadgeKey[]` (the 5, facet order). **NO Product Hunt / Google Play, no `isLive` flag** (Design-delta). No screen-facing type hardcodes a key. (dep: none)
- [X] T007 [P] [US1] Create `packages/shared/src/fixtures-contracts.ts` — Zod `CompareCardSchema` (5 scorecard cells `{value,tone}` + `bristlesRead {verdict,prose}`) and `WeeklyMomentumSchema` (`series[{categoryKey,points[]}]` + `caption`); export inferred types `CompareCard`, `WeeklyMomentum` (contracts §2). These are the v1.1-LLM target shapes (FR-031). (dep: none)
- [X] T008 [US1] Re-export `sources.ts` + `fixtures-contracts.ts` from `packages/shared/src/index.ts`. `pnpm typecheck && pnpm lint`. Assert `SOURCE_BADGES.length === 5` and the set contains no `producthunt`/`googleplay`. (dep: T006, T007)

**STOP 2 gate** — shared contracts compile + export; 5 source badges, SO/SE collapse to one, forums collapse to one; no PH/Play anywhere; no source key in a UI-facing type. Re-assert the Design-delta.

---

## Phase B — Seed: categories + 15 problems + hero depth (STOP 3) · T009–T013

All in `packages/db/src/seed.ts` (extend the existing 4-problem seed); **FK-ordered → sequential**. Validate every `source_key` against `SOURCE_REGISTRY`. `noUncheckedIndexedAccess`: iterate fixture arrays with for-of / `.at()`.

- [ ] T009 [US2] Seed the **8 canonical categories** in `seed.ts` (devtools, payments, ai-ml, auth-sso, deployment, analytics, mobile, email) — each with `label`, §4.1a tint token keys, the design's displayed `problem_count` (Devtools 142 / Payments 86 / AI-ML 124 / Auth&SSO 41 / Deployment 67 / Analytics 35 / Mobile 58 / Email per design), `is_custom=false`, and `momentum_series` (Devtools/AI-ML/Mobile carry the weekly-chart points). Upsert on `key`. (dep: STOP 1)
- [ ] T010 [US2] Seed the **15 fixture problems** at card level in `seed.ts` per data-model.md §5 — the 13 depicted + 2 fillers (`posthog-replay-mobile-sampling` Analytics, `vercel-build-cache-monorepo-miss` Deployment). **All 15 equally fleshed** (title, category, momentum_pct, momentum_bucket, demand_status, sparkline, mention_count_60d, first/updated, ≥1 top quote) — no thin cards (FR-028). **Backfill the 4 existing rows** (stripe/llm/expo/pgvector) with the new fields. Upsert on `slug`. (dep: T009)
- [ ] T011 [US2] Seed the **hero (Stripe webhooks) full depth** in `seed.ts` (FR-025/SC-009): `synthesis` (3 paras); `problem_sources` GitHub 20 / HN 13 / Stack Exchange 9 / App Store 3 / Forums 2 = 47 (**5 sources, no PH/Play**); `wtp_signals` 11 · $20–$99 · median $60; `problem_quotes` ≥5 incl. ≥3 `is_wtp_signal` with `stated_price_usd` + varied engagement (one App-Store quote with `rating`, null engagement); `problem_personas` Indie 22 / Eng 16 / Agency 6 / Other 3; `problem_related` 4 label-only links; `problem_frequency_points` 90-day with one `is_threshold_marker` (Apr 16); `existing_solutions` 6 (Hookdeck direct, Inngest adjacent, …); `compare_card` JSON (scorecards + Bristle's Read = STRONGEST), parsed via `CompareCardSchema`. Replace-children idempotency. (dep: T010)
- [ ] T012 [US2] Seed **compact-but-complete detail pages + `compare_card` for the other 14 problems** in `seed.ts` (refinement 1: page-2 is reachable for ANY problem, so no detail page may render empty sections — Tier-4's purpose is "looks complete"). Each of the 14 gets a **minimum in every page-2 section**: **4–6** `problem_quotes`, **≥1** `existing_solutions`, **≥2** `problem_personas`, **≥2** `problem_related` links, a `problem_frequency_points` series, and `problem_sources` ≤ 5 live. **`wtp_signals` where applicable** — a problem with genuine WTP gets the aggregate row + WTP-flagged priced quotes; a problem the design shows at 0 WTP (e.g. pgvector on page 6) carries **no** `wtp_signals` row (an absent row is the correct "0" state, distinct from a thin page). The hero (T011) remains the only **voluminous** one (47 quotes / full evidence). (refinement 2: Compare is interactive — any problem can be dragged in) **`compare_card` JSON on each of the 14** (5 scorecard cells `{value,tone}` + `bristlesRead {verdict,prose}`, parsed via `CompareCardSchema`) so **all 15** carry one (hero's is in T011) — these are the v1.1-LLM-deferred hardcoded values, authored here not in 4.7. Replace-children idempotency. (dep: T011)
- [ ] T013 [US2] Run `pnpm --filter @bristle/db db:seed`; foreground probe: `count(problems)=15`; hero `problem_sources` sum = 47 across 5 keys; hero `wtp_signals` = 11/$60; no `producthunt`/`googleplay` keys in any seeded row. **All-15 detail completeness**: every problem has ≥2 `problem_personas`, ≥2 `problem_related`, ≥1 `existing_solutions`, ≥4 `problem_quotes`, a `problem_frequency_points` series, and a non-null `compare_card`; `wtp_signals` present for every problem the design shows with WTP. **Re-run `db:seed`** → identical counts, no error (idempotent). (dep: T012)

**STOP 3 gate** — 15 problems + child rows seeded; hero voluminous (47 quotes, 5 sources); **all 14 others compact-but-complete (no empty page-2 section)**; **all 15 carry a `compare_card`**; idempotent re-run clean; zero PH/Play keys. Probe results pasted.

---

## Phase C — Seed: demo user + user-scoped fixtures (STOP 4) · T014–T018

All in `seed.ts`; **must run after Phase B** (user_saved_problems FK → problems). Sequential.

- [ ] T014 [US2] Seed the **fixed demo user** in `seed.ts` — deterministic UUID (`00000000-0000-4000-8000-000000000001`), reserved email `demo@bristle.dev`, `email_verified` set, `password_hash` null (no credentials login), **`watched_categories` = the canonical 8 keys** (FR-029). Upsert on `email` (owning the unique row blocks a real-signup collision — FR-032). (dep: STOP 3)
- [ ] T015 [US2] Seed **saved_collections (4)** — Next product, Q3 brief candidates, Read later, For Jules to review (color + position) — and **user_saved_problems** mapping seeded problems into them with Kanban `position` (page-4 layout). Collections upsert on `(user_id,name)`; saved upsert on `(user_id,problem_id)`. (dep: T014)
- [ ] T016 [US2] Seed **alert_rules (4, one disabled)** — Payments momentum>+200 (5 fired, on), Auth&SSO any-new (3, on), Devtools weekly-count>100 (1, on), AI/ML WTP>5 (0, **disabled**) with `channels[]` — and the **alert_notifications** feed (momentum/new/wtp/digest/weekly/threshold types, read/unread). Rules upsert on `(user_id,name)`; notifications replace-children. (dep: T015)
- [ ] T017 [US2] Seed **problem_activity_log** (global entries e.g. "3 problems added in Auth&SSO" with null user_id; user entries e.g. "saved pgvector") + **usage_meters** (saved 28/50, categories 7, alerts 4, api_calls, new_mentions_24h 14 Δ+27, momentum_crossed_24h 3, alert_queue 7 sec="3 unread") + **dashboard_fixtures** `weekly_momentum` (validated via `WeeklyMomentumSchema`). Meters upsert on `(user_id,metric)`; activity + dashboard replace-children. (dep: T016)
- [ ] T018 [US2] Run `db:seed`; probe: demo user exists with `watched_categories` length 8; 4 collections; 4 alert rules (1 `enabled=false`); usage_meters present (saved 28/50). Re-run → idempotent. (dep: T017)

**STOP 4 gate** — demo user + all user-scoped fixtures seeded + idempotent; `watched_categories` = canonical 8; the disabled rule present. Probe results pasted.

---

## Phase D — Typed queries + Tier-2 verify + gates (STOP 5) · T019–T023

- [ ] T019 [US3] Add to `packages/db/src/queries.ts`: `getDashboardProblems()` (ORDER BY `momentum_pct` DESC, returns `Problem[]` fully typed) and `getProblemDetail(slug)` (joins the 7 child tables for page-2). Export both from `packages/db/src/index.ts`. Existing `getFirstProblem`/`getProblemBySlug`/`getRecentProblems` signatures unchanged. (dep: STOP 4)
- [ ] T020 [US3] `pnpm typecheck && pnpm lint && pnpm build` (4/4). Foreground probe: `getDashboardProblems()` order = **312,184,96,72,58,41,37,29,24,19,15,12,11,8,6**; `getProblemDetail("stripe-webhooks-vercel-cold-starts")` returns the hero child sets; demo `watched_categories` resolve 1:1 to 8 `categories` rows (SC-011). (dep: T019)
- [ ] T021 [US1] **Tier-2 non-breakage render check** (FR-030/SC-010): local prod server (`pnpm --filter web build && start`), curl `/` (landing 200 + hero card renders the backfilled problem) and `/problems/<seeded-slug>` (200 + sample-report renders). Confirms extending `problems` broke nothing. (dep: T020)
- [ ] T022 Add a one-line `CLAUDE.md` §8 product-surface **documentation note** recording slice-016 — the product schema + fixtures, the **source-registry convention** (5 live badges in `packages/shared/src/sources.ts`), the **fixed demo-user** convention, and the **TF-019** follow-up pointer. **GUARDRAIL: documentation note ONLY — no constitution rule changes this slice** (no §3 stack edit, no §4 token edit, no §9 rule edit). Commit body frames it as audit-continuity. (dep: none — independent) **[doc-only]**
- [ ] T023 [US3] Push branch (HTTPS-token; SSH refused) → Vercel preview: build **Ready**, "Collecting page data" + no AUTH throw; preview landing + `/problems/<slug>` render the seeded/backfilled data (the seed already applied to the shared dev==prod Supabase — no separate preview seed). Re-assert the slice-integrity manifest + count matrix. **(No signed-in HTTP walks — no screens this slice.)** (dep: T021)

**STOP 5 gate** — typecheck/lint/build 4/4; momentum query ordered; hero detail joins; demo categories resolve; **landing + sample render on local AND preview**; preview build green; integrity manifest + count matrix re-asserted. Slice 4.1 schema+seed complete; slices 4.2–4.8 build on it.

---

## Dependencies

- **Intra-batch**: Batch 0 sequential (one file, T001→…→T005). Batch A: T006/T007 **[P]**, T008 depends on both. Batch B sequential (FK + one file: categories→problems→hero→other-children→probe). Batch C sequential, **after Batch B** (user_saved_problems FK → problems). Batch D: T019→T020→T021→T023 linear; T022 independent.
- **B before C** (problems must exist before `user_saved_problems`/activity FK them).
- **STOP gates** hold for founder review between batches.

## Slice-integrity diff scope (re-assert at STOP 5)

- **EDIT**: `packages/db/src/schema.ts`, `packages/db/src/seed.ts`, `packages/db/src/queries.ts`, `packages/db/src/index.ts`, `packages/shared/src/index.ts`, `CLAUDE.md` (§8 note).
- **NEW**: `packages/db/drizzle/0004_*.sql` + meta, `packages/shared/src/sources.ts`, `packages/shared/src/fixtures-contracts.ts`.
- **UNCHANGED (byte-identical)**: all `apps/web/**` (no screens), all Tier-3 auth/onboarding tables, the slice-004 `problems` existing 11 columns. **0 new deps, 0 new env vars, 0 lockfile changes.**

## Process-oddity carry-forwards

- Schema TS edited **before** `db:generate` (slice-013/14/15).
- `noUncheckedIndexedAccess` — iterate fixture arrays with for-of / `.at()`.
- **dev == prod** single Supabase; migrate via `DATABASE_URL_DIRECT` (5432); probe via foreground `tsx` with **transaction-pooler fallback** (`DATABASE_URL`, 6543) when the direct port times out (slice-015 STOP-7).
- Never print connection strings/secrets — use `redactConnectionString`.
- Sandbox can't run signed-in HTTP walks → **N/A this slice** (no screens; only the public Tier-2 landing/sample read `problems`).
- HTTPS-token git push (SSH agent refused): `git push "https://x-access-token:$(gh auth token)@github.com/cornel-stack/bristle.git" 016-full-schema-and-fixtures`.

## Risks & follow-ups

- **TF-019 (bundled, pending)** — category-catalog convergence (watched_categories array→join + 18-slug↔8-key merge). **Hard trigger: before the Tier-5.5 fixtures→live swap.** Demo user (canonical 8) carries every screen until then.
- **TF-020 (RESOLVED — not pending)** — Product Hunt + Google Play dropped from fixtures + UI (5 live badges only). Re-adding later = one registry entry (FR-021/22). Recorded as the binding Design-delta.
- **Risk**: a non-additive `problems` diff breaks Tier-2 → mitigated by the T005 hand-verify gate + the T021/T023 render checks.
- **Risk**: JSON columns lose type safety at read → mitigated by `CompareCardSchema`/`WeeklyMomentumSchema` parse at the boundary (T007/T011/T017).
