# Implementation Plan: Landing Page

**Branch**: `005-landing-page` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-landing-page/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Snippets are illustrative shapes for review.

## Summary

Replace the slice-004 single-card homepage with the full public landing page (`design/Public_pages.pdf` p.1) — seven server-rendered sections, a hero bound to a slug-pinned canonical card and a sample row of three new `ProblemCardCompact` cards, both read at request time. Add two query helpers (`getProblemBySlug`, `getRecentProblems({limit,excludeSlug})`), expand the seed 1→4 rows, add six soft-404 stub routes, a hand-authored OG image + canonical `SITE_URL`, and the SEO/Open Graph metadata. Editorial Light only; additive to the tokens and the canonical card.

## Technical Context

**Language/Version**: TypeScript 5.8.x strict, React 19.1.0, Next.js 15.5.18 (App Router), Node 20.
**Primary Dependencies**: `@bristle/ui` (ProblemCardFull, SourceIcon, Sparkline), `@bristle/db` (postgres-js + Drizzle), `@bristle/shared` (CATEGORY_LABELS; new SITE_URL), Tailwind v4, `next/font/google`. No new runtime deps.
**Storage**: existing Supabase `problems` table — **no schema change**; seed grows to 4 rows.
**Testing**: gates only (typecheck/lint/build/Lighthouse/visual-diff/responsive). No Vitest/Playwright added this slice (see §12).
**Target Platform**: Web (Vercel preview + production).
**Performance Goals (binding, §5)**: Lighthouse ≥90 Performance/Accessibility/Best-Practices/SEO; initial JS < 180 KB gz; mobile LCP < 2.5s.
**Constraints**: Server Components by default; Tailwind tokens only — zero hex literals, zero hardcoded font-family strings; no `localStorage`; WCAG 2.2 AA; voice §6 (no exclamation/emoji/hype); additive only (no edits to ProblemCardFull or tokens, §9).
**Scale/Scope**: 1 page rewrite, 7 section components, 1 compact card, 2 query helpers, 1 seed expansion, 6 stub routes, 1 OG image, 1 shared constant. ~20 changed/added files.

## Constitution Check

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | Next 15 App Router, Tailwind v4, Drizzle/postgres-js, lucide (none new here), `next/font`. No new deps; `shadcn/ui` not required this slice (see Risk R5). |
| §4 / §4.1a Tokens exact | PASS | All color/type/spacing/radius via tokens incl. `category/mobile/*` for the new mobile row; zero hex, zero font-family literals (SC-019). |
| §5 Conventions + floors | PASS | Server Components default; kebab-case files / PascalCase components; Tailwind only; no storage; Zod N/A (newsletter disabled, no submit); perf/a11y floors are explicit SCs. |
| §6 Voice | PASS | Landing + seed copy plain-spoken, no exclamation/emoji/hype (SC-020). |
| §8 Repo structure | PASS | Section components under `apps/web/src/components/landing/`; compact card in `packages/ui`; SITE_URL in `packages/shared`. |
| §9 Never-do | PASS | No `design/` or PDF/doc edits; spec→plan→tasks→implement order; building exactly this slice; **ProblemCardFull and tokens untouched (additive)**; no browser storage. |
| §10 Ambiguity | PASS | All 5 clarifications resolved in the spec. |

**Result**: PASS. No violations; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)
```text
specs/005-landing-page/
├── spec.md            # done (clarified)
├── plan.md            # this file
├── research.md        # Phase 0 — the 13 decisions
├── data-model.md      # Phase 1 — compact-card contract, query signatures, the 4 seed rows
├── quickstart.md      # Phase 1 — build/seed/verify recipe + SC mapping
├── contracts/
│   └── ui-and-db.md   # ProblemCardCompact + @bristle/db query contracts
└── tasks.md           # Phase 2 — NOT created here
```

