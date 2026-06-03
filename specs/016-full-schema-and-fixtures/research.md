# Research & Decisions: Slice 4.1 (Full Schema + Fixtures)

All decisions are founder-confirmed (A1–A8) or resolved here. Format: Decision / Rationale / Alternatives.

## D1 — Hybrid placement: child tables vs JSON-on-problem (A3, confirmed)
**Decision**: Relational/queried data → **child tables** (`problem_quotes`, `problem_sources`, `existing_solutions`, `wtp_signals`, `problem_personas`, `problem_frequency_points`, `problem_related`). Fixture-only v1.0 payloads → **JSON** with an explicit shared Zod contract: per-problem `problems.compare_card` (scorecards + Bristle's Read); dashboard-scoped `dashboard_fixtures.payload` (weekly-momentum series + caption); per-category `categories.momentum_series`.
**Rationale**: The screens filter/sort/join on quotes, sources, solutions, WTP, personas, frequency (page-3 facets, page-6 metrics, page-2 tabs) — those must be queryable rows. Compare scorecards + Bristle's Read are hand-authored prose never queried relationally and replaced wholesale by the v1.1 LLM → JSON behind a typed contract is correct. Frequency is a **child table** specifically because the Tier-5.9 pipeline writes per-point mention counts.
**Alternatives**: all-JSON (loses page-3 facet/sort queryability); all-tables (a `compare_card` table of one-row-per-problem prose is needless normalization for never-joined data).

## D2 — Source registry: FIVE live badges only (A6; founder override of the isLive-false default)
**Decision**: `SOURCE_REGISTRY` in `packages/shared` carries **only the five live sources** as rendered badges: GitHub, Hacker News, Stack Exchange (Stack Overflow + network → **one** badge), Apple App Store, developer Forums (Discourse). **Product Hunt and Google Play are NOT in the registry, NOT seeded, NOT rendered.** Source *keys* feeding the 5 badges: `gh→github`, `hn→hackernews`, `so→stackexchange`, `se→stackexchange`, `appstore→appstore`, `forum→forums` (6 keys → 5 badges via the SO/SE roll-up). No `isLive` flag — every registry entry is live by construction.
**Rationale**: Founder rule from the 4.1 brief — *no fixture the pipeline can't later fill*. An `isLive=false` badge violates exactly that: at the Tier-5.5 fixtures→live swap those facets go permanently empty, shipping a source filter that returns nothing on purpose. PH/Play were already removed two turns ago; they don't reappear in the UI. The model stays **extensible** (FR-021/22) — re-adding PH/Play later, if access opens, is a one-line registry entry with zero schema/fixture change.
**Consequences** (propagated): hero donut + all `problem_sources` ≤ 5 sources; hero breakdown re-balances to GitHub 20 / HN 13 / Stack Exchange 9 / App Store 3 / Forums 2 = 47 (PH's 3 + the design's split folded into App Store + Forums); Library source facets = the 5; Compare "X of 6" → **"X of 5"** (hero = 5 of 5). Recorded as the binding **Design-delta** in plan.md.
**Alternatives rejected**: `isLive=false` rendered badges (founder-overridden — dead facets); keep PH/Play in fixtures only (still renders a badge the pipeline can't fill).

## D3 — Source keys & continuity with the existing seed
**Decision**: Canonical short keys: `gh, hn, so, se, appstore, forum` (six keys → five badges; SO/SE roll up). **No `ph`/`gplay` keys** (D2). The existing seed rows use `gh/hn/so` — unchanged and valid. `problem_sources.source_key` and `problem_quotes.source_key` are `text`, validated at seed time against the shared registry keys. The badge mapping resolves keys → badges; **no screen-facing type hardcodes a key** (FR-022).
**Rationale**: Keeps the slice-004 `problems.sources` data valid (no rewrite), centralizes resolution in `packages/shared`, renders only fillable sources.

## D4 — `problems` extension is additive-only (A1/FR-030, Tier-2 non-breakage)
**Decision**: Preserve all 11 existing columns (`slug, title, category, momentum_pct, sparkline, top_quote, quote_source, sources, last_seen_at, created_at, embedding`). Add **nullable/defaulted** columns: `synthesis text`, `demand_status text`, `momentum_bucket text`, `mention_count_60d int`, `first_seen_at timestamptz`, `updated_at timestamptz default now()`, `compare_card jsonb`. The seed **backfills** the existing 4 rows with the new fields.
**Rationale**: The landing hero (`getFirstProblem`) and `/problems/[slug]` (`getProblemBySlug`) read only the existing columns; additive-nullable means zero app change and zero render regression (SC-010). The STOP-1 gate hand-verifies the generated SQL adds no NOT-NULL-without-default and drops nothing.
**Alternatives**: a separate `problem_details` 1:1 table (avoids touching `problems` but fragments the central entity and complicates the momentum query).

## D5 — Demo user: fixed, deterministic, collision-safe (A2/FR-032)
**Decision**: Seed upserts one demo user with a **deterministic UUID** (a fixed literal, e.g. `00000000-0000-4000-8000-000000000001`) and a **reserved email** (`demo@bristle.dev`) on conflict by email. Its `password_hash` is null (cannot log in via credentials — no real-signup collision, since signup would hit the unique-email constraint and the demo row owns it) and `email_verified` set. `watched_categories` = the canonical 8 keys (FR-029). All user-scoped fixtures reference this id.
**Rationale**: Deterministic id makes all FK references stable across re-seeds; reserved email + owning the unique row blocks a real signup from colliding; seeds identically in local + preview (both point at the same Supabase). 
**Alternatives**: seed-on-first-signup (couples seed to live auth, non-idempotent, breaks preview demo).

## D6 — Idempotency keys (FR-026)
**Decision**: Upsert via `onConflictDoUpdate` on natural keys: `problems.slug`, `categories.key`, `users.email` (demo), `saved_collections (user_id,name)`, `alert_rules (user_id,name)`, `user_saved_problems (user_id,problem_id)`, `usage_meters (user_id,metric)`. Child rows that lack a natural key (quotes, frequency points, personas, solutions, sources, notifications, activity) are **delete-by-parent-then-insert** within the seed (scoped to seeded problems/demo user) so re-running converges without duplication.
**Rationale**: Mixed strategy: natural-key upsert where one exists; replace-children for unkeyed lists. Keeps re-run row counts stable (SC-002).
**Alternatives**: synthetic deterministic ids on every child (more code, brittle); `onConflictDoNothing` everywhere (drifts when fixture text is edited).

## D7 — Dashboard weekly-chart + greeting literals placement
**Decision**: Per-category weekly series → `categories.momentum_series jsonb`. The chart caption + dashboard greeting summary → a `dashboard_fixtures (user_id, key, payload jsonb)` singleton (`key='weekly_momentum'`), typed by `WeeklyMomentumSchema`. The four stat tiles (14 +27% / 3 / 28 of 50 / 7·3-unread) → `usage_meters` rows (`used`, `quota`, `delta_pct`, `secondary_label`); "3 unread" and "alert queue 7" are also derivable from `alert_notifications`, but seeded as meters so the dashboard tile needs no aggregate query.
**Rationale**: Keeps per-category data on the category, dashboard singletons in one typed JSON home, numeric tiles as queryable meters.

## D8 — Related-problem links may target unseeded problems
**Decision**: `problem_related (problem_id, related_problem_id nullable, label, target_slug nullable, position)`. The hero's 4 related ("Webhook ordering on retries", "Idempotency keys vs cron jobs", "Edge runtime + crypto verification", "Background jobs in serverless") are **not** among the 15 → seeded as label-only links (`related_problem_id` null). When a related target IS a seeded problem, the FK is set.
**Rationale**: The design shows related problems that aren't in the fixture set; the model must hold both resolved and label-only links without inventing stub problems.

## D9 — Categories: canonical 8 only (A4/A5, confirmed)
**Decision**: Seed the 8 §4.1a-tinted keys (`devtools, payments, ai-ml, auth-sso, deployment, analytics, mobile, email`) with the design's displayed counts (Devtools 142, Payments 86, AI/ML 124, Auth & SSO 41, Deployment 67, Analytics 35, Mobile 58, Email/Comms ~ per design) and tint token keys. `is_custom=false`, `created_by_user_id=null`. The 18-slug onboarding catalog is untouched (TF-019).
**Rationale**: These 8 == `CATEGORY_LABELS` (slice-003) == §4.1a tints == every category the 7 screens render. Analytics has a tint + a sidebar count but no depicted problem → covered by a filler fixture.

## D10 — Process oddities (carry-forward, unchanged)
Schema-TS-before-generate; `noUncheckedIndexedAccess`; dev==prod single Supabase via `DATABASE_URL_DIRECT`; foreground tsx probe (pooler fallback) for DB verification; redact connection strings; no signed-in HTTP walks needed (no screens).
