# Implementation Plan: Full Product Schema + 15 Fixture Problems (Slice 4.1)

**Branch**: `016-full-schema-and-fixtures` · **Spec**: [spec.md](./spec.md) · **Base**: `d69dede` (main, slice-015 merged)
**Status**: PLAN — held for review. **DON'T-IMPLEMENT guard active** — no `/speckit.tasks`, no code until founder go.

## Summary

Add migration **0004**: extend the slice-004 `problems` table (additive, non-breaking) and add **15 new tables** that give every value on `design/Core_app.pdf` pages 1–7 a typed home. Extend `packages/db/src/seed.ts` to seed the **8 canonical categories**, **15 fixture problems** (the 13 depicted + 2 fillers incl. Analytics; hero fully populated), and a **fixed demo user** with all user-scoped fixtures (collections, saved problems, alert rules, notifications, activity, usage meters, watched_categories = canonical 8). Add a **source registry + badge mapping** and **explicit Zod type contracts** for the JSON payloads in `packages/shared`. No screens, no pipeline, no new deps.

## Technical Context

**Language/stack**: TypeScript strict; Drizzle ORM 0.45; Supabase Postgres + pgvector; Turborepo `packages/db` (schema/migrations/seed/queries) + `packages/shared` (Zod/types); Zod. (CLAUDE.md §3.)
**Migration tooling**: drizzle-kit `generate` (reads `src/schema.ts`) → `drizzle/0004_*.sql`; `db:migrate` applies via `DATABASE_URL_DIRECT` (session pooler, 5432). Dev == prod (single Supabase `dbfiytvynngapoyqnrzb`; slice-013 discovery).
**Seed**: extend `packages/db/src/seed.ts` (`tsx`, loads repo-root `.env.local`); upsert via `onConflictDoUpdate` on natural keys.
**Scope**: data model + seed only. NO `apps/web` changes (schema-only; the Tier-2 surfaces keep working because every new `problems` column is nullable/defaulted).
**Unknowns**: none blocking — all founder-confirmed (A1–A8). Two items resolved in research.md (source registry "5 live" vs the 6–7 badges the screens show; placement of the dashboard weekly-chart fixture).

## Constitution Check

| Constitution rule | Status |
|---|---|
| §3 locked stack (Drizzle, Supabase+pgvector, Zod in shared) | ✅ used as-is; **0 new third-party deps, 0 new env**. Internal wiring only: `zod` (repo-pinned) → `packages/shared`; `@bristle/shared` (workspace) → `packages/db` — both inherent to FR-031's shared Zod contracts the seed validates against. |
| §5 all DB access via Drizzle; Zod shared in `packages/shared` | ✅ schema in `packages/db`, JSON/source contracts in `packages/shared` |
| §5 TS strict, no `any`, `noUncheckedIndexedAccess` | ✅ honored (fixture arrays iterated with for-of / `.at`) |
| §4 design tokens; §4.1a category tints | ✅ `categories` rows reference existing §4.1a token keys; **no new tokens, no UI** |
| §9 no new library without proposal | ✅ none added |
| §7 SDD: spec→plan→tasks→implement; one commit per task; STOP gates | ✅ this is plan; 5 STOP-gated batches below |

**No violations.** No Complexity Tracking entries required.

## Project Structure (this feature)

```
packages/db/src/
  schema.ts             # EXTEND problems (+nullable cols, +compare_card jsonb) + 15 new product tables
  seed.ts               # EXTEND: 8 categories + 15 problems + child rows + demo user + user-scoped fixtures
  queries.ts            # ADD getDashboardProblems() (momentum-sorted) + getProblemDetail(slug)
  index.ts              # export new tables/types/queries
  drizzle/0004_*.sql    # generated migration + meta
packages/shared/src/
  sources.ts            # NEW: SOURCE_REGISTRY (key → {badge, badgeKey, isLive}) + resolveBadge()
  fixtures-contracts.ts # NEW: Zod — CompareCardSchema, WeeklyMomentumSchema (+ inferred types)
  index.ts              # export the above
specs/016-full-schema-and-fixtures/
  plan.md · research.md · data-model.md · quickstart.md · contracts/schema-and-types.md
```

No `apps/web` files change this slice.

---

## Batching — 5 STOP-gated batches

Per the project's multi-STOP discipline. **One commit per task.** Each STOP holds for founder review.

### Batch 0 — Schema + migration 0004 (STOP 1)
Edit `schema.ts` BEFORE `db:generate` (slice-013/14/15 lesson). Extend `problems` additively; add the 15 tables (data-model.md). Generate 0004; hand-verify it is **additive only on `problems`** (nullable/defaulted; no drop, no alter-not-null) + creates the new tables. Apply via `db:migrate`. **Tier-2 non-breakage**: new cols null/defaulted, so the existing seed row still satisfies `getFirstProblem`/`getProblemBySlug` — landing card + `/problems/[slug]` still render. Verify all tables visible via foreground tsx probe.

### Batch A — Source model + shared Zod contracts (STOP 2)
`packages/shared/src/sources.ts`: `SOURCE_REGISTRY` (every badge the screens show), `resolveBadge(key)` collapsing SE-network→one badge + forums→one badge, `isLive` flag (exactly 5 true). `fixtures-contracts.ts`: `CompareCardSchema` + `WeeklyMomentumSchema` (+ types). Export from `index.ts`. No source key in any UI-facing type — screens import the registry. typecheck/lint.

