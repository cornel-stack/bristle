# Data Model: Supabase + Drizzle + One Persisted Problem

## `problems` table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | server-generated |
| `slug` | `text` | NOT NULL, **UNIQUE** | stable URL-safe key; upsert target; Tier 2 `/problems/[slug]` |
| `title` | `text` | NOT NULL | no uniqueness constraint |
| `category` | `text` | NOT NULL | category key (payments, devtools, ai-ml, auth-sso, deployment, analytics, mobile, email) |
| `momentum_pct` | `integer` | NOT NULL | signed; may be negative |
| `sparkline` | `integer[]` | NOT NULL | 14 elements by convention (not DB-enforced) |
| `top_quote` | `text` | NOT NULL | representative quote |
| `quote_source` | `text` | NOT NULL | gh \| hn \| so \| ph \| ap \| gp |
| `sources` | `text[]` | NOT NULL | platform keys → footer badges |
| `last_seen_at` | `timestamptz` | NOT NULL | rendered relative |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | row creation |
| `embedding` | `vector(1536)` | NULL | reserved; unpopulated this slice |

Requires extension: `vector` (`CREATE EXTENSION IF NOT EXISTS vector;` prepended to migration `0000`).

Inferred types: `Problem = typeof problems.$inferSelect`, `NewProblem = typeof problems.$inferInsert`.

## Row → `ProblemCardFull` props mapping

| DB column | Prop | Transform |
|---|---|---|
| `title` | `title` | — |
| `category` (key) | `categoryColor` | cast text→`CategoryColor` (8-key union) |
| `category` (key) | `category` (label) | `CATEGORY_LABELS[key]` from `@bristle/shared` |
| `momentum_pct` | `momentum` | — |
| `sparkline` | `sparkline` | — |
| `top_quote` | `topQuote` | — |
| `quote_source` | `quoteSource` | cast text→`SourceKey` |
| `sources` | `sources` | cast text[]→`SourceKey[]` |
| `last_seen_at` | `lastSeenIso` | `Date.toISOString()` |

## Seed row (canonical "Stripe webhooks") — mirrors Slice 1.3 fixture

| Field | Value |
|---|---|
| `slug` | `stripe-webhooks-vercel-cold-starts` |
| `title` | "Stripe webhooks fail silently on Vercel cold starts" |
| `category` | `payments` |
| `momentum_pct` | `312` |
| `sparkline` | `[4,5,5,6,7,6,8,9,8,11,12,14,16,19]` |
| `top_quote` | "Retries were dropped during cold starts and we lost reconciled revenue for two days before noticing." |
| `quote_source` | `gh` |
| `sources` | `["gh","hn","so"]` |
| `last_seen_at` | fixed recent timestamp (set at seed authoring) |
| `embedding` | `null` |

Idempotency: `INSERT … ON CONFLICT (slug) DO UPDATE SET …`.

## `CATEGORY_LABELS` (packages/shared)

`payments`→"Payments", `devtools`→"Devtools", `ai-ml`→"AI / ML", `auth-sso`→"Auth & SSO", `deployment`→"Deployment", `analytics`→"Analytics", `mobile`→"Mobile", `email`→"Email". `CategoryKey = keyof typeof CATEGORY_LABELS` (same 8 keys as `ProblemCardFull`'s `CategoryColor`).
