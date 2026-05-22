# Implementation Plan: Supabase + Drizzle + One Persisted Problem

**Branch**: `004-supabase-drizzle-persisted-problem` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-supabase-drizzle-persisted-problem/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Code snippets below are *illustrative shapes for review*, not files to create yet.

## Summary

Replace the hardcoded homepage fixture with a real read path: a `problems` table (Drizzle schema in `packages/db`) on Supabase Postgres with the `vector` extension provisioned, a committed first migration, a typed `postgres-js` client (`{ prepare: false }`) and `getFirstProblem()` helper, a category key→label const map in `packages/shared`, an idempotent seed of the canonical "Stripe webhooks" problem, and a homepage rewritten as a Server Component that fetches that row and renders it through the existing `ProblemCardFull`. The Slice 1.3 client toggle/second card are removed.

**Key architectural decision (resolved clarifications)**: two connection strings — `DATABASE_URL` (Transaction pooler, `prepare:false`, runtime queries) and `DATABASE_URL_DIRECT` (session mode, port 5432, **migrations only**, where advisory locks + prepared statements work). `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` are documented in `.env.example` for forward compat but unused by code this slice.

## Technical Context

**Language/Version**: TypeScript 5.8.x (strict), Node 20, React 19.1.0, Next.js 15.5.18 (App Router).

**Primary Dependencies (new)**: `drizzle-orm@0.45.2`, `postgres@3.4.9` (postgres-js driver), `drizzle-kit@0.31.10` (dev, migration generation + studio). Existing: `@bristle/ui` (ProblemCardFull), Tailwind v4.

**Storage**: Supabase Postgres + `pgvector`. Runtime via Transaction pooler (port 6543, `prepare:false`); migrations via session/direct connection (port 5432).

**Testing**: none this slice (Vitest/Playwright later); verification is migrate-on-fresh-DB + idempotency, seed idempotency, local + preview render, SQL inspection of the vector column, typecheck/lint/build.

**Target Platform**: Web (Vercel preview + production), reading from the production Supabase DB.

**Project Type**: Turborepo monorepo — `apps/web`, `packages/db` (new surface), `packages/shared` (new const), `packages/ui` (consumed).

**Performance Goals**: unchanged (LCP < 2.5s; the page is one server-rendered card + a single indexed-by-PK row read).

**Constraints**: TS strict (no `any`); Server Components only on the page (no `"use client"` in the page tree); all DB access through Drizzle (CLAUDE.md §5); no secrets committed (`.env*` except `.env.example` absent from `git ls-files`); pooler forbids prepared statements.

**Scale/Scope**: 1 table, 1 migration, 1 seed row, 1 fetch helper, 1 const map, 1 page rewrite. ~10 changed/added files.

## Constitution Check

*Constitution = `CLAUDE.md`.*

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | Supabase Postgres + pgvector, Drizzle (not Prisma), `postgres-js` driver — all named in §3. New deps (`drizzle-orm`, `postgres`, `drizzle-kit`) are the locked DB stack, not new choices. |
| §5 Conventions | PASS | All DB access through Drizzle in `packages/db`; no raw SQL in app code (raw SQL only inside the migration). Server Components by default; page stays server. Zod shared schemas N/A (no forms this slice). No `localStorage`. kebab-case files. |
| §5 Env / secrets | PASS | `.env.example` committed with placeholders; real values gitignored (`.gitignore` already has `.env`, `.env.*`, `!.env.example`); `.env*` absent from `git ls-files`. |
| §6 Voice | PASS | No user-facing copy added beyond the seeded data. |
| §9 Never-do | PASS | No `design/`/PDF edits; spec→plan→tasks→implement order; building exactly this slice; Drizzle is in stack; no browser storage. |
| §10 Ambiguity | PASS | All 5 clarifications resolved in the spec. |

**Result**: PASS. No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/004-supabase-drizzle-persisted-problem/
├── spec.md                      # done
├── plan.md                      # this file
├── research.md                  # Phase 0 — driver/pooler/migration decisions
├── data-model.md                # Phase 1 — problems table + row→props mapping
├── quickstart.md                # Phase 1 — env setup + db:generate/migrate/seed + verify
├── contracts/
│   └── db-package.md            # Phase 1 — @bristle/db public surface contract
└── tasks.md                     # Phase 2 — NOT created here
```

### Source Code (exact file tree of changes/additions)

```text
.env.example                     # ADD — DATABASE_URL, DATABASE_URL_DIRECT, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (placeholders)

