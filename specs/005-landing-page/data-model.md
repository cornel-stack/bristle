# Data Model: Landing Page

No schema change. The `problems` table is unchanged (slice 004). This slice adds query helpers, expands the seed to four rows, and defines the compact-card contract.

## Query helpers (`packages/db/src/queries.ts`)

| Helper | Signature | Behavior |
|---|---|---|
| `getFirstProblem` | `(): Promise<Problem>` | unchanged; throws if none |
| `getProblemBySlug` | `(slug: string): Promise<Problem>` | `eq(slug)`, `limit(1)`; **throws** if absent (same semantics as getFirstProblem) |
| `getRecentProblems` | `({ limit, excludeSlug? }): Promise<Problem[]>` | `where ne(slug, excludeSlug)` when provided; `orderBy desc(lastSeenAt)`; `limit`; empty array on empty DB; never throws |

All return the existing `Problem` row type (`typeof problems.$inferSelect`).

## ProblemCardCompact contract (`packages/ui/src/problem-card-compact.tsx`)

```ts
export interface ProblemCardCompactProps {
  title: string;
  category: string;          // human label (via CATEGORY_LABELS)
  categoryColor: CategoryColor;
  momentum: number;          // signed; delta number + arrow
  sparkline: number[];       // KEPT — small inline element (top-right)
  topQuote: string;          // KEPT — tighter italic quote
  quoteSource: SourceKey;    // leading avatar on the quote
  sources: SourceKey[];
  lastSeenIso: string;
  href?: string;             // optional wrapping link
}
```
- Server component, no `"use client"`, zero hex literals.
- Layout: `rounded-card border border-border-default bg-surface-card p-grid` (16px). Header: category pill (left) + small inline `Sparkline` (top-right, `accent/bristle`). Title: `font-serif text-h4`, 2-line clamp. Quote: tighter italic `font-serif text-body-sm text-text-secondary` + leading `SourceIcon` avatar (~2-line clamp). Footer: `SourceIcon` source cluster + momentum delta (↑ `accent/validated` / ↓ `status/error`) + relative `lastSeenIso`.
- **Keeps** quote + small inline sparkline; **drops** the canonical's separate large-sparkline/"14-day mentions" row, the bottom meta line, and "Open report →"; padding < 24px (SC-006).

## Seed rows (`packages/db/src/seed.ts`) — exactly four after run

| field | payments (hero, unchanged) | ai-ml | mobile | devtools |
|---|---|---|---|---|
| `slug` | `stripe-webhooks-vercel-cold-starts` | `llm-streaming-cdn-buffering` | `expo-ota-ios-18-4` | `pgvector-index-degradation-2m` |
| `title` | Stripe webhooks fail silently on Vercel cold starts | LLM streaming chokes through CDN buffering | Expo OTA updates silently fail on iOS 18.4 | pgvector indexes degrade past 2M rows |
| `category` | payments | ai-ml | mobile | devtools |
| `momentumPct` | 312 | 184 | 96 | 72 |
| `topQuote` | (unchanged) | Cloudflare buffers SSE despite explicit headers. Three weeks to find this. | Users on 18.4 stuck on last build. No error, no telemetry, no acknowledgment. | Hybrid search query went from 80ms to 4.2s once we crossed 2M embeddings. |
| `quoteSource` | gh | hn | gh | gh |
| `sources` | ["gh","hn","so"] | ["hn","so","gh"] | ["gh","ap","so"] | ["gh","hn","so"] |
| `sparkline` | (unchanged) | [6,7,7,8,9,8,10,11,12,13,15,17,19,22] | [3,4,4,5,5,6,6,7,8,8,9,10,12,14] | [5,6,6,7,8,7,9,9,10,11,12,12,13,15] |
| `lastSeenAt` | 2026-05-22T00:00:00Z | 2026-05-21T22:00:00Z | 2026-05-21T20:00:00Z | 2026-05-21T18:00:00Z |
| `embedding` | null | null | null | null |

- Idempotent upsert on `slug`; re-run leaves exactly four.
- Categories match the PDF sample pills (AI/ML, Mobile, Devtools); `mobile` exercises `category/mobile/*` tokens.
- Voice §6: plain, evidence-style, no exclamation/emoji.

## Recent-row → ProblemCardCompact mapping (sample row)
`getRecentProblems({ limit: 3, excludeSlug: 'stripe-webhooks-vercel-cold-starts' })` → 3 rows (ai-ml, devtools, mobile by lastSeenAt desc) → each mapped: `momentumPct→momentum`, `category` key → `categoryColor` + `CATEGORY_LABELS[key]` label, `lastSeenAt.toISOString()→lastSeenIso`, `sources` cast to `SourceKey[]`, `href = /problems/{slug}` (known out-of-scope 404 until 2.6).

## Shared constant (`packages/shared/src/site.ts`)
`export const SITE_URL = "https://bristle.vercel.app" as const;` — source of `metadataBase`, `og:url` (`SITE_URL + "/"`), and `og:image` (`SITE_URL + "/og-image.png"`).