### Batch B — Seed: categories + 15 problems + hero depth (STOP 3)
Extend `seed.ts`: upsert the **8 canonical categories** (counts + tint keys + per-category `momentum_series`), then the **15 problems** (all equally fleshed at card level) with their child rows (quotes, sources, solutions, wtp, personas, frequency points, related). **Hero (Stripe webhooks)** gets full depth: 47-quote source breakdown over the **5 live sources** (GitHub 20/HN 13/Stack Exchange 9/App Store 3/Forums 2 = 47; no PH/Play — D2), 11-WTP aggregate ($20–99, median $60) + WTP-flagged quotes with prices, personas (Indie 22/Eng 16/Agency 6/Other 3), 4 related links, 90-day frequency with validation-threshold marker, 6 solutions, `compare_card` JSON. Idempotent. Verify counts via probe.

### Batch C — Seed: demo user + user-scoped fixtures (STOP 4)
Upsert the **fixed demo user** (deterministic id, stable email, `watched_categories` = canonical 8) — collision-safe vs real signups. Seed: 4 saved collections + ordered saved problems (Kanban), 4 alert rules (one disabled) + the notifications feed, the activity log (global + user entries), usage meters (saved 28/50, etc.), the dashboard `weekly_momentum` fixture. Idempotent. Verify via probe.

### Batch D — Typed queries + Tier-2 verify + gates (STOP 5)
Add `getDashboardProblems()` (momentum desc, fully typed) + `getProblemDetail(slug)` joining child tables; confirm the momentum order matches page-3. Run typecheck/lint/build 4/4. Foreground probe: 15 problems, hero depth, demo-user fixtures, demo `watched_categories` resolve to 8 `categories` rows. **Tier-2 non-breakage**: landing hero card + a `/problems/[slug]` sample render (local prod server). Push → preview: confirm seed runs in preview + data present. Slice-integrity manifest. (Signed-in HTTP walks N/A — no screens this slice.)

---

## Slice-integrity manifest (expected diff)

- **EDIT**: `packages/db/src/schema.ts` (extend problems + 15 tables), `packages/db/src/seed.ts` (extend), `packages/db/src/queries.ts` (+2 queries), `packages/db/src/index.ts` (+exports), `packages/shared/src/index.ts` (+exports), `CLAUDE.md` (§8 slice touchpoint note).
- **NEW**: `packages/db/drizzle/0004_*.sql` + meta, `packages/shared/src/sources.ts`, `packages/shared/src/fixtures-contracts.ts`.
- **UNCHANGED (must stay byte-identical)**: all `apps/web/**` (no screens), all Tier-3 auth/onboarding tables, the slice-004 `problems` existing columns. **0 new deps, 0 new env vars.**

### ⚠️ Design-delta (binding for slices 4.2–4.8)
**`Core_app.pdf` shows SIX source badges** (GitHub, Hacker News, Stack Overflow/Stack Exchange, **Product Hunt**, App Store, **Google Play**). **The canonical live set is FIVE**: GitHub, Hacker News, Stack Exchange (SO + network → one badge), Apple App Store, developer Forums (Discourse). **Product Hunt and Google Play are NOT seeded and NOT rendered** — no fixture the pipeline can't later fill, and an `isLive=false` badge would go permanently empty at the Tier-5.5 swap (a source filter returning nothing on purpose). Concretely: hero donut + all `problem_sources` ≤ 5 sources; Library source facets = those 5; Compare "X of 6" → **"X of 5"**. When 4.2–4.8 are built to match the PDF, they match it **except the source list — five badges, not six**. **Do not reintroduce PH/Google Play chasing pixel-parity.** The source model stays extensible (FR-021/22) so re-adding either later — if access ever opens — is a one-line registry entry.

## Risks & follow-ups

- **TF-019 (bundled, from spec)** — category-catalog convergence (watched_categories array→join + 18-slug↔8-key merge). **Hard trigger: before Tier-5.5 fixtures→live swap.** Demo user (canonical 8) carries every screen until then.
- **~~TF-020~~ (RESOLVED — founder override, not a follow-up)** — Product Hunt + Google Play are **dropped from the seeded fixtures and the UI** (registry = 5 live badges only; no `isLive=false` dead badges). Recorded as the binding **Design-delta** above. Re-adding either later is a trivial registry entry (FR-021/22) — no schema or fixture change needed.
- **Risk**: a non-additive `problems` diff would break Tier-2. Mitigation: STOP-1 gate hand-checks the generated SQL is additive-only before `db:migrate`.
- **Risk**: JSON columns lose type safety at the read boundary. Mitigation: `compare_card`/`weekly_momentum` parsed through the shared Zod schemas (FR-031).

## Process-oddity carry-forwards

- Schema TS edited **before** `db:generate` (slice-013/14/15).
- `noUncheckedIndexedAccess` — iterate fixture arrays with for-of / `.at()`, not index access.
- **dev == prod** single Supabase; migrate via `DATABASE_URL_DIRECT`.
- DB verification via **foreground tsx probe** (detached/edge can't reach Supabase reliably); transaction pooler (`DATABASE_URL`, 6543) as fallback when the direct port times out (slice-015 STOP-7).
- Sandbox can't run signed-in HTTP walks — N/A here (no screens); preview confirms seed + data.
- Never print DB connection strings/secrets (use `redactConnectionString`).