packages/db/
├── package.json                 # CHANGE — deps (drizzle-orm, postgres), devDeps (drizzle-kit, @types), scripts (db:generate/migrate/seed/studio), exports
├── drizzle.config.ts            # ADD — drizzle-kit config (schema path, out dir, dialect postgres, DATABASE_URL_DIRECT)
├── drizzle/                      # ADD — generated migrations (committed)
│   ├── 0000_<name>.sql           # ADD — first migration (CREATE EXTENSION vector + problems table)
│   └── meta/                     # ADD — drizzle journal + snapshot
└── src/
    ├── schema.ts                 # ADD — problems table (pgTable) + inferred types
    ├── client.ts                 # ADD — postgres-js client factory ({ prepare: false }) + drizzle()
    ├── migrate.ts                # ADD — migration runner (uses DATABASE_URL_DIRECT, max:1)
    ├── seed.ts                   # ADD — idempotent upsert of the Stripe problem
    ├── queries.ts                # ADD — getFirstProblem() (throws if none)
    └── index.ts                  # CHANGE — barrel: export schema, client factory, getFirstProblem, types

packages/shared/
└── src/
    ├── categories.ts            # ADD — CATEGORY_LABELS const map (key→label)
    └── index.ts                 # CHANGE — re-export categories

apps/web/
├── package.json                 # CHANGE — add @bristle/db (workspace:*), @bristle/shared (workspace:*)
├── next.config.ts               # CHANGE — transpilePackages: ["@bristle/ui","@bristle/db","@bristle/shared"]
└── src/app/
    ├── page.tsx                 # CHANGE — Server Component: getFirstProblem() → map → <ProblemCardFull>
    └── theme-showcase.tsx       # DELETE — throwaway client toggle removed
```

> `next.config.ts` `transpilePackages` must add `@bristle/db` and `@bristle/shared` (same reason as `@bristle/ui` in Slice 1.3 — they ship `.ts` source). `packages/db` is **server-only**; it must never be imported into a client component.

**Structure Decision**: `packages/db` owns all persistence (schema, client, migrate, seed, queries); `packages/shared` owns cross-cutting pure constants (the category label map — used by `apps/web` now, any future consumer later); `apps/web` consumes both. The DB driver/secrets never reach the client bundle (page is a Server Component; `@bristle/db` is imported only server-side).

---

## 1. Full Drizzle schema (`packages/db/src/schema.ts`)

pgvector needs a custom Drizzle type (drizzle-orm's `vector` exists in `pg-core` for recent versions; if the pinned version's `vector` is unavailable, a `customType` fallback is used — see Risk R3).

**Proposed shape (illustrative):**

```ts
import { sql } from "drizzle-orm";
import { pgTable, uuid, text, integer, timestamp, vector } from "drizzle-orm/pg-core";

export const problems = pgTable("problems", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),              // stable URL-safe key; upsert target; Tier 2 /problems/[slug]
  title: text("title").notNull(),                     // no uniqueness constraint
  category: text("category").notNull(),               // category KEY (payments, ai-ml, …)
  momentumPct: integer("momentum_pct").notNull(),     // signed; may be negative
  sparkline: integer("sparkline").array().notNull(),  // integer[]; 14 by convention (not DB-enforced)
  topQuote: text("top_quote").notNull(),
  quoteSource: text("quote_source").notNull(),        // gh|hn|so|ph|ap|gp
  sources: text("sources").array().notNull(),         // text[]
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  embedding: vector("embedding", { dimensions: 1536 }), // nullable; unpopulated this slice
});

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
```

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `slug` | `text` | NOT NULL, **UNIQUE** |
| `title` | `text` | NOT NULL |
| `category` | `text` | NOT NULL (key) |
| `momentum_pct` | `integer` | NOT NULL (signed) |
| `sparkline` | `integer[]` | NOT NULL |
| `top_quote` | `text` | NOT NULL |
| `quote_source` | `text` | NOT NULL |
| `sources` | `text[]` | NOT NULL |
| `last_seen_at` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `embedding` | `vector(1536)` | NULL |

**Stable identity for upsert** (FR-007): a **unique `slug`** column so the seed can `onConflictDoUpdate({ target: problems.slug })`. (Decision D4 revised — `slug` over `title` or a magic UUID: a stable, URL-safe value that aligns with the Tier 2 `/problems/[slug]` route.) The Stripe seed's slug is `stripe-webhooks-vercel-cold-starts`. `title` stays a plain `text` column with no uniqueness.

## 2. pgvector extension enablement (migration)

drizzle-kit generates the `CREATE TABLE` but **not** the extension. The first migration must enable pgvector *before* the table (the `vector(1536)` column type requires it). Approach (Decision D2/D3):
- After `db:generate`, **prepend** `CREATE EXTENSION IF NOT EXISTS vector;` to the generated `0000_*.sql` (drizzle applies statements in file order; `--> statement-breakpoint` separates them).
- **Prepend a one-line comment** at the very top of the file: `-- hand-edited after db:generate: prepended CREATE EXTENSION IF NOT EXISTS vector (see plan §2). Expected drift for db:generate --check.` So future `db:generate --check` drift is recognized as intentional.
- Idempotent (`IF NOT EXISTS`); supported on Supabase (the `vector` extension is allowlisted).
- Verified by SC-009 (column exists, nullable) and re-run no-op (SC-004).

## 3. `drizzle.config.ts` (`packages/db/`)

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT! }, // migrations use the DIRECT/session URL
  strict: true,
  verbose: true,
});
```

