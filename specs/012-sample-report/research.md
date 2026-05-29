# Phase 0 — Research

Slice 012 research is consolidated in [`plan.md`](./plan.md) (the 15 numbered decisions). This file is a pointer + a short delta on what was investigated **before** the spec was authored vs **during** plan iteration.

## Pre-spec research (resolved into spec Assumptions)

The kick-off message listed 14 open questions. Codebase reads at spec-time resolved all 14 into the spec's Assumptions section:

| Source read | Finding |
|---|---|
| `packages/db/src/seed.ts` | Canonical slugs for the slice-004 seed: `stripe-webhooks-vercel-cold-starts` (NOT `-fail-silently-`); title `"Stripe webhooks fail silently on Vercel cold starts"` (no trailing period); 4 records in the seed, 3 of which are the link-flip targets (LLM streaming / Expo OTA / pgvector). |
| `apps/web/src/components/landing/sample-reports.tsx:28` | The 3 SampleReports `ProblemCardCompact` items already point at `href={`/problems/${problem.slug}`}` — the link flip happens at slice-012 ship with zero edits to this file. |
| `apps/web/src/components/landing/hero.tsx:37-47` | The Hero renders `ProblemCardFull` WITHOUT an `href` prop. The full Stripe page is therefore a direct-URL surface only (Hero card is not a link). Wiring the hero card to the detail page deferred to a future slice. |
| `packages/ui/src/problem-card-full.tsx` | Confirmed: zero `href`/`Link` imports. |
| `apps/web/src/components/blog/inline-pull-quote.tsx` | The slice-010 InlinePullQuote takes `{quote: {text, attribution?}}` and renders `<figure>` + `<blockquote>` accent bar + italic serif + optional `<cite>`. Slice 012's `ProblemPullQuote` ships as a page-local near-duplicate to preserve slice-integrity (no `packages/` touches). |

After the 4th-stub addition (`webhook-ordering-on-retries`, resolving Assumption #8 RelatedProblemsCard list size), zero open questions remain in the spec.

## Plan-time research (resolved into the 15 plan decisions)

See `plan.md` §1-§15. Each numbered decision documents:
- **Decision**: the pinned choice (e.g. discriminated-union SampleProblem; hand-rolled SVG donut/frequency; single client island; chrome above TopNav)
- **Confirmations**: what was already settled in the spec
- **Alternatives considered**: what was evaluated and why it was rejected

Two palette-choice questions remain surfaced for reviewer call:
- **Donut palette** (decision §7) — Option A (recommended) / B / C
- **Blur magnitude** (decision §9) — `blur-sm` (recommended) / `blur-md` / `blur`

Both are token-clean and reversible single-class edits if changed post-PR.