### Source Code (exact file tree of changes/additions)
```text
packages/shared/src/
├── site.ts                         # ADD — export const SITE_URL = "https://bristle.vercel.app"
└── index.ts                        # CHANGE — re-export SITE_URL

packages/db/src/
├── queries.ts                      # CHANGE — add getProblemBySlug, getRecentProblems (keep getFirstProblem)
├── seed.ts                         # CHANGE — 1→4 rows (Stripe verbatim + devtools, ai-ml, mobile)
└── index.ts                        # CHANGE — export the two new helpers

packages/ui/src/
├── problem-card-compact.tsx        # ADD — ProblemCardCompact (server component)
└── index.ts                        # CHANGE — export ProblemCardCompact + ProblemCardCompactProps

packages/ui/package.json            # CHANGE — add "./problem-card-compact" subpath export

apps/web/
├── public/og-image.png             # ADD — 1200×630 raster (wordmark + headline on surface/canvas)
└── src/
    ├── app/
    │   ├── page.tsx                # CHANGE — landing entry: force-dynamic + parallel reads + compose sections
    │   ├── pricing/page.tsx        # ADD — <ComingSoon version="0.2.2" /> + robots:noindex
    │   ├── about/page.tsx          # ADD — "0.2.3"
    │   ├── blog/page.tsx           # ADD — "0.2.4"
    │   ├── changelog/page.tsx      # ADD — "0.2.5"
    │   ├── login/page.tsx          # ADD — "0.3.X (Tier 3)"
    │   └── signup/page.tsx         # ADD — "0.3.X (Tier 3)"
    └── components/
        ├── coming-soon.tsx         # ADD — shared stub component
        └── landing/
            ├── top-nav.tsx         # ADD
            ├── hero.tsx            # ADD (receives the pinned Problem as a prop)
            ├── source-strip.tsx    # ADD
            ├── how-it-works.tsx    # ADD
            ├── sample-reports.tsx  # ADD (receives Problem[] as a prop)
            ├── pricing-teaser.tsx  # ADD
            └── site-footer.tsx     # ADD
```

**Structure Decision**: section components live in `apps/web/src/components/landing/` (app-local, not shared) since they're page-specific; the reusable `ProblemCardCompact` lives in `packages/ui` (consumed again by the Tier-4 dashboard); `SITE_URL` is cross-cutting → `packages/shared`. No tokens or ProblemCardFull touched.

---

## The 13 required decisions

### 1. Page composition — **thin server entry composing one component per section**
`page.tsx` is a thin async Server Component that runs the data reads and renders `<TopNav/> <Hero problem={hero}/> <SourceStrip/> <HowItWorks/> <SampleReports problems={recent}/> <PricingTeaser/> <SiteFooter/>`, each in its own file under `components/landing/`. **Rationale**: a single 7-section inline file would be ~600 lines and hard to review/diff per-section; discrete components map 1:1 to the spec's sections and the 4px-per-section gate, and read better. Trade-off: more files, but each is small and independently verifiable.

