# Research: Landing Page

Phase 0 decisions (the 13 the user required). Format: Decision / Rationale / Alternatives.

## D1 — Composition: thin server entry + per-section components
- **Decision**: `page.tsx` composes seven Server Components under `apps/web/src/components/landing/`.
- **Rationale**: maps 1:1 to the spec's sections + the per-section 4px gate; small reviewable diffs vs a ~600-line monolith.
- **Alternatives**: single inline `page.tsx` — rejected (unreviewable, hard to gate per section).

## D2 — Zero Client Components
- **Decision**: no `"use client"` in the landing tree.
- **Rationale**: nothing interactive (newsletter disabled, no toggle/menu); keeps initial JS minimal (SC-016/017).
- **Alternatives**: client newsletter/menu — rejected (out of scope / not needed).

## D3 — Two parallel awaits in `page.tsx`, props down; `force-dynamic` on the page
- **Decision**: `Promise.all([getProblemBySlug, getRecentProblems])` in `page.tsx`; `export const dynamic = "force-dynamic"` there; sections are pure props consumers.
- **Rationale**: one owner of the dynamic decision + concurrent reads; presentational sections are testable. `force-dynamic` avoids build-time prerender hitting the DB (slice-004 lesson).
- **Alternatives**: per-section fetch — rejected (scattered dynamic semantics, waterfall risk).

## D4 — ProblemCardCompact: denser canonical card; KEEPS quote + inline sparkline (CORRECTED)
- **Decision**: new sibling file; props = title/category/categoryColor/momentum/**sparkline**/**topQuote**/**quoteSource**/sources/lastSeenIso/href?. Layout keeps a small inline sparkline (top-right) and a tighter italic quote with leading avatar; drops the canonical's separate large-sparkline row, bottom meta line, and "Open report →" link; padding 16px.
- **Rationale**: re-examination of the PDF sample row shows the compact cards keep both the quote and a small sparkline — the subtraction runs the other way (remove the big-sparkline row + meta line + open-report link, tighten). The earlier "{n} sources · {relative}" summary line is **dropped**.
- **Alternatives**: subset without quote/sparkline + summary line (rejected — wrong reading of the design).

## D5 — Seed: 4 fully-determined rows
- **Decision**: Stripe (verbatim) + ai-ml `llm-streaming-cdn-buffering` + mobile `expo-ota-ios-18-4` + devtools `pgvector-index-degradation-2m`; values fixed in plan §5; idempotent upsert on slug.
- **Rationale**: matches the PDF sample pills; mobile exercises `category/mobile/*`; deterministic seed before tasks.
- **Alternatives**: 3 rows (rejected — forces hero/sample duplicate, resolved in spec clarify).

## D6 — getRecentProblems object-arg
- **Decision**: `getRecentProblems({ limit, excludeSlug? })`; `where ne(slug, excludeSlug)` when provided, `orderBy desc(lastSeenAt)`, `limit`; returns `Problem[]`, empty on empty DB. `getProblemBySlug(slug)` throws like `getFirstProblem`.
- **Rationale**: optional/self-documenting; future filters extend without breaking callers; return type matches existing helpers.
- **Alternatives**: positional `(limit, excludeSlug?)` — rejected (less clear, awkward to extend).

## D7 — Six stub routes via one shared ComingSoon
- **Decision**: `components/coming-soon.tsx` + six 5-line `page.tsx` wrappers, each `metadata.robots = { index:false, follow:false }`.
- **Rationale**: DRY styled stub; per-route `version` + per-route noindex via App Router metadata (not robots.txt, which can't selectively noindex while keeping `/` indexable).
- **Alternatives**: six duplicated pages (rejected — restyle in six places).

## D8 — SourceIcon scales via className; no slice-003 edit
- **Decision**: pass a size utility through the existing `className` prop (`<svg width/height="1em">` already scales with font-size).
- **Rationale**: additive-only (§9); no change to a shipped slice-003 component.
- **Alternatives**: add a `size` prop to SourceIcon — rejected (unnecessary edit to shipped code).

## D9 — OG image static raster + SITE_URL constant
- **Decision**: `apps/web/public/og-image.png` (1200×630, wordmark + headline on `surface/canvas`); `SITE_URL = "https://bristle.vercel.app"` in `packages/shared/src/site.ts`; `metadataBase`/`og:url`/`og:image` derive from it (absolute).
- **Rationale**: stable production asset on social shares even from preview deploys; one source of truth for the origin.
- **Alternatives**: dynamic OG generation (rejected — user chose hand-authored); relative og:image (rejected — breaks on preview origins).

## D10 — Responsive reflow specced per section (plan §10)
- **Decision**: hero/pricing stack below `md`; source strip caption-above + wrap; how-it-works/sample collapse to 1-up; nav links wrap.
- **Rationale**: PDF is desktop-only; the six target widths (SC-002) need explicit reflow using existing breakpoints.

## D11 — Perf/SEO: no client JS, no on-page raster, no analytics
- **Decision**: reuse existing `next/font`; OG image is metadata-only (no `next/image`); zero client components; no PostHog/Sentry on `/` this slice; LCP = server-rendered serif headline.
- **Rationale**: meets ≥90 all-four + <180 KB gz + <2.5s LCP by shipping almost no JS and no blocking image.

## D12 — No automated tests this slice; visual-diff is acceptance-criteria
- **Decision**: gates only (typecheck/lint/build/Lighthouse/responsive/seed/route/grep + human visual-diff). Playwright deferred.
- **Rationale**: test harness isn't wired yet; standing it up is its own slice.

## D13 — Risks: see plan §13 (no schema change → no migration; no shadcn primitive needed; Vercel wiring unchanged)