- `db:generate` reads `schema.ts`, writes SQL + meta to `./drizzle` (no DB connection needed).
- `db:studio` and any drizzle-kit DB operation use `DATABASE_URL_DIRECT` (session mode), never the pooler.

## 4. postgres-js client factory (`packages/db/src/client.ts`)

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");      // explicit, per edge case
  const client = postgres(url, { prepare: false });          // pooler: prepared statements OFF
  _db = drizzle(client, { schema });
  return _db;
}
```

- **`{ prepare: false }`** is mandatory (FR-003) — the Transaction pooler does not support prepared statements; with it on, queries fail.
- Memoized module-singleton so Next.js server invocations reuse one pool. `postgres()` default pool is fine for serverless; `max` may be tuned later.
- Throws if `DATABASE_URL` missing (no silent broken render).

## 5. Migration runner (`packages/db/src/migrate.ts`) — connection separation

```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL_DIRECT;
if (!url) throw new Error("DATABASE_URL_DIRECT is not set");
const sql = postgres(url, { max: 1 });                       // session mode; single connection for the migrator
await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
await sql.end();
```

- **Migrations use `DATABASE_URL_DIRECT`** (session mode, port 5432) — the migrator needs advisory locks + prepared statements the pooler lacks (resolved Q1). `max: 1` per migrator guidance.
- **Runtime queries use `DATABASE_URL`** (pooler) via `getDb()`. The two never mix.

## 6. `package.json` scripts (`packages/db/`)

```jsonc
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "tsx src/migrate.ts",
    "db:seed":     "tsx src/seed.ts",
    "db:studio":   "drizzle-kit studio",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "drizzle-orm": "0.45.2", "postgres": "3.4.9" },
  "devDependencies": { "drizzle-kit": "0.31.10", "tsx": "<latest>", "dotenv": "<latest>", "@types/node": "20.x", "typescript": "5.8.3" }
}
```

- `tsx` runs the TS `migrate.ts`/`seed.ts` scripts directly (Decision D6 — `tsx` vs compiling). `dotenv` loads `.env.local` for local runs.
- These are package-level scripts; optionally surfaced at the root via Turborepo later (not required for this slice — run via `pnpm --filter @bristle/db db:migrate`).

## 7. Seed script + idempotency (`packages/db/src/seed.ts`)

```ts
// upsert on the unique slug → re-running is a no-op / update, never a duplicate
await db.insert(problems).values(STRIPE_SEED)
  .onConflictDoUpdate({ target: problems.slug, set: { ...STRIPE_SEED } });
```

- **Idempotency mechanism**: `INSERT … ON CONFLICT (slug) DO UPDATE` against the `problems_slug_unique` constraint (FR-007). First run inserts; subsequent runs update-in-place (no duplicate).
- **Seed values** mirror the Slice 1.3 fixture exactly: `slug` `stripe-webhooks-vercel-cold-starts`, `title` "Stripe webhooks fail silently on Vercel cold starts", `category` `payments`, `momentumPct` 312, `sparkline` `[4,5,5,6,7,6,8,9,8,11,12,14,16,19]`, `topQuote` "Retries were dropped during cold starts and we lost reconciled revenue for two days before noticing.", `quoteSource` `gh`, `sources` `["gh","hn","so"]`, `lastSeenAt` a **fixed** recent timestamp, `embedding` left null (FR-008).
- Connects via `getDb()` (pooler) — seeding is normal DML, fine through the pooler.

## 8. Category key→label map (`packages/shared/src/categories.ts`)

```ts
export const CATEGORY_LABELS = {
  payments: "Payments", devtools: "Devtools", "ai-ml": "AI / ML",
  "auth-sso": "Auth & SSO", deployment: "Deployment", analytics: "Analytics",
  mobile: "Mobile", email: "Email",
} as const;