### 2. Server vs Client boundary — **zero Client Components**
All seven sections and the compact card are Server Components. Nothing needs interactivity this slice: the newsletter input/button are **disabled** (no handler), there is no theme toggle (deferred), no mobile menu (nav is static links; if a hamburger is needed at narrow widths it is a CSS-only `<details>`/checkbox-free disclosure — but the plan's mobile nav is a simple wrap/stack, no JS). **Decision: no `"use client"` anywhere in the landing tree.** This keeps the initial JS minimal (helps SC-016/SC-017) and satisfies §5.

### 3. Data fetching — **two parallel awaits in `page.tsx`, props passed down; `force-dynamic` on the page**
```tsx
export const dynamic = "force-dynamic";          // carried from slice 004; lives in page.tsx
export default async function Home() {
  const [hero, recent] = await Promise.all([
    getProblemBySlug("stripe-webhooks-vercel-cold-starts"),
    getRecentProblems({ limit: 3, excludeSlug: "stripe-webhooks-vercel-cold-starts" }),
  ]);
  return (<> <TopNav/> <Hero problem={hero}/> … <SampleReports problems={recent}/> … </>);
}
```
**Rationale**: one place owns the dynamic-render decision and the DB round-trips; `Promise.all` runs the two reads concurrently (one pooled connection, two queries); sections stay pure/presentational and trivially testable. Per-section fetching would scatter `force-dynamic` semantics and risk waterfalls. `force-dynamic` is required (the DB read isn't a cacheable `fetch`; without it `next build` would prerender and hit the DB) — same lesson as slice 004.

### 4. `ProblemCardCompact` — contract, location, layout (CORRECTED)
Re-examination of the PDF sample row shows the compact cards are **denser versions** of the canonical card that **keep** a tighter quote and a small inline sparkline — the subtraction runs the other way.
- **File**: `packages/ui/src/problem-card-compact.tsx`; exported from the barrel and as `@bristle/ui/problem-card-compact`. Server Component, no `"use client"`, **zero hex** (token utilities + `currentColor`).
- **Props** (nearly the full canonical contract + optional `href`; sparkline and quote ARE included):
  ```ts
  export interface ProblemCardCompactProps {
    title: string;
    category: string;          // human label
    categoryColor: CategoryColor;
    momentum: number;          // signed delta (number + arrow)
    sparkline: number[];       // KEPT — rendered as a small inline element (top-right)
    topQuote: string;          // KEPT — tighter italic quote, leading avatar
    quoteSource: SourceKey;    // the quote's leading source avatar
    sources: SourceKey[];
    lastSeenIso: string;
    href?: string;             // optional wrapping link (e.g. /problems/{slug})
  }
  ```
- **Layout** (denser than canonical): `rounded-card border border-border-default bg-surface-card p-grid` (16px < 24px). **Header row**: category pill (`category/<key>/*` tint) left + a **small inline `Sparkline`** (top-right, `accent/bristle`, no separate "14-day mentions" row). **Title**: `font-serif text-h4 text-text-primary` (smaller than the full card's `text-h3`), 2-line clamp. **Quote**: a tighter italic `font-serif text-body-sm text-text-secondary` quote with a leading `SourceIcon` avatar (fewer lines than canonical — clamp to ~2 lines). **Footer**: source-avatar cluster (`SourceIcon` chips) + signed momentum delta (number `text-text-secondary` + ↑ `accent/validated` / ↓ `status/error`) + relative `lastSeenIso`.
- **Subtractions from canonical** (the correct distinction): drop the separate large-sparkline / "14-day mentions" row (sparkline collapses to the small inline top-right element), drop the bottom "{n} quotes · {n} sources · last {window}" meta line, drop the "Open report →" link, and tighten padding to 16px. **The quote and the sparkline stay.** (No "source-count summary line" — that earlier idea is dropped.)

### 5. Seed expansion — fully determined 4 rows
Row 1 (unchanged, verbatim): `stripe-webhooks-vercel-cold-starts` / payments / momentum 312 / existing sparkline / `lastSeenAt 2026-05-22T00:00:00Z` / embedding null. Three new rows (voice §6, categories matching the PDF sample pills, all `lastSeenAt` within 30 days of 2026-05-22, embedding null):

| field | ai-ml row | mobile row | devtools row |
|---|---|---|---|
| `slug` | `llm-streaming-cdn-buffering` | `expo-ota-ios-18-4` | `pgvector-index-degradation-2m` |
| `title` | "LLM streaming chokes through CDN buffering" | "Expo OTA updates silently fail on iOS 18.4" | "pgvector indexes degrade past 2M rows" |
| `category` | `ai-ml` | `mobile` | `devtools` |
| `momentumPct` | `184` | `96` | `72` |
| `topQuote` | "Cloudflare buffers SSE despite explicit headers. Three weeks to find this." | "Users on 18.4 stuck on last build. No error, no telemetry, no acknowledgment." | "Hybrid search query went from 80ms to 4.2s once we crossed 2M embeddings." |
| `quoteSource` | `hn` | `gh` | `gh` |
| `sources` | `["hn","so","gh"]` | `["gh","ap","so"]` | `["gh","hn","so"]` |
| `sparkline` | `[6,7,7,8,9,8,10,11,12,13,15,17,19,22]` | `[3,4,4,5,5,6,6,7,8,8,9,10,12,14]` | `[5,6,6,7,8,7,9,9,10,11,12,12,13,15]` |
| `lastSeenAt` | `2026-05-21T22:00:00Z` | `2026-05-21T20:00:00Z` | `2026-05-21T18:00:00Z` |

Idempotent upsert on `slug` (existing `onConflictDoUpdate`); a second run leaves exactly four rows. The `mobile` row exercises the `category/mobile/*` tokens added in §4.1a.

### 6. `getRecentProblems` signature + query shape — **object-arg**
```ts
export async function getRecentProblems(
  opts: { limit: number; excludeSlug?: string },
): Promise<Problem[]> {
  const { limit, excludeSlug } = opts;
  const where = excludeSlug ? ne(problems.slug, excludeSlug) : undefined;
  return getDb().select().from(problems)
    .where(where)                       // omitted when excludeSlug absent
    .orderBy(desc(problems.lastSeenAt))
    .limit(limit);
}
```
**Object-arg** (not positional) so `excludeSlug` is optional and self-documenting at call sites, and future filters (category, etc.) extend without breaking callers. Returns `Problem[]` (same row type as `getFirstProblem`/`getProblemBySlug`); empty array on empty DB, never throws. `getProblemBySlug(slug)` mirrors `getFirstProblem` semantics (`eq(problems.slug, slug)`, `limit(1)`, **throws** if absent).

### 7. Placeholder pages — **one shared `<ComingSoon version/>` used by six tiny page files**
`apps/web/src/components/coming-soon.tsx` renders the centered token-styled stub; six 5-line `page.tsx` files each render `<ComingSoon version="…" />` and export `metadata = { robots: { index: false, follow: false } }`. **Rationale**: DRY — one styled component, six trivial wrappers; per-route `version` prop + per-route metadata. `robots: noindex` via the **metadata export** (per-route, App Router native), not a global `robots.txt` (which can't selectively noindex these while keeping `/` indexable). Trade-off vs six fully-duplicated pages: a shared component is one place to restyle when the real pages land.

### 8. SourceIcon scaling — **className-based sizing, no slice-003 edit**
`SourceIcon` already accepts `className` and renders `<svg width="1em" height="1em">`, so size follows font-size/size utilities. The source strip wraps each mark in a sized element (e.g. `text-[…]` token size or `size-6`) — **decision: pass a size utility via `className`** (`<SourceIcon source=… className="size-6 text-text-secondary" />`). No edit to the slice-003 component (honors §9 additive-only). The strip shows the six **wordmarks** per the PDF: each is the `SourceIcon` glyph + the source's text label (from a label map alongside `SOURCE_LABELS`), not a logo image.

### 9. OG image + `SITE_URL`
- **Asset**: `apps/web/public/og-image.png`, **1200×630**, content = Bristle wordmark + the headline "Find real problems worth solving." on the `surface/canvas` (#FAFAF7) background, composed within brand tokens. The plan does not include the design work; it specifies the required content and dimensions for the implementor to author the raster (PNG, not SVG).
- **Constant**: `packages/shared/src/site.ts` → `export const SITE_URL = "https://bristle.vercel.app" as const;` re-exported from the package index.
- **Metadata**: `page.tsx`'s `metadata` consumes `SITE_URL` → `metadataBase: new URL(SITE_URL)`, `openGraph.url: SITE_URL + "/"`, `openGraph.images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }]`, plus `type: "website"`, `title`, `description`. Absolute URLs on the canonical origin so preview deploys still surface the production asset on social shares (FR-024).

### 10. Responsive layout (PDF is desktop-only; spec the mobile reflow per section)
Existing Tailwind breakpoints (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280). Page max-width container `max-w-6xl mx-auto px-grid`.
- **Top nav**: links row collapses below `md` — wordmark left, "Start free →" right; the middle links + "Sign in" wrap to a second row (no JS menu).
- **Hero**: `grid md:grid-cols-2 gap-section` → **stacks** below `md` (copy first, card below); card max-width capped so it doesn't overflow at 320.
- **Source strip**: `flex` row at `md+` (caption left, wordmarks right); below `md` → caption **above**, wordmarks `flex-wrap` into rows.
- **How-it-works**: `grid md:grid-cols-3 gap-grid` → single column below `md`.
- **Sample reports**: `grid sm:grid-cols-2 lg:grid-cols-3 gap-grid` → 1-up mobile, 2-up tablet, 3-up desktop.
- **Pricing teaser**: dark band `grid md:grid-cols-2` (headline left, price rows right) → **stacks** below `md`; price rows are a single column always.
- **Footer**: brand+newsletter block over the link columns at mobile; `md:grid-cols-[brand 4 columns]` at desktop.
- Verified at 320/375/768/1024/1280/1440 (SC-002): no horizontal scroll (`overflow-x` clipped containers, no fixed widths), no overlap, no clipped text.

### 11. Performance / SEO budget (how the floors are met)
- **Fonts**: reuse the existing three `next/font/google` faces from layout (self-hosted, `display:swap`) — no new font calls, no external font requests.
- **Images**: the only raster is the OG image, which is **metadata only** (never rendered on-page) → no `next/image` needed; all on-page visuals are inline SVG (`SourceIcon`, `Sparkline`) + text. **No `next/image` use this slice** (nothing to optimize on-page). OG image is **not** preloaded (it's not an on-page LCP element).
- **JS budget**: zero Client Components → only Next's framework runtime ships; no charting lib, no analytics. Expected First-Load JS ≈ slice-003/004 baseline (~100–110 KB), well under 180 KB gz (SC-016).
- **LCP**: the hero serif headline (text) is the LCP candidate — server-rendered, font `display:swap`, no blocking image → < 2.5s mobile (SC-017).
- **SEO**: title + meta description + canonical + full OG set; semantic landmarks (`<header><main><footer>`, one `<h1>` = hero headline, section `<h2>`s); the stubs are `noindex` but `/` is indexable. **No analytics/telemetry on `/`** this slice (PostHog/Sentry deferred to later tiers, §3 "loaded deferred").
- **A11y**: labeled disabled newsletter input (`<label>` + the "launching soon" text via `aria-describedby`), `aria-label` on icon-only controls, visible focus rings (2px `accent/bristle`), AA contrast from tokens, heading order h1→h2 (carry the slice-003 lesson — no skips).

### 12. Test surface
**No automated test files this slice.** Vitest/Playwright are not yet wired into the repo; standing up Playwright is its own future slice. Verification is the gate phase: typecheck/lint/build (SC-014), Lighthouse on the local prod build (SC-015/016/017), responsive sweep (SC-002), seed idempotency (SC-008), route checks (SC-010), and the **visual-diff vs `Public_pages.pdf` p.1** which is **acceptance-criteria (human/screenshot review at the gate), not an automated test** (confirmed). A Playwright visual-regression harness is explicitly deferred.

### 13. Risks & unknowns
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | 4px visual fidelity to the PDF across 7 sections | High | Med | Map every dimension to tokens; screenshot-compare per section at the design viewport during the gate; iterate spacing within the octave scale. |
| R2 | `force-dynamic` omitted → `next build` prerenders `/` and hits the DB at build (slice-004 failure mode) | Med | High | `export const dynamic = "force-dynamic"` in `page.tsx`; verified by a clean prod build. |
| R3 | Local dev needs DB env (the `apps/web/.env.local` symlink from slice 004); intermittent sandbox DNS to Supabase | Med | Med | Symlink already exists; reads are request-time; preview/prod use injected Vercel env (unaffected by local DNS). |
| R4 | Compact-card density (inline sparkline size, quote line-clamp) drifts from the PDF sample cards | Med | Low | Match the PDF at the visual gate; inline sparkline small (top-right), quote clamped to ~2 lines; it's app-local and easily tuned within tokens. |
| R5 | A section needs a shadcn primitive not yet added (e.g. button) | Low | Low | Landing buttons/links are plain token-styled `<a>`/`<button>`; **no shadcn primitive required this slice**; if one is wanted later it's additive. |
| R6 | Hidden hex/font-family literal slips into landing source (SC-019) | Med | Med | Grep gate for `#[0-9a-f]{3,8}` and `font-family`/font-name strings across the landing files before commit. |
| R7 | Vercel monorepo output path / Root Directory (slice-001 lesson) | Low | High | Unchanged from working config (Root Directory = `apps/web`, transpilePackages incl. `@bristle/db`,`@bristle/shared`,`@bristle/ui`); landing adds no new build wiring. |
| R8 | Drizzle migration churn | None | — | **No schema change**; only seed data + query helpers. `db:generate` not run; no new migration. |
| R9 | `og:image` 404 on a fresh deploy before the asset is committed | Low | Med | Commit `public/og-image.png` with the metadata; verify the absolute URL resolves on the preview at the gate (SC-013). |

## Order of operations
1. `packages/shared`: `site.ts` (SITE_URL) + index re-export. *(no deps)*
2. `packages/db`: `getProblemBySlug` + `getRecentProblems` in `queries.ts`, export from index. *(needed by page)*
3. `packages/db`: expand `seed.ts` to 4 rows; run `db:seed`; verify exactly 4 (SC-008/009).
4. `packages/ui`: `ProblemCardCompact` + barrel/subpath export. *(needed by sample row)*
5. `apps/web/public/og-image.png` (authored raster).
6. `apps/web`: `ComingSoon` component + six stub routes (robots:noindex). *(independent)*
7. `apps/web`: seven `components/landing/*` section components.
8. `apps/web`: `page.tsx` rewrite (force-dynamic, parallel reads, compose) + `metadata` (SITE_URL/OG).
9. Gate: typecheck/lint/build; seed idempotency; route 200+noindex; responsive sweep; Lighthouse (prod build); hex/font grep; visual-diff; deploy-preview parity.

Critical path: 1→2→(3 ∥ 4)→7→8→9; 5 and 6 are independent and parallelizable.

## Complexity Tracking
No constitution violations — section intentionally empty.