export type CategoryKey = keyof typeof CATEGORY_LABELS;
```

- One source of truth for labels (resolved Q4), used by the page mapping and any future consumer. `CategoryKey` aligns with `ProblemCardFull`'s `CategoryColor` union (same 8 keys) — kept in sync (Risk R4).

## 9. `apps/web/src/app/page.tsx` rewrite

```tsx
import { getFirstProblem } from "@bristle/db";
import { CATEGORY_LABELS, type CategoryKey } from "@bristle/shared";
import { ProblemCardFull } from "@bristle/ui";

export default async function Home() {
  const p = await getFirstProblem();           // throws if no row (Q5)
  const key = p.category as CategoryKey;
  return (
    <main className="mx-auto max-w-3xl px-grid py-section">
      <ProblemCardFull
        title={p.title}
        category={CATEGORY_LABELS[key]}
        categoryColor={key}
        momentum={p.momentumPct}
        sparkline={p.sparkline}
        topQuote={p.topQuote}
        quoteSource={p.quoteSource as SourceKey}
        sources={p.sources as SourceKey[]}
        lastSeenIso={p.lastSeenAt.toISOString()}
      />
    </main>
  );
}
```

- **Server Component**, `async` — `await getFirstProblem()` at request time. No `"use client"` anywhere in the page tree (`theme-showcase.tsx` deleted, FR-010/FR-011).
- Row→props mapping (FR-012): `momentumPct`→`momentum`, `lastSeenAt`→`lastSeenIso` (ISO string), `category` key→`categoryColor` + `CATEGORY_LABELS[key]`→`category` label. Narrowing casts on `quote_source`/`sources` text→`SourceKey` (DB stores text; the union is enforced by the seed). (Decision D7 — cast vs runtime validation; cast this slice, the seed is the only writer.)
- Single card, centered (`max-w-3xl`); the two-card grid + toggle are gone.
- `dynamic`/caching: the page reads at request time; default dynamic rendering is fine. (Decision D8 — no explicit `revalidate` this slice; it renders fresh per request.)

## Env var loading strategy (local + Vercel)

| Var | Purpose | Local | Vercel (Preview + Prod) |
|---|---|---|---|
| `DATABASE_URL` | Runtime queries — Transaction pooler (6543), `prepare:false` | `.env.local` (loaded by Next for `apps/web`; by `dotenv` for db scripts) | Dashboard env (both envs) |
| `DATABASE_URL_DIRECT` | Migrations only — session mode (5432) | `.env.local` (loaded by `dotenv` in `drizzle.config.ts`/`migrate.ts`) | Dashboard env (used only when running migrate against prod) |
| `SUPABASE_URL` | Documented-only (forward compat) | `.env.local` | Dashboard env |
| `SUPABASE_PUBLISHABLE_KEY` | Documented-only (forward compat) | `.env.local` | Dashboard env |

- **Local**: `.env.local` at repo root (gitignored). Next.js auto-loads it for `apps/web`; the db package's `tsx` scripts load it via `import "dotenv/config"`. The user already maintains `.env.local.preview` (seen in the IDE) for preview values.
- **Vercel**: set via dashboard for both environments (user-owned, FR-016). `apps/web` reads `DATABASE_URL` at runtime; `DATABASE_URL_DIRECT` is only needed where migrations run (locally or a deploy step) — not by the running web app.
- `.env.example` documents all four with placeholders (FR-014); never real values (FR-015).

## Per-package work breakdown

**`packages/db`** (new persistence surface):
1. `package.json` — drizzle-orm + postgres deps, drizzle-kit + tsx + dotenv devDeps, the four `db:*` scripts.
2. `schema.ts` — `problems` table + unique(slug) + inferred `Problem`/`NewProblem` types.
3. `drizzle.config.ts` — points at `DATABASE_URL_DIRECT`.
4. `db:generate` → `drizzle/0000_*.sql` (+ meta); manually prepend `CREATE EXTENSION IF NOT EXISTS vector;`.
5. `client.ts` — `postgres-js` factory `{ prepare:false }`, memoized, throws on missing URL.
6. `migrate.ts` — runner on `DATABASE_URL_DIRECT` (`max:1`).
7. `queries.ts` — `getFirstProblem()` (throws on null).
8. `seed.ts` — idempotent upsert on `title`.
9. `index.ts` — barrel: schema, `getDb`, `getFirstProblem`, `Problem` types.
10. `tsconfig.json` — likely fine as-is (server TS, no JSX); add Node types if needed.

**`packages/shared`**:
1. `categories.ts` — `CATEGORY_LABELS` + `CategoryKey`.
2. `index.ts` — re-export.

**`apps/web`**:
1. `package.json` — add `@bristle/db`, `@bristle/shared` workspace deps.
2. `next.config.ts` — extend `transpilePackages`.
3. `page.tsx` — server fetch + map + render.
4. delete `theme-showcase.tsx`.

**Root**:
1. `.env.example` — four documented vars.
2. `pnpm install` — lockfile (drizzle-orm, postgres, drizzle-kit, tsx, dotenv).

## Order of operations

1. **`.env.example`** + confirm `.gitignore` covers `.env*` (already does). *(env scaffolding; no secrets)*
2. **`packages/shared`** category map (no deps; used by page).
3. **`packages/db` manifest + deps** (`package.json`, scripts) → `pnpm install`.
4. **`schema.ts`** + unique(slug).
5. **`drizzle.config.ts`** → **`db:generate`** → commit `drizzle/0000_*.sql` + prepend `CREATE EXTENSION vector`.
6. **`client.ts`** + **`migrate.ts`** + **`queries.ts`** + **`index.ts`** barrel.
7. **`db:migrate`** against `DATABASE_URL_DIRECT` (fresh DB) → verify table + nullable vector column (SC-004, SC-009); re-run no-op.
8. **`seed.ts`** → **`db:seed`** locally → verify one row, embedding null; re-run idempotent (SC-005, SC-009).
9. **`apps/web`** wiring (`transpilePackages`, deps), **`page.tsx`** rewrite, **delete `theme-showcase.tsx`**.
10. **Local verify**: `pnpm typecheck`/`lint`/`build`; `localhost:3000` renders the Stripe card from DB matching 1.3 (SC-006, SC-007, SC-010).
11. **Production**: set Vercel env (user); migrate + seed prod DB; push branch → preview renders from prod DB (SC-008); confirm `.env*` absent from `git ls-files` (SC-011).

Critical path: 1→2→3→4→5→6→7→8→9→10→11. Steps 2 and 4–5 are independent of each other until the page (9) needs both.

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Runtime queries fail because `prepare:false` omitted (pooler) | Med | High | Factory hardcodes `{ prepare: false }`; documented in client.ts; smoke-tested by the page render. |
| R2 | Migrations run against the pooler (no advisory locks / prepared stmts) and hang/fail | Med | High | `migrate.ts` + `drizzle.config.ts` use `DATABASE_URL_DIRECT` only; runtime uses `DATABASE_URL`; never crossed. |
| R3 | Pinned `drizzle-orm` lacks a `vector` column helper / dimension support | Med | Med | Prefer `pg-core` `vector({dimensions})`; if unavailable, `customType<{data:number[]}>` mapping to `vector(1536)`; migration still emits the right SQL. |
| R4 | `category` key drift between DB text, `CATEGORY_LABELS`, and `ProblemCardFull` `CategoryColor` | Med | Med | `CategoryKey = keyof typeof CATEGORY_LABELS`; keep the 8 keys aligned with the card union; seed uses a valid key; cast is narrow. |
| R5 | `CREATE EXTENSION vector` not applied (column creation fails on fresh DB) | Med | High | Prepend `CREATE EXTENSION IF NOT EXISTS vector;` as the first statement in `0000_*.sql`; verify on a fresh DB (SC-004/SC-009). |
| R6 | `@bristle/db` (server-only, secrets) imported into a client component → leaks driver to bundle / build error | Low | High | Page is a Server Component; `@bristle/db` imported only server-side; `transpilePackages` includes it; never referenced from a `"use client"` file. |
| R7 | A real env file committed (secret leak) | Low | High | `.gitignore` covers `.env*` except `.env.example`; SC-011 asserts `git ls-files` clean; existing pre-commit hook backstops. |
| R8 | `last_seen_at` fixed seed → "1h ago" text drifts from 1.3 over time | High | Low | Accepted (spec Assumption); "identical" judged modulo relative time; seed timestamp set near-now at seed time. |
| R9 | Connection pool exhaustion on serverless (new pool per invocation) | Low | Med | Memoized singleton `getDb()`; pooler handles connection multiplexing; revisit `max` if needed. |
| R10 | `db:studio`/drizzle-kit accidentally pointed at the pooler | Low | Low | `drizzle.config.ts` uses `DATABASE_URL_DIRECT` exclusively. |

## Complexity Tracking

No constitution violations — section intentionally empty.
