# Implementation Plan: Sample Report Detail Page

**Branch**: `012-sample-report` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-sample-report/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Snippets are illustrative shapes for review.

## Summary

Ship the Tier-2 build-plan slice **2.6a — Sample report detail page**. One new dynamic route lands at `/problems/[slug]`, statically prerendered as 5 routes via `generateStaticParams`: one **full** sample problem (`stripe-webhooks-vercel-cold-starts`) matching `design/Public_pages.pdf` page 7 verbatim, and four **stubs** (`webhook-ordering-on-retries`, `llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`) that render a minimal hero + "Full problem report forthcoming." caption. Three of the four stub slugs (`llm-streaming`, `expo-ota`, `pgvector`) match the slice-004 DB seed in `packages/db/src/seed.ts` verbatim — those slugs are already the `href` targets on the slice-005 `SampleReports` landing cards and **flip from known-out-of-scope soft-404 to live the moment slice 012 ships** (zero edits to `apps/web/src/components/landing/sample-reports.tsx`, parallel to slices 009/010/011's footer + nav link flips). The fourth stub (`webhook-ordering-on-retries`) is slice-012-local — backs the topically-coherent first item of the Stripe page's `RelatedProblemsCard`. The Stripe full page remains a **direct-URL surface only** because the slice-005 landing `Hero` renders the problem via `ProblemCardFull` which does not accept an `href` (asymmetry documented as a tracked follow-up). The page introduces **one architectural first for the project**: a `SampleBanner` chrome element rendered **above** `TopNav` (the first time any chrome sits outside the standard `TopNav-Main-SiteFooter` shell — slices 005-011 always rooted the page with `TopNav`). One client component ships: `FrequencyChart` (owns the `7d / 30d / 90d / All` time-range toggle). Two hand-rolled SVG visualizations ship: `DonutChart` (4 segments, polar-to-cartesian, ~0.65 inner/outer radius ratio) and `FrequencyChart`'s line chart (re-renders on toggle from 4 pre-bundled windowed datasets). **Zero new top-level dependencies** (no `recharts`, no `chart.js`, no `d3`; both visualizations are hand-rolled SVG matching the slice-011 `ChangelogFigure` token-utility pattern). The slice-010 `InlinePullQuote` pattern is duplicated as a page-local `ProblemPullQuote` to preserve slice-integrity discipline (no `packages/ui/` touches); the cross-page consolidation becomes a new tracked follow-up, joined to the **highest-priority refactor item**: the four-mirror `SectionScrollSpyRail` extraction (FAQ/Legal/Blog/Changelog) carried from slice 011 — slice 012 does NOT add a fifth mirror (its right rail is a simple sticky column without scroll-spy), but the carry-forward stays.

## Technical Context

**Language/Version**: TypeScript 5.8.x strict, React 19.1.0, Next.js 15.5.18 (App Router), Node 20.

**Primary Dependencies**: existing — `@bristle/shared` (`SITE_URL` consumed by per-problem Metadata + `og:url`), Tailwind v4, `next/font/google` (Inter + Source Serif Pro + JetBrains Mono already loaded by slice 005's root layout — no per-slice font import), `lucide-react@1.16.0` (existing; potentially consumed for the Save / Share button glyphs, the source-badge glyphs, and the breadcrumb separator chevron if any — flagged for plan-time confirmation). The slice-010 `InlinePullQuote` and `BlogPostBody` (the `stubBody`-branching reference) are referenced **only as structural precedent** — not imported, not modified. **No new runtime dependency.** Both SVG visualizations (`DonutChart`, `FrequencyChart`) are hand-rolled inline SVG.

**Storage**: N/A — all content is content-static via `SAMPLE_PROBLEMS` in `apps/web/src/components/problem/sample-problems.ts`. No schema change, no new query helper, **no `@bristle/db` touch this slice** (the three landing-flip stub slugs match the slice-004 seed verbatim, but slice 012 does NOT read from the DB — the page imports the local data store at build time; the slug parity is a content-discipline convention, not a runtime dependency).

**Testing**: gates only (typecheck/lint/build, greps, route 200 + meta-tag curl for all 5 routes, bundle budgets, frequency-chart toggle walk, donut-chart segment count + aria-label check, blurred-quote visual treatment check, link-flip regression on slice-005 `SampleReports` landing cards, responsive sweep at 320/375/768/1024/1280/1440, visual diff vs `design/Public_pages.pdf` page 7 at 1280 width). No Vitest/Playwright wired (same as slices 005 / 006 / 007 / 008 / 009 / 010 / 011).

**Target Platform**: Web (Vercel preview + production).

**Performance Goals (binding, CLAUDE.md §5)**: Lighthouse ≥ 90 Performance / Accessibility / Best Practices / SEO on `/problems/stripe-webhooks-vercel-cold-starts` on local prod (SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact and not a regression); First-Load JS < 180 KB gz on all 5 `/problems/[slug]` routes. Expected: ~110-115 KB on the full Stripe route, ~108-112 KB on the 4 stub routes (slice-005 baseline ~106 KB + `FrequencyChart` ~2-4 KB compiled + 4 pre-bundled windowed datasets totaling well under 1 KB). The stub routes are slightly lighter because the `FrequencyChart` client component is conditionally rendered only on the full route.

**Constraints**: zero hex literals, zero font-family literals in any new file; voice CLAUDE.md §6 (no `!`, no emoji, no "amazing/awesome") on all visible prose; no `localStorage`; WCAG 2.2 AA — semantic headings (h1 in `ProblemHero`, h2 per section), `<blockquote>` + `<cite>` for evidence quotes, `<nav aria-label="Breadcrumb">` on the breadcrumb, donut + frequency SVGs as `role="img"` + `aria-label` + per-segment `<title>` on donut, time-range toggle Pattern A (`role="group"` + `aria-pressed`), blurred evidence cards `aria-hidden` on quote text + descriptive card-level `aria-label`, visible 2px `accent/bristle` + 4px outer focus ring. Only `frequency-chart.tsx` carries `"use client"` — all other new components are Server Components or server-only modules. Save / Share buttons render as `<button type="button">` with no `onClick`, no state, no persistence (preserves the single-client-island discipline).

**Scale/Scope**: 1 new dynamic route (5 prerendered slugs); **20 new files**: 1 type module + 1 data store + 2 pure math helpers + 15 components (14 server + 1 client) + 1 route file. **0 existing-on-main files modified.** Comparable scope to slice 010 (~16 files) but with one more hand-rolled SVG visualization (donut) and a new architectural precedent (chrome above `TopNav`). Total commit-producing tasks: ~17-19 (estimated; finalized in `/speckit.tasks`).

## Constitution Check

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | No new dependency. Hand-rolled SVG `<path>`, `<line>`, `<text>`, `<title>` for both visualizations — platform primitives. `useState` + (optionally) `useEffect` in `FrequencyChart` — React core, already loaded. No `recharts`, no `chart.js`, no `d3`, no `framer-motion`. The two hand-rolled visualizations are the right primitive for fixed 4-segment / 4-windowed-dataset content (no need for a charting library's interaction layer; no need for animated tweening — reduced-motion-respecting instant re-render is the design intent). |
| §4 Tokens exact | PASS | All color/type/spacing/radii/motion via tokens. `SampleBanner` orange strip = `bg-accent-bristle text-surface-card` (verified slice-009 `TocRail` mobile-pill active-state recipe; `text-on-accent` token does NOT exist). `ProblemMomentumChip` "▲ +312% / 14d" pill = `bg-accent-bristle text-surface-card rounded-pill px-2 py-0.5 text-body-sm font-medium` mirrors `ChangelogBadge` "feature" recipe. `DonutChart` segments: largest = `fill-accent-bristle` (GitHub 26 — brand highlight); remaining three = monochrome tint hierarchy via `fill-text-primary` / `fill-text-secondary` / `fill-text-tertiary` (HN 13 / SO 3 / Other 5 — see decision §7 for the palette-choice flag). `FrequencyChart` line = `stroke-accent-bristle stroke-2`, dots = `fill-accent-bristle`, axis labels = `text-body-sm text-text-secondary font-mono`, grid lines (if any) = `stroke-border-default opacity-30`. Evidence blur = Tailwind `blur-sm` utility (4px default; decision §9). Sticky right rail = `md:sticky md:top-grid` matching the slice-010 `BlogRailToc` pattern. **Zero hex literals (SC-016), zero font-family literals (SC-016)** in any new file. |
| §5 Conventions + floors | PASS | Server Components default; client surface = **one** named file (`frequency-chart.tsx`) — back to slice-009 cardinality. Kebab-case files / PascalCase components; Tailwind only; no `localStorage`; voice rules applied to all visible prose; perf/a11y floors explicit (SC-014, SC-015); WCAG 2.2 AA via semantic headings + `aria-pressed` + `aria-label` on SVGs + `<blockquote>`/`<cite>` semantics + focus rings; reduced-motion respected in `FrequencyChart`'s any motion handler. |
| §6 Voice | PASS | All visible prose authored to voice. `SampleBanner`: `You're viewing a free sample — see the full library of 142k+ problems.` (declarative, em-dash continuation, no exclamation). `ProblemHero` meta literal `47 mentions in the last 14 days, up from 12` rendered as `47 quotes · 6 sources · First seen Feb 8` (compressed, factual). `EvidenceCTA`: `Sign up to see all 47 quotes` (declarative; the `47` is the load-bearing fact) + subline `Free, no credit card · See 6 existing solutions and 4 willingness-to-pay mentions` (interpunct-separated; matches slice-005 hero subline cadence). Stub caption: `Full problem report forthcoming.` (terminal period; mirrors slice-010 `BlogPostBody` stub-branch literal). Save / Share buttons render with no glyph-only ambiguity; visible label text accompanies any icon glyph. Voice grep clean on rendered output (SC-016). |
| §8 Repo structure | PASS | Page-local components under `apps/web/src/components/problem/` (new directory; mirrors slices 005-011 directory-per-route pattern). Pure helpers (`donut-math.ts`, `frequency-math.ts`), data (`sample-problems.ts`), and types (`types.ts`) colocated. Route file at `apps/web/src/app/problems/[slug]/page.tsx` (the first dynamic `[slug]` route after slice-010 `/blog/[slug]`). No `lib/` change, no `packages/` change. |
| §9 Never-do | PASS | No edits to `design/`, no edits to PDFs/docs; spec→plan→tasks→implement honored; building exactly the spec; **all slice-005 + 006 + 008 + 009 + 010 + 011 files untouched** (the link-flip on the three slice-005 `SampleReports` landing cards is a runtime href-resolution change, not a file edit — the `href={`/problems/${problem.slug}`}` expression on slice-005 `sample-reports.tsx:28` already targets this slice's routes). **No `packages/` modifications** (the `ProblemPullQuote` is intentionally duplicated page-local rather than extracted to `packages/ui/` to preserve slice-integrity — see decision §5). No `localStorage`; no new dependencies. |
| §10 Ambiguity | PASS | All 14 open questions raised at kick-off resolved via codebase research before spec authoring (slice-004 seed read; slice-005 `sample-reports.tsx` and `hero.tsx` and `ProblemCardFull` read; slice-010 `inline-pull-quote.tsx` read); spec carries the resolutions as Assumptions; the 4th-stub addition (`webhook-ordering-on-retries`) resolves the last open question (Assumption #8 RelatedProblemsCard list size). No NEEDS CLARIFICATION markers remain. |

**Result**: PASS. Zero new top-level dependencies, zero edits to shipped slices, one architectural first (chrome above `TopNav`) flagged in decision §8 for review. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/012-sample-report/
├── spec.md              # done (revised to 5 routes / 4 stubs after Assumption #8 resolution)
├── plan.md              # this file
├── research.md          # Phase 0 — pointer to the 15 decisions in this plan
├── contracts/
│   └── ui-and-data.md   # Phase 1 — SampleProblem type contract + per-component prop signatures + route metadata shape
├── quickstart.md        # Phase 1 — gate recipe + SC mapping (includes link-flip regression command + donut/frequency-chart inspection commands)
├── checklists/
│   └── requirements.md  # passing
└── tasks.md             # Phase 2 — NOT created here
```

No `data-model.md` (per the slice-011 / 010 precedent — no schema change, no new DB shape; content shapes documented inline in `contracts/ui-and-data.md` + decision §3 below).

### Source Code (exact file tree of additions)

```text
apps/web/src/
├── app/
│   └── problems/
│       └── [slug]/
│           └── page.tsx                          # ADD — dynamic Server Component; generateStaticParams + generateMetadata + notFound
└── components/
    └── problem/                                  # NEW DIRECTORY
        ├── types.ts                              # ADD — SampleProblem + SampleProblemSourceRow + SampleProblemEvidenceQuote + SampleProblemRelatedItem + SampleProblemFrequencyData + SampleProblemMomentum + SampleProblemFigureBreadcrumb shapes; stubBody discriminator
        ├── sample-problems.ts                    # ADD — SAMPLE_PROBLEMS: ReadonlyArray<SampleProblem>; 5 entries (1 full + 4 stubs), [PLACEHOLDER] header
        ├── donut-math.ts                         # ADD — polarToCartesian + describeArc + buildDonutSegments helpers (pure)
        ├── frequency-math.ts                     # ADD — Y-axis scaling + X-tick positioning + SVG polyline path builder (pure)
        ├── sample-banner.tsx                     # ADD — server component (orange strip above TopNav with /signup CTA)
        ├── problem-breadcrumb.tsx                # ADD — server component (<nav aria-label="Breadcrumb"> with literal " / " separators)
        ├── problem-momentum-chip.tsx             # ADD — server component (▲ +312% / 14d pill, tokens-only)
        ├── problem-source-badge.tsx              # ADD — server component (circular per-source glyph; renders source initial or tiny SVG)
        ├── problem-hero.tsx                      # ADD — server component (serif h1 + meta row 1 + meta row 2 with Save/Share)
        ├── problem-pull-quote.tsx                # ADD — server component (page-local near-duplicate of slice-010 InlinePullQuote)
        ├── problem-body.tsx                      # ADD — server component (lead + ProblemPullQuote + body; branches on stubBody)
        ├── donut-chart.tsx                       # ADD — server component (hand-rolled SVG, 4 segments via donut-math, role="img" + per-segment <title>)
        ├── sources-card.tsx                      # ADD — server component (eyebrow "SOURCES · 47 QUOTES" + DonutChart + breakdown list)
        ├── related-problems-card.tsx             # ADD — server component (4-item list; links to /problems/{slug})
        ├── frequency-chart.tsx                   # ADD — CLIENT COMPONENT ("use client"); useState<"7d"|"30d"|"90d"|"all">("90d"); SVG line chart re-renders on toggle
        ├── evidence-quote.tsx                    # ADD — server component (<blockquote> + <cite>; blurred prop → Tailwind blur-sm on quote text)
        ├── evidence-cta.tsx                      # ADD — server component (gated sign-up callout; links to /signup)
        ├── evidence-list.tsx                     # ADD — server component (5 visible + 2 blurred EvidenceQuote + 1 EvidenceCTA = 8 elements)
        └── problem-layout.tsx                    # ADD — server component (composes the whole page; branches on stubBody for full-vs-stub treatment)
```

**Zero modifications to existing-on-main files**. The slice-005 `SampleReports` landing cards already point at `/problems/${problem.slug}` (verified via `sample-reports.tsx:28`); their three landing-flip destinations resolve to slice-012 stub pages with no source-code change to `sample-reports.tsx`.

```
$ grep -n 'problems/' apps/web/src/components/landing/sample-reports.tsx
apps/web/src/components/landing/sample-reports.tsx:28:              href={`/problems/${problem.slug}`}
```

**Structure Decision**: page-local section components under `apps/web/src/components/problem/` follow the slice-005/006/008/009/010/011 precedent. The route file at `apps/web/src/app/problems/[slug]/page.tsx` follows the slice-010 `/blog/[slug]` dynamic-route precedent. The 5 prerendered slugs are enumerated at build time via `generateStaticParams` reading from `SAMPLE_PROBLEMS` — same primitive as slice 010.

---

## The 15 required decisions

### 1. Composition — **confirmed: page = async Server Component composing ProblemLayout; ProblemLayout branches on stubBody**

**`/problems/[slug]` route**:

```tsx
// apps/web/src/app/problems/[slug]/page.tsx (sketch — async Server Component)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { SAMPLE_PROBLEMS } from "@/components/problem/sample-problems";
import { ProblemLayout } from "@/components/problem/problem-layout";

export async function generateStaticParams() {
  return SAMPLE_PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return {};
  /* see decision §10 for the full metadata shape */
  return { /* ... */ };
}

export default async function ProblemDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) notFound();
  return <ProblemLayout problem={problem} />;
}
```

`ProblemLayout` is a Server Component that owns the full-vs-stub branching + the page composition (SampleBanner + TopNav + main + SiteFooter) — keeping `/problems/[slug]/page.tsx` thin (~20 lines) and centralizing the layout shape in one place.

```tsx
// apps/web/src/components/problem/problem-layout.tsx (sketch — server)
import { TopNav } from "@/components/landing/top-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { SampleBanner } from "./sample-banner";
import { ProblemBreadcrumb } from "./problem-breadcrumb";
import { ProblemHero } from "./problem-hero";
import { ProblemBody } from "./problem-body";
import { SourcesCard } from "./sources-card";
import { RelatedProblemsCard } from "./related-problems-card";
import { FrequencyChart } from "./frequency-chart";
import { EvidenceList } from "./evidence-list";
import type { SampleProblem } from "./types";

export function ProblemLayout({ problem }: { problem: SampleProblem }) {
  return (
    <>
      <SampleBanner />
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid">
        <ProblemBreadcrumb breadcrumb={problem.breadcrumb} />
        <ProblemHero problem={problem} />
        {problem.stubBody ? (
          <p className="my-section text-body-md text-text-secondary">
            Full problem report forthcoming.
          </p>
        ) : (
          <>
            <section className="grid gap-grid py-section md:grid-cols-3">
              <div className="md:col-span-2"><ProblemBody problem={problem} /></div>
              <aside className="md:sticky md:top-grid md:flex md:flex-col md:gap-grid">
                <SourcesCard problem={problem} />
                <RelatedProblemsCard items={problem.relatedProblems} />
              </aside>
            </section>
            <section className="py-section"><FrequencyChart data={problem.frequencyData} /></section>
            <section className="py-section"><EvidenceList quotes={problem.evidenceQuotes} /></section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
```

**Rationale**: keeps the data store as the single source of truth (all 5 routes consume `SAMPLE_PROBLEMS`); maps 1:1 to spec FR-001/002/015/016; the dynamic-route + `generateStaticParams` + `notFound()` shape is the canonical Next.js 15 pattern, matching slice 010's `/blog/[slug]`.

**Alternatives considered**:
- Two separate page-layout files (`problem-layout-full.tsx` + `problem-layout-stub.tsx`) rejected — the branching is small (1 `if` statement), the prop surface is identical, and one file makes the full-vs-stub asymmetry visually obvious to a reader.
- Inline the layout into `/problems/[slug]/page.tsx` rejected — page file becomes 80+ lines; centralizing in `ProblemLayout` matches the slice-010 `BlogPostLayout` precedent.
- Render the stub as a wholly separate route (e.g. `/problems/stub/[slug]/page.tsx`) rejected — splits the data store, doubles the route-file count, and the design intent is "same chrome, less content".

**Files for `/problems/[slug]/page.tsx`**: `next/navigation` (notFound), `next` (Metadata), `@bristle/shared` (SITE_URL), `sample-problems` (data), `problem-layout` (composition wrapper).

### 2. Server vs Client boundary — **confirmed: 1 client file (`frequency-chart.tsx`); 19 other new files are Server / data / type / helper modules**

Only `apps/web/src/components/problem/frequency-chart.tsx` carries `"use client"` (it uses `useState<"7d" | "30d" | "90d" | "all">` for the time-range toggle + may use `useEffect` + `useRef` for the optional mobile-pill-equivalent if needed; reduced-motion is read fresh via `matchMedia` inside any motion handler, no `useState` mirroring).

**Save / Share buttons are presentational** — rendered as `<button type="button">` inside `ProblemHero` with **no `onClick` handler, no client state, no persistence**. They render with visible labels + optional `lucide-react` glyphs and rely on CSS-only hover/focus visual feedback. This preserves the single-client-island discipline — real Save (account-bound library) and Share (URL copy / OG card) are owned by the app/onboarding tier and ship in a future slice.

Every other new file:
- `apps/web/src/app/problems/[slug]/page.tsx` — async Server Component.
- `ProblemLayout`, `SampleBanner`, `ProblemBreadcrumb`, `ProblemMomentumChip`, `ProblemSourceBadge`, `ProblemHero`, `ProblemPullQuote`, `ProblemBody`, `DonutChart`, `SourcesCard`, `RelatedProblemsCard`, `EvidenceQuote`, `EvidenceCTA`, `EvidenceList` — Server Components.
- `types.ts` — pure TS module (types only, no runtime).
- `sample-problems.ts` — pure TS module (a single typed constant; no runtime logic; `[PLACEHOLDER]` header comment on line 1).
- `donut-math.ts` — pure TS module (`polarToCartesian()`, `describeArc()`, `buildDonutSegments()`; no React, no client APIs).
- `frequency-math.ts` — pure TS module (Y-axis scaling, X-tick positioning, SVG polyline path string builder; no React, no client APIs).

**Net: 1 client file, 14 server components, 4 pure TS modules, 1 route file = 20 new files**. Verifiable by `grep -l "use client" apps/web/src/components/problem/ apps/web/src/app/problems/[slug]/page.tsx` returning exactly one file (FR-008 single-client-island discipline; SC-017).

**Rationale**: same posture as slices 006 / 008 / 009 / 011 (1 client each). The page is editorial-density content with one interactive surface (the time-range toggle); everything else renders as zero-JS HTML.

### 3. Type shapes — **confirmed (verbatim) with `ReadonlyArray` discipline and stubBody discriminator**

```ts
// apps/web/src/components/problem/types.ts (sketch)

export type SampleProblemSourceKey =
  | "github"
  | "hackernews"
  | "stackoverflow"
  | "reddit"
  | "producthunt"
  | "appstore"
  | "playstore";

export interface SampleProblemMomentum {
  /** Pre-formatted delta string, e.g. "+312%". Per voice §6 — the number is the load-bearing fact. */
  delta: string;
  windowDays: number;
}

export interface SampleProblemSourceRow {
  /** Display name as it appears in the breakdown list, e.g. "GitHub", "Hacker News", "Stack Overflow", "Other". */
  name: string;
  count: number;
}

export interface SampleProblemEvidenceQuote {
  authorHandle: string;
  source: SampleProblemSourceKey;
  upvotes: number;
  commentCount: number;
  /** Pre-formatted relative or absolute timestamp, e.g. "Mar 12" / "5 days ago". Compile-time string (no runtime Intl). */
  timestamp: string;
  text: string;
  /** When true, the EvidenceQuote applies Tailwind blur-sm to the quote text only. */
  blurred: boolean;
}

export interface SampleProblemRelatedItem {
  slug: string;
  title: string;
  /** Short single-line teaser (~80-120 chars). */
  leadSnippet: string;
}

export type FrequencyWindow = "7d" | "30d" | "90d" | "all";

export interface FrequencyPoint {
  /** ISO yyyy-mm-dd. */
  date: string;
  count: number;
}

export type SampleProblemFrequencyData = Readonly<
  Record<FrequencyWindow, ReadonlyArray<FrequencyPoint>>
>;

export interface SampleProblemPullQuote {
  text: string;
  attribution?: string;
}

/**
 * Tuple of breadcrumb labels rendered as plain text with " / " separators.
 * Typically 3 levels deep: ["Library", "<Section>", "<Subsection>"].
 */
export type SampleProblemBreadcrumb = ReadonlyArray<string>;

/**
 * Discriminated by stubBody:
 *   - stubBody === false ⇒ full-report fields (lead, pullQuote, body, sourcesBreakdown, frequencyData, evidenceQuotes, relatedProblems) ALL required
 *   - stubBody === true  ⇒ none of the full-report fields apply (lead is still required for the hero meta-row description; the rest are absent)
 *
 * Mirrors the slice-010 BlogArticle stubBody-discriminator pattern (BlogPostBody branches on stubBody to render the "Full article forthcoming." caption).
 */
export interface SampleProblemBase {
  slug: string;
  breadcrumb: SampleProblemBreadcrumb;
  title: string;
  momentum: SampleProblemMomentum;
  /** ISO yyyy-mm-dd. */
  firstSeenDate: string;
  /** Pre-formatted display label, e.g. "Feb 8". Compile-time string. */
  firstSeenDisplay: string;
  quoteCount: number;
  sourceCount: number;
  /** Up to 5 source keys rendered as small circular badges in the hero meta row. No overflow indicator (decision §3, spec FR-007). */
  sourceBadges: ReadonlyArray<SampleProblemSourceKey>;
  /** Single-sentence problem teaser. Rendered in the hero meta region; also used as the Metadata description for full problems. */
  lead: string;
}

export interface SampleProblemFull extends SampleProblemBase {
  stubBody: false;
  pullQuote: SampleProblemPullQuote;
  body: string;
  sourcesBreakdown: ReadonlyArray<SampleProblemSourceRow>;
  frequencyData: SampleProblemFrequencyData;
  evidenceQuotes: ReadonlyArray<SampleProblemEvidenceQuote>;
  relatedProblems: ReadonlyArray<SampleProblemRelatedItem>;
}

export interface SampleProblemStub extends SampleProblemBase {
  stubBody: true;
}

/** TypeScript narrows on `if (problem.stubBody) { ... } else { ... }`. */
export type SampleProblem = SampleProblemFull | SampleProblemStub;
```

**Confirmations from the spec**:
- `SampleProblem` is a discriminated union, narrowed via the `stubBody` boolean (mirror of slice-010 `BlogArticle` shape).
- All compile-time display strings (`firstSeenDisplay`, evidence `timestamp`) avoid runtime `Intl` / `Date` formatting (slice-010/011 precedent).
- `SampleProblemFrequencyData` is a `Record<FrequencyWindow, ReadonlyArray<FrequencyPoint>>` — the 4 windowed datasets are keyed at the type level so `FrequencyChart` consumers can't read an unknown window without a compile error.
- `SampleProblemPullQuote` shape matches the slice-010 `BlogPullQuote` `{text, attribution?}` shape verbatim — necessary for the page-local `ProblemPullQuote` to be a true visual-and-prop near-duplicate (decision §5).
- `breadcrumb` is a `ReadonlyArray<string>` (not a fixed tuple length) — future stubs could carry a 2- or 4-level breadcrumb without a type widening.

**Discriminator pattern (not separate branches)**: `SampleProblem = SampleProblemFull | SampleProblemStub` (true discriminated union) instead of a single interface with optional full-report fields. Reason: TypeScript narrowing on `if (problem.stubBody) {...} else {...}` gives the body branches definite-typed access to the full-report fields without `!` non-null assertions. Catches data-store authoring mistakes (e.g. a stub entry accidentally setting `pullQuote`) at compile time.

**Alternatives considered**:
- Single interface with all full-report fields optional + `stubBody: boolean` flag (rejected — every full-report consumer needs `!` non-null assertions; lower compile-time safety).
- Enumerate sources via category-tints (rejected — sources are operational (GitHub/HN/SO/Reddit/PH/AppStore/PlayStore) not editorial categories (payments/devtools/ai-ml/...); semantic mismatch).
- `Date` objects for `firstSeenDate` (rejected — JSON-serializable string is cleaner; ISO yyyy-mm-dd sorts lexicographically if ever needed).

### 4. Data store layout — **confirmed: 5 entries, [PLACEHOLDER] header, ReadonlyArray**

```ts
// apps/web/src/components/problem/sample-problems.ts (sketch — header + structure)

// [PLACEHOLDER — sample problem content awaiting founder review before production launch]
//
// Slugs marked (seed-flip) are link-flip targets for the slice-005 SampleReports landing cards
// — their hrefs already point at /problems/{slug} and flip from soft-404 to live on slice-012 ship.
// The slug marked (related-only) is reached only via the Stripe RelatedProblemsCard.

import type {
  SampleProblem,
  SampleProblemFull,
  SampleProblemStub,
} from "./types";

const STRIPE: SampleProblemFull = {
  slug: "stripe-webhooks-vercel-cold-starts",
  breadcrumb: ["Library", "Devtools", "Payments"],
  title: "Stripe webhooks fail silently on Vercel cold starts",
  momentum: { delta: "+312%", windowDays: 14 },
  firstSeenDate: "2026-02-08",
  firstSeenDisplay: "Feb 8",
  quoteCount: 47,
  sourceCount: 6,
  sourceBadges: ["github", "hackernews", "stackoverflow", "reddit", "producthunt"],
  lead: "Across 47 mentions in the last 60 days, builders describe the same failure mode: a Stripe webhook arrives, the handler runs, the function is killed at the Vercel timeout (9.8s on hobby, 60s on Pro), and Stripe's retry policy compounds the problem into a cascading set of duplicate retries — or, more dangerously, a silent missed event when retries exhaust.",
  pullQuote: {
    text: "The handler ran fine in local. In production we lost $4,200 in failed retries before the dashboard reconciliation caught it.",
    attribution: "",
  },
  body: "The problem is structural: serverless runtimes treat webhook handlers as ordinary HTTP requests, but Stripe's retry policy assumes a stateful long-lived endpoint. Three workarounds dominate the discussion — queue the event immediately and ack within 200ms (recommended by Stripe), use a stateful runtime (Workers, Fly), or move to a dedicated server. None are obvious for a beginner; all three require infrastructure decisions made before the first real customer.",
  sourcesBreakdown: [
    { name: "GitHub", count: 26 },
    { name: "Hacker News", count: 13 },
    { name: "Stack Overflow", count: 3 },
    { name: "Other", count: 5 },
  ],
  frequencyData: {
    "7d":  /* ~7 points, May 4 → May 10, peak values 8-12/day */,
    "30d": /* ~30 points, Apr 11 → May 10, mid-range values 5-12/day */,
    "90d": /* ~90 points, Feb 9 → May 10, full rising trend 1-12/day */,
    "all": /* ~60 points matching the design's "60 DAYS" eyebrow */,
  },
  evidenceQuotes: [
    /* 5 blurred:false + 2 blurred:true = 7 total */
  ],
  relatedProblems: [
    { slug: "webhook-ordering-on-retries",     title: "Webhook ordering on retries",            leadSnippet: "..." },
    { slug: "llm-streaming-cdn-buffering",     title: "LLM streaming chokes through CDN buffering", leadSnippet: "..." },
    { slug: "expo-ota-ios-18-4",               title: "Expo OTA updates silently fail on iOS 18.4", leadSnippet: "..." },
    { slug: "pgvector-index-degradation-2m",   title: "pgvector indexes degrade past 2M rows",     leadSnippet: "..." },
  ],
  stubBody: false,
};

const WEBHOOK_ORDERING: SampleProblemStub = {
  slug: "webhook-ordering-on-retries",   // related-only (NOT in slice-004 seed; reached only via Stripe RelatedProblemsCard)
  breadcrumb: ["Library", "Devtools", "Payments"],
  title: "Webhook ordering on retries",
  momentum: { delta: "+128%", windowDays: 14 },
  firstSeenDate: "2026-03-04",
  firstSeenDisplay: "Mar 4",
  quoteCount: 21,
  sourceCount: 3,
  sourceBadges: ["github", "hackernews", "stackoverflow"],
  lead: "Two webhooks fire in close succession, the retry queue interleaves them, and the second one races the first. We've seen this break idempotency in two distinct ways.",
  stubBody: true,
};

const LLM_STREAMING: SampleProblemStub = {
  slug: "llm-streaming-cdn-buffering",   // seed-flip
  breadcrumb: ["Library", "AI/ML", "Streaming"],
  title: "LLM streaming chokes through CDN buffering",
  momentum: { delta: "+184%", windowDays: 14 },
  firstSeenDate: "2026-02-15",
  firstSeenDisplay: "Feb 15",
  quoteCount: 34,
  sourceCount: 3,
  sourceBadges: ["hackernews", "stackoverflow", "github"],
  lead: "Cloudflare buffers Server-Sent Events despite the explicit headers. Builders spend weeks diagnosing what looks like a backend stall but is actually edge-layer buffering.",
  stubBody: true,
};

const EXPO_OTA: SampleProblemStub = {
  slug: "expo-ota-ios-18-4",             // seed-flip
  breadcrumb: ["Library", "Mobile", "iOS"],
  title: "Expo OTA updates silently fail on iOS 18.4",
  momentum: { delta: "+96%", windowDays: 14 },
  firstSeenDate: "2026-04-02",
  firstSeenDisplay: "Apr 2",
  quoteCount: 19,
  sourceCount: 3,
  sourceBadges: ["github", "appstore", "stackoverflow"],
  lead: "Users on iOS 18.4 sit on the last shipped build. No error, no telemetry, no acknowledgement — and no fix in the Expo changelog yet.",
  stubBody: true,
};

const PGVECTOR: SampleProblemStub = {
  slug: "pgvector-index-degradation-2m", // seed-flip
  breadcrumb: ["Library", "Devtools", "Databases"],
  title: "pgvector indexes degrade past 2M rows",
  momentum: { delta: "+72%", windowDays: 14 },
  firstSeenDate: "2026-03-21",
  firstSeenDisplay: "Mar 21",
  quoteCount: 15,
  sourceCount: 3,
  sourceBadges: ["github", "hackernews", "stackoverflow"],
  lead: "Hybrid-search query latency jumps from 80ms to 4.2s once embedding count crosses 2M. The HNSW index recall degrades and the standard fix recipes don't apply.",
  stubBody: true,
};

export const SAMPLE_PROBLEMS: ReadonlyArray<SampleProblem> = [
  STRIPE,
  WEBHOOK_ORDERING,
  LLM_STREAMING,
  EXPO_OTA,
  PGVECTOR,
];
```

**Confirmations**:
- Exactly **5 entries** (1 full + 4 stubs). The slug list is verbatim: `stripe-webhooks-vercel-cold-starts`, `webhook-ordering-on-retries`, `llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`.
- The 3 seed-flip stubs reuse the slice-004 seed's title verbatim (cross-checked at plan time against `packages/db/src/seed.ts`: titles match exactly; sparkline / lastSeen / sources arrays from the seed are NOT consumed this slice — only title + slug + thematic alignment carry over).
- Header marker is line 1 (above the imports) per FR-020. Gate-time grep verifies its presence (parallel to slice-009/010/011 SC-005-equivalent).
- The 4th stub (`webhook-ordering-on-retries`) carries `breadcrumb: ["Library", "Devtools", "Payments"]` — same column as the Stripe full problem; the related-problems card displays topically-coherent items (the design intent for the first related item).
- All Stripe full-report content strings are placeholder-but-publishable shape (per spec FR-020). Founder reconciles before production launch.
- The 4-windowed `frequencyData` is sketched as a placeholder; decision §6 below pins the actual value-generation approach.
- `relatedProblems` lists 4 items, each pointing to one of the 4 stubs (1:1 mapping, no duplicates per FR-011).

**Voice check on the placeholder lead strings**: all 5 leads are factual, dry, no exclamations, no emoji, no hype. The `webhook-ordering` lead's `"We've seen this break idempotency in two distinct ways."` reads as the dry technical-engineer voice the constitution §6 specifies.

**Alternatives considered**:
- One file per problem (e.g. `apps/web/src/components/problem/data/stripe.ts` + 4 others) (rejected — 5 entries fit comfortably in one file; per-file splitting would mirror the slice-010 `blog-articles.ts` precedent which is a single file with 7 entries — same convention).
- Pull the 3 seed-flip stubs from `@bristle/db` at build time (rejected — couples the slice to the DB during prerender; would defeat the static-prerender contract; slice 012 is content-static).
- Add the `webhook-ordering` slug to the slice-004 seed (rejected — touches `packages/db/` and violates SC-018 slice-integrity; the 4th stub is slice-012-local by design).

### 5. ProblemPullQuote pattern — **confirmed: page-local near-duplicate of slice-010 InlinePullQuote**

```tsx
// apps/web/src/components/problem/problem-pull-quote.tsx (sketch — server component)

import type { SampleProblemPullQuote } from "./types";

export function ProblemPullQuote({ quote }: { quote: SampleProblemPullQuote }) {
  return (
    <figure className="my-loose">
      <blockquote className="border-l-2 border-accent-bristle pl-grid font-serif italic text-h3 text-text-primary">
        {quote.text}
      </blockquote>
      {quote.attribution && (
        <cite className="mt-snug block pl-grid text-body-sm not-italic text-text-secondary">
          {quote.attribution}
        </cite>
      )}
    </figure>
  );
}
```

**Visually and structurally identical** to the slice-010 `InlinePullQuote` (`apps/web/src/components/blog/inline-pull-quote.tsx:7-20`). Same JSX shape (`<figure>` → `<blockquote>` accent bar + italic serif → optional `<cite>` attribution). Same tokens (`border-accent-bristle`, `text-h3`, `text-text-primary`, `text-text-secondary`, `pl-grid`, `my-loose`, `mt-snug`). The only difference is the imported type name (`SampleProblemPullQuote` vs `BlogPullQuote`), and both types have the same `{text: string, attribution?: string}` prop shape.

**Why a near-duplicate, not a shared extraction**:
- Extracting to `packages/ui/` would touch `packages/` and **violate SC-018** slice-integrity (zero modifications under `packages/`).
- Extracting to a new `apps/web/src/components/shared/pull-quote.tsx` is acceptable from a slice-integrity standpoint but breaks the page-local-component convention established by slices 005-011 (every other shared module lives under `packages/`, not under `apps/web/src/components/shared/`).
- The duplication cost is ~10 lines of JSX. The future-refactor cost is bounded (~30 lines moved across 3 consumers when a 3rd consumer appears).

**Tracked follow-up** (added to §13 below): when a third pull-quote consumer appears OR when the `SectionScrollSpyRail` extraction lands, **batch the pull-quote extraction**. Recommended target location: `packages/ui/` (canonical home for cross-app primitives per CLAUDE.md §8). Either rename to a single canonical `PullQuote` import or keep page-local re-exports for backwards compatibility.

**Rationale**: preserves slice-integrity discipline (no `packages/` touch); preserves the page-local component convention; accepts ~10 lines of bounded duplication.

**Alternatives considered**:
- Import directly from `@/components/blog/inline-pull-quote` (rejected — cross-page imports under `apps/web/src/components/` violate the page-local convention; if the blog slice is ever refactored or split, slice 012's import would break silently).
- Inline the JSX directly into `ProblemBody` (rejected — `<figure>` with `<blockquote>` semantic structure is non-trivial; extracting to a named component keeps `ProblemBody` readable).

### 6. FrequencyChart structure — **confirmed: client component with useState, hand-rolled SVG line chart, 4 pre-bundled windowed datasets**

```tsx
// apps/web/src/components/problem/frequency-chart.tsx (sketch — CLIENT)
"use client";

import { useState, type MouseEvent } from "react";
import type { FrequencyWindow, SampleProblemFrequencyData } from "./types";
import { buildLinePath, calculateAxisTicks } from "./frequency-math";

const WINDOW_LABELS: Record<FrequencyWindow, string> = {
  "7d":  "7d",
  "30d": "30d",
  "90d": "90d",
  "all": "All",
};

const WINDOW_ORDER: ReadonlyArray<FrequencyWindow> = ["7d", "30d", "90d", "all"];

const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface FrequencyChartProps {
  data: SampleProblemFrequencyData;
}

export function FrequencyChart({ data }: FrequencyChartProps) {
  const [activeWindow, setActiveWindow] = useState<FrequencyWindow>("90d");

  const points = data[activeWindow];
  const { pathD, dots, xTicks, yTicks } = buildLinePath(points);

  function handleSelect(_e: MouseEvent<HTMLButtonElement>, w: FrequencyWindow) {
    // No motion to honor on plain re-render; matchMedia fresh-read pattern is included
    // here for symmetry with the slice-009/010/011 rail handlers if a future polish
    // slice adds a chart cross-fade (currently: instant re-render).
    // const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    setActiveWindow(w);
  }

  return (
    <figure className="rounded-card border border-border-default bg-surface-card p-grid">
      <header className="mb-grid flex items-baseline justify-between gap-grid">
        <div>
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
            FREQUENCY · 60 DAYS
          </p>
          <h2 className="mt-snug font-serif text-h2 text-text-primary">
            47 mentions · +312% MoM
          </h2>
        </div>
        <div role="group" aria-label="Time range" className="flex gap-2">
          {WINDOW_ORDER.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={activeWindow === w}
              onClick={(e) => handleSelect(e, w)}
              className={
                activeWindow === w
                  ? "rounded-button bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card"
                  : "rounded-button border border-border-default px-snug py-1 text-body-sm font-medium text-text-secondary"
              }
            >
              {WINDOW_LABELS[w]}
            </button>
          ))}
        </div>
      </header>
      <svg
        viewBox="0 0 1280 360"
        role="img"
        aria-label={`Frequency chart for the ${activeWindow} window`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* x-axis labels FEB 11, MAR 13, APR 12, MAY 10 — token-driven text fill */}
        {xTicks.map((t) => (
          <text key={t.x} x={t.x} y="340" textAnchor="middle" className="fill-text-secondary font-mono" fontSize="14">
            {t.label}
          </text>
        ))}
        <path d={pathD} className="fill-none stroke-accent-bristle" strokeWidth="2" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="3" className="fill-accent-bristle" />
        ))}
      </svg>
    </figure>
  );
}
```

**Pinned dimensions**:
- `viewBox="0 0 1280 360"` — 32:9 strip aspect (compatible with the design's wide horizontal chart).
- Line stroke: `stroke-2` (~2px at intrinsic viewBox).
- Dot radius: `r="3"` (matches the line stroke for visual continuity).
- x-axis label baseline: `y="340"` (~20px from the chart's bottom; leaves room for the line's last point).
- Active button: filled (`bg-text-primary text-surface-card`); inactive: outlined (`border border-border-default text-text-secondary`).

**Pre-bundled windowed datasets**: the 4 windows ship as part of `SAMPLE_PROBLEMS[0].frequencyData`. Total payload: 7 + 30 + 90 + 60 ≈ 187 points × ~24 bytes per `{date, count}` object after gzip ≈ **~1 KB total**, well under any meaningful budget.

**Reduced-motion**: chart re-render is instant (no transition, no animation). The `matchMedia` reading pattern is sketched for symmetry with slice-009/010/011 but currently a no-op — future polish slices may add a cross-fade between windows; the read-fresh pattern is already in place.

**Pattern A ARIA**: `<div role="group" aria-label="Time range">` wrapping 4 `<button aria-pressed={isActive}>` elements. **Not** `role="tablist"` / `role="tab"` / `aria-selected` (those are reserved for tabbed content panels; a chart-window toggle is a button group). Matches slice-006 `FaqScrollSpyRail` button-group ARIA precedent.

**Rationale**: simplest stateful shape that maps to the design intent; the client island is constrained to the toggle + SVG re-render; the math is pure-function-extractable for testability.

**Alternatives considered**:
- Use `recharts` (rejected — adds ~50 KB dep for a 4-segment / 4-windowed chart; SC-019 zero new deps).
- Pre-render all 4 SVG paths server-side and toggle visibility via CSS `display: none` (rejected — quadruples the SVG DOM payload; visibility-toggle approach is non-trivial to a11y-correct; the stateful client re-render is simpler and matches the conventional pattern).
- Store the toggle state in URL search params (rejected — would require `useSearchParams` + `replaceState`, adds complexity, the chart state is ephemeral; URL state is the wrong primitive).

### 7. DonutChart structure — **confirmed: hand-rolled SVG with token-utility fills; PALETTE CHOICE FLAGGED FOR REVIEW**

```tsx
// apps/web/src/components/problem/donut-chart.tsx (sketch — server)

import type { SampleProblemSourceRow } from "./types";
import { buildDonutSegments } from "./donut-math";

const SEGMENT_FILL_CLASS = [
  "fill-accent-bristle",  // largest segment — brand highlight (GitHub 26)
  "fill-text-primary",    // 2nd largest — dark (HN 13)
  "fill-text-secondary",  // 3rd — medium (SO 3)
  "fill-text-tertiary",   // 4th / Other — light (Other 5)
] as const;

interface DonutChartProps {
  rows: ReadonlyArray<SampleProblemSourceRow>;
  total: number;
  ariaLabel: string;
}

export function DonutChart({ rows, total, ariaLabel }: DonutChartProps) {
  // Sort descending by count so the palette mapping is by visual prominence,
  // not by data-store order. (For the Stripe data: GitHub 26, HN 13, Other 5, SO 3.)
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const segments = buildDonutSegments({
    rows: sorted,
    total,
    cx: 120,
    cy: 120,
    outerRadius: 110,
    innerRadius: 72,  // 72 / 110 ≈ 0.654 (the ~0.65 ratio per spec)
  });

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={ariaLabel}
      className="block h-auto w-full"
    >
      {segments.map((seg, i) => (
        <path
          key={seg.name}
          d={seg.path}
          className={SEGMENT_FILL_CLASS[i] ?? "fill-text-tertiary"}
        >
          <title>{`${seg.name}: ${seg.count} quotes (${seg.pct}%)`}</title>
        </path>
      ))}
    </svg>
  );
}
```

**Math (in `donut-math.ts`)**:

```ts
// apps/web/src/components/problem/donut-math.ts (pseudocode — see ECMAScript implementation)

// Convert (cx, cy, r, angle_in_degrees) to {x, y} on the circle.
//   angle of 0° points North (12 o'clock); angles advance clockwise.
function polarToCartesian(cx, cy, r, angleDeg):
    angleRad = (angleDeg - 90) * π / 180        // -90 rotates 0° to North
    return { x: cx + r * cos(angleRad), y: cy + r * sin(angleRad) }

// Build an SVG path string for one donut-arc segment.
//   Start at outerRadius @ startAngle, sweep clockwise to outerRadius @ endAngle,
//   line inward to innerRadius @ endAngle, sweep counter-clockwise back to
//   innerRadius @ startAngle, close.
function describeArc(cx, cy, outerR, innerR, startAngle, endAngle):
    p1 = polarToCartesian(cx, cy, outerR, startAngle)
    p2 = polarToCartesian(cx, cy, outerR, endAngle)
    p3 = polarToCartesian(cx, cy, innerR, endAngle)
    p4 = polarToCartesian(cx, cy, innerR, startAngle)
    largeArc = (endAngle - startAngle) > 180 ? 1 : 0
    return `M ${p1.x} ${p1.y}
            A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}
            L ${p3.x} ${p3.y}
            A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}
            Z`

// Build segment array with cumulative angles.
function buildDonutSegments({rows, total, cx, cy, outerRadius, innerRadius}):
    accAngle = 0
    return rows.map(row => {
        share = row.count / total
        sweep = share * 360
        seg = {
            name: row.name,
            count: row.count,
            pct: Math.round(share * 100),
            path: describeArc(cx, cy, outerRadius, innerRadius, accAngle, accAngle + sweep),
        }
        accAngle += sweep
        return seg
    })
```

**Math correctness**: the `-90` rotation in `polarToCartesian` ensures 0° points North (12 o'clock), so the first segment starts at the top of the donut. The `largeArc` flag is `1` for segments larger than 180° (a single-segment donut would need this; for the Stripe 4-segment distribution 26/13/3/5 with no segment exceeding 180°, all flags are `0` — but the code is correct for the general case).

**Pinned dimensions**:
- `viewBox="0 0 240 240"` — square viewBox so the donut renders at any container width without distortion.
- `cx = cy = 120` — viewport center.
- `outerRadius = 110` — leaves 10px padding from the viewBox edge.
- `innerRadius = 72` — gives a 72/110 ≈ **0.654 ratio** (matches the spec's "~0.65 inner/outer radius" target).
- Donut hole diameter ≈ 144px → renders as ~60% of the visible donut; common visual signal for "donut chart" (vs pie chart with a solid center).

**Per-segment `<title>` for hover affordance**: SVG's `<title>` element inside a `<path>` produces a native browser tooltip on hover AND is announced by screen readers as the accessible name of the path. Format: `"GitHub: 26 quotes (55%)"` per FR-021.

**🚨 PALETTE CHOICE FLAGGED FOR REVIEW 🚨**:

Three viable palette options for the 4 segments (Stripe data: GitHub 26, HN 13, SO 3, Other 5):

**Option A — Brand + monochrome tint hierarchy (RECOMMENDED)**:

| Segment | Token | Visual |
|---|---|---|
| GitHub 26 (55%) | `fill-accent-bristle` | brand orange — brightest |
| HN 13 (28%) | `fill-text-primary` | near-black |
| SO 3 (6%) | `fill-text-secondary` | medium gray |
| Other 5 (11%) | `fill-text-tertiary` | light gray |

Pros: reads as "the brand spotlights the largest source; the rest are factual neutrals". Editorial register matches CLAUDE.md §1 (calm density). Light-and-dark theme symmetry preserved without extra tokens (text-* tokens are themed). Zero risk of semantic clash. *Borrows `text-*` tokens for SVG fills — semantically slightly off (text tokens are nominally for type), but the underlying CSS custom-property values render correctly on any element and Tailwind exposes `fill-text-*` utilities natively.*

**Option B — Brand + validated + 2 neutrals**:

| Segment | Token | Visual |
|---|---|---|
| GitHub 26 | `fill-accent-bristle` | brand orange |
| HN 13 | `fill-accent-validated` | dark green / "verified" tone |
| SO 3 | `fill-border-strong` | medium neutral |
| Other 5 | `fill-border-default` | light neutral |

Pros: more visual variety; pairs the two accent tokens (brand + validated).  
Cons: `accent-validated` carries the semantic of "high-signal / verified" per §4.1 — using it for "the second-largest source" is semantic noise. Risk of designer pushback.

**Option C — Category-tint palette analog**:

Map each of the 4 sources to a category-tint pair from §4.1a (e.g. GitHub → `category/devtools/{bg,fg}`, HN → `category/email/{bg,fg}` for the muted blue-gray, etc.).  
Pros: visual variety; tints already designed to be warm-compatible with the editorial palette; meet WCAG AA pairs.  
Cons: category tints are explicitly scoped to **problem categories** (payments/devtools/ai-ml/auth-sso/deployment/analytics/mobile/email) per CLAUDE.md §4.1a — using them for **sources** (GitHub/HN/SO/Other) is a semantic mismatch and could create confusion if a source's tint happens to match an unrelated category's tint on the same page.

**RECOMMENDATION: Option A**. Cleanest editorial register, no semantic noise, zero risk of theme drift. The text-* token reuse for SVG fills is a small notational compromise for a clean visual outcome.

**Decision needed from reviewer**: A / B / C. Default is A unless flagged.

**RESOLVED — Option A confirmed by reviewer. Token-validation pre-flight: `--color-text-tertiary` is defined in `apps/web/src/app/globals.css:24` (light `#9A9A93`, dark `#6B6B65`). Tailwind v4 auto-generates `fill-text-tertiary`, `text-text-tertiary`, etc. from any `--color-*` token, so `fill-text-tertiary` is a valid utility. No fallback needed. Same proactive token-validation discipline that surfaced `text-on-accent` → `text-surface-card` in slice 011.**

**Rationale**: hand-rolled SVG keeps the bundle free of charting-library weight; the math is pure-function-extractable for testability; tokens-only fills preserve the theme contract.

**Alternatives considered (for the math approach)**:
- Use `d3-arc` (rejected — adds ~10 KB dep for ~30 lines of math; SC-019 zero new deps).
- Use CSS `conic-gradient` (rejected — produces a pie not a donut without compositing; the inner hole would need a `mask-image` or a second element; SVG is the cleaner primitive).
- Use a pre-computed array of path strings (rejected — couples the data shape to a manually-computed SVG; auto-deriving from `buildDonutSegments` lets the founder edit `sourcesBreakdown` values without re-doing the path math).

### 8. SampleBanner placement — **confirmed: outside the standard shell, ABOVE TopNav; ARCHITECTURAL FIRST FOR THE PROJECT**

```tsx
// apps/web/src/components/problem/sample-banner.tsx (sketch — server)

import Link from "next/link";

export function SampleBanner() {
  return (
    <div className="bg-accent-bristle text-surface-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-grid px-grid py-snug">
        <p className="text-body-sm">
          You&rsquo;re viewing a free sample &mdash; see the full library of 142k+ problems.
        </p>
        <Link
          href="/signup"
          className="rounded-button bg-surface-card px-snug py-1 text-body-sm font-medium text-accent-bristle"
        >
          Start free &rarr;
        </Link>
      </div>
    </div>
  );
}
```

**Composition shape**:

```tsx
// /problems/[slug]/page.tsx — via ProblemLayout:
<>
  <SampleBanner />        {/* NEW — chrome above TopNav (architectural first) */}
  <TopNav />              {/* slice-005 component, reused as-is */}
  <main>...page body...</main>
  <SiteFooter />          {/* slice-005 component, reused as-is */}
</>
```

**🚨 ARCHITECTURAL FIRST — flagged for review 🚨**:

This is the **first time** any chrome renders **outside** the standard `TopNav-Main-SiteFooter` shell in the project. Verified via grep at plan time:

```
$ grep -l "TopNav" apps/web/src/app/**/*.tsx
apps/web/src/app/page.tsx                  # landing: <TopNav/> first
apps/web/src/app/about/page.tsx            # <TopNav/> first
apps/web/src/app/blog/page.tsx             # <TopNav/> first
apps/web/src/app/changelog/page.tsx        # <TopNav/> first (via ChangelogLayout)
apps/web/src/app/contact/page.tsx          # <TopNav/> first
apps/web/src/app/faq/page.tsx              # <TopNav/> first
apps/web/src/app/pricing/page.tsx          # <TopNav/> first
apps/web/src/app/privacy/page.tsx          # <TopNav/> first
apps/web/src/app/terms/page.tsx            # <TopNav/> first
```

Every prior slice (005, 006, 007, 008, 009, 010, 011) opens with `<TopNav />` as the first sibling under the route's root. Slice 012 introduces `<SampleBanner />` as a **sibling above** `<TopNav />` — making it the first sibling under the route root.

**Why the design wants this**: the orange strip is a **page-level affordance** ("this whole page is a free sample") that should sit visually above the persistent site navigation. If the banner sat *inside* `<main>` (i.e. below `TopNav`), the visual hierarchy would imply "the banner is part of the page content" rather than "the banner is a meta-affordance about the page". The above-`TopNav` placement matches `design/Public_pages.pdf` page 7 verbatim.

**Why this is fine (not a regression)**:
- The slice-005 `TopNav` is purely additive in this composition — it renders the same nav links in the same positions; the only difference is its vertical position is shifted down by the banner's height.
- No edit to `top-nav.tsx`, `site-footer.tsx`, or the root layout (the root layout in `app/layout.tsx` wraps every route's content in `<body>` + global providers; the banner sits *inside* `<body>` but *above* `<TopNav>`).
- The banner doesn't conflict with the root layout's body-level classNames because both `<SampleBanner>` and `<TopNav>` are block-level siblings.
- No `min-h-screen` or sticky/fixed-positioning math changes (the banner is not sticky; it scrolls away with the rest of the page).

**Trade-off**:
- If a future slice adds a *sticky* banner (e.g. a maintenance notice or a "Pro upgrade" CTA), this slice's banner-above-`TopNav` pattern becomes the precedent for chrome-above-nav. Document the precedent in `quickstart.md` so future-slice authors don't have to re-derive it.

**Confirmation needed from reviewer**: is the above-`TopNav` placement OK as a new project precedent? Or should the banner sit *below* `TopNav` (which would deviate from the design)?

**RECOMMENDATION**: ship above `TopNav` to match the design. Document the new precedent in `quickstart.md`.

**Alternatives considered**:
- Render the banner inside `<TopNav>` itself (rejected — touches `top-nav.tsx` and violates SC-018 slice-integrity; slice-005 is locked).
- Make `TopNav` a slot-receiver and inject `SampleBanner` as a slot (rejected — would require touching `top-nav.tsx`).
- Render the banner inside `<main>` below `<TopNav>` (rejected — deviates from design; visual hierarchy wrong).

**Rationale**: matches design page 7 verbatim; preserves slice-integrity; introduces one new precedent (documented).

### 9. EvidenceList layout — **confirmed: 5 visible + 2 blurred + 1 CTA = 8 elements; blur-sm on quote text only**

```tsx
// apps/web/src/components/problem/evidence-list.tsx (sketch — server)

import type { SampleProblemEvidenceQuote } from "./types";
import { EvidenceQuote } from "./evidence-quote";
import { EvidenceCTA } from "./evidence-cta";

interface EvidenceListProps {
  quotes: ReadonlyArray<SampleProblemEvidenceQuote>;
}

export function EvidenceList({ quotes }: EvidenceListProps) {
  return (
    <section className="space-y-grid">
      <h2 className="font-serif text-h2 text-text-primary">Evidence (47 quotes)</h2>
      <ul className="space-y-grid">
        {quotes.map((q, i) => (
          <li key={i}>
            <EvidenceQuote quote={q} />
          </li>
        ))}
      </ul>
      <EvidenceCTA />
    </section>
  );
}
```

```tsx
// apps/web/src/components/problem/evidence-quote.tsx (sketch — server)

import type { SampleProblemEvidenceQuote } from "./types";

const SOURCE_LABEL: Record<string, string> = {
  github: "GitHub",
  hackernews: "Hacker News",
  stackoverflow: "Stack Overflow",
  reddit: "Reddit",
  producthunt: "Product Hunt",
};

export function EvidenceQuote({ quote }: { quote: SampleProblemEvidenceQuote }) {
  const sourceLabel = SOURCE_LABEL[quote.source] ?? quote.source;
  const cardAriaLabel = quote.blurred ? "Locked preview — sign up to read" : undefined;
  return (
    <article
      className="rounded-card border border-border-default bg-surface-card p-grid"
      aria-label={cardAriaLabel}
    >
      <header className="flex items-center gap-snug text-body-sm text-text-secondary">
        <span className="font-medium text-text-primary">{quote.authorHandle}</span>
        <span>·</span>
        <span>{sourceLabel}</span>
        <span>·</span>
        <span>{quote.upvotes} upvotes · {quote.commentCount} comments</span>
        <span className="ml-auto">{quote.timestamp}</span>
      </header>
      <blockquote
        className={`mt-grid font-serif text-body-lg italic text-text-primary ${quote.blurred ? "blur-sm select-none" : ""}`}
        aria-hidden={quote.blurred ? true : undefined}
      >
        {quote.text}
      </blockquote>
    </article>
  );
}
```

**Confirmations**:
- 8 elements total in the visible DOM: 5 unblurred `EvidenceQuote` + 2 blurred `EvidenceQuote` + 1 `EvidenceCTA` (SC-008). Counted via `EvidenceList` consuming the 7-quote `quotes` array + appending the CTA card.
- Tailwind `blur-sm` (4px default) on the **quote text only** (the `<blockquote>` element). Author/source/upvote/timestamp row stays sharp per design intent. Recommended over `blur-md` (12px) — `sm` reads as "blurred but text shape visible", `md` reads as "completely illegible" which is too aggressive.
- `select-none` on the blurred text prevents copy-paste extraction (small defense; not security).
- `aria-hidden={true}` on the blurred blockquote hides the unreadable text from screen readers; the wrapping `<article aria-label="Locked preview — sign up to read">` provides the accessible affordance for SR users.
- The wrapping `<article>` carries `aria-label` only on blurred cards — unblurred cards have no `aria-label` (the visible content is their accessible content).
- Real placeholder text (not lorem-ipsum) on the blurred cards — per spec FR-023 + the "you can see text exists but can't read it" visual signal intent.

**Blur magnitude decision** (spec asks for pinning):
- `blur-sm` = 4px (Tailwind default) — RECOMMENDED. Quote shape visible; individual letters illegible. Matches design intent.
- `blur-md` = 12px — too aggressive; loses the "text exists" signal entirely.
- `blur` (alias for `blur-base`) = 8px — intermediate; would also work, but `blur-sm` is the more conservative choice.

**Decision needed from reviewer**: confirm `blur-sm` or override.

**Alternatives considered**:
- CSS `backdrop-filter: blur(...)` rejected — applies to the area *behind* the element, not the text itself; wrong primitive.
- SVG `<filter>` with `feGaussianBlur` rejected — overkill for a text-blur effect; Tailwind utility is simpler.
- Replace blurred text with a `<div aria-hidden>` of gray bars (skeleton-style) rejected — loses the "you can see text exists" intent; visually less editorial.

### 10. Per-page metadata — **confirmed shape**

```ts
// /problems/[slug]/page.tsx (sketch — generateMetadata)

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return {};

  const description = problem.stubBody
    ? "Sample problem report — full report forthcoming."
    : truncate(problem.lead, 155);   // truncate to ~155 chars at word boundary

  const url = `${SITE_URL}/problems/${problem.slug}`;
  const title = `${problem.title} — Bristle`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",                                       // per-spec FR-003
      url,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  };
}
```

**Confirmations**:
- `title: "${problem.title} — Bristle"` — em-dash separator matches the slice-006/008/009/010/011 title-suffix pattern.
- `description` branches on `stubBody`: full uses `problem.lead` truncated to ~155 chars at word boundary (description-tag SEO sweet spot); stubs use a fixed string `"Sample problem report — full report forthcoming."`.
- `og:type: "article"` per spec FR-003 (the problem detail IS a single article-shaped page; matches slice-010 `/blog/[slug]` precedent).
- `og:image`: slice-005 raster reused unchanged at `${SITE_URL}/og-image.png` (1200×630). Per-problem OG image generation via `@vercel/og` is deferred (tracked follow-up §13).
- `og:url`: `${SITE_URL}/problems/${slug}` — fully-qualified absolute URL.
- **No `robots` field** → indexable by default. These are public deep-link surfaces.
- **No `alternates.types`** — no feed for problems this slice (the Atom feed is changelog-only per slice 011).

**Truncate helper**: 4-line inline function; truncate to ~155 chars at the last word boundary. If the lead is shorter than 155 chars, return as-is. No imports needed.

**Rationale**: matches the slice-010 per-problem-page metadata shape; preserves the page-level OG image discipline; gives each route a distinct title for crawlers and feed-reader UIs.

**Alternatives considered**:
- Per-problem dynamic OG images via `@vercel/og` (rejected — adds dependency + build complexity; deferred to a future polish slice; the shared raster is good-enough for slice 012).
- Add `keywords` field (rejected — `<meta name="keywords">` is ignored by major search engines; bloat).

### 11. Render mode + perf — **confirmed: all 5 routes ● SSG; First Load JS ~110-115 KB**

| Route | Expected First Load JS | Client bundles | Notes |
|---|---|---|---|
| `/problems/stripe-webhooks-vercel-cold-starts` | **~112-115 KB** | `FrequencyChart` (~2-4 KB compiled) | Full page renders all components; the 4 windowed datasets are bundled (~1 KB) |
| `/problems/webhook-ordering-on-retries` | **~108-110 KB** | none | Stub route, no client component rendered (the `if (problem.stubBody)` branch short-circuits before `FrequencyChart`) |
| `/problems/llm-streaming-cdn-buffering` | **~108-110 KB** | none | Stub route |
| `/problems/expo-ota-ios-18-4` | **~108-110 KB** | none | Stub route |
| `/problems/pgvector-index-degradation-2m` | **~108-110 KB** | none | Stub route |

**Estimation method**:
- Slice-005 `/` baseline = ~106 KB First Load JS (`TopNav` + `SiteFooter` + Next.js runtime).
- Slice-010 `/blog/[slug]` = ~107 KB (baseline + `BlogRailToc` ~1-2 KB).
- Slice-011 `/changelog` = ~107-110 KB (baseline + `ChangelogJumpNav` ~1-2 KB).
- Slice-012 `/problems/stripe-...`: baseline + `FrequencyChart` ~2-4 KB (slightly heavier than `BlogRailToc` because the line-chart path string builder + button group has more JSX) + 4 windowed datasets ~1 KB ≈ **~112-115 KB**.
- Slice-012 stub routes: baseline + `ProblemHero` server-rendered SVG badges + no client component ≈ **~108-110 KB**.

**Investigation threshold**: if any `/problems/[slug]` route exceeds **130 KB** at build, investigate. Likely candidates: accidental import of `recharts` / `chart.js` / `d3` (would defeat the zero-deps discipline); accidental client-component conversion of `DonutChart` or any of the server components.

**Lighthouse posture** (binding on `/problems/stripe-webhooks-vercel-cold-starts` only — the highest-content route):
- Performance ≥ 90: large-static-content + minimal-JS; LCP candidate is `ProblemHero`'s serif headline (server-rendered text with `font-display: swap`).
- Accessibility ≥ 90: WCAG 2.2 AA discipline (heading semantics h1/h2, `<nav aria-label>`, `aria-pressed`, `role="img"` + `aria-label` on both SVGs, `<blockquote>`/`<cite>` semantics, blurred-card `aria-hidden` + `aria-label`, focus rings).
- Best Practices ≥ 90: HTTPS-only, no console errors.
- SEO ≥ 90 on local-prod; SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact.

**All 5 routes ● SSG**: `generateStaticParams` returns the 5 slugs at build time; Next.js prerenders each route's HTML; verified at gate via inspecting the build report.

### 12. ARIA + a11y posture — **confirmed (with sticky-rail boundaries pinned)**

**`/problems/stripe-webhooks-vercel-cold-starts` (full page)**:
- `<SampleBanner>` is a `<div>` (not a `<header>` — it's a page-level affordance, not the page's primary header); the contained `<p>` carries the announcement text and is read by screen readers in document order.
- `<TopNav>` (reused) — its accessible structure is unchanged from slice 005.
- `<main>` landmark wrapping the breadcrumb + hero + body + sticky-rail + frequency + evidence sections.
- `<ProblemBreadcrumb>` rendered as `<nav aria-label="Breadcrumb">` containing a `<ol>` of `<li>` items with " / " text separators. **No anchor tags** in v1.0 (FR-006); future slices may wire the breadcrumb to category pages.
- `<ProblemHero>` contains `<h1>` (serif) with the problem title; meta rows are `<div>` siblings.
- `<ProblemMomentumChip>` is a `<span>` with the visible text `▲ +312% / 14d` — the "▲" character is the accessible affordance, no extra `aria-label`.
- `<ProblemSourceBadge>` is a `<span>` with the source initial visible OR a `<svg role="img" aria-label="GitHub">` if rendered as a glyph. Recommend the initial-letter approach (e.g. "G" for GitHub, "H" for Hacker News, "S" for Stack Overflow, "R" for Reddit, "P" for Product Hunt) — simplest, no glyph maintenance, accessible by default.
- Save / Share buttons: `<button type="button">` with visible label text + optional lucide-react glyph. No `onClick`, no `aria-pressed` (they're not toggles), no `disabled` attribute (they're decorative-not-disabled — full design parity).
- `<ProblemBody>` contains `<p>` for lead, `<ProblemPullQuote>` for the pull quote (renders `<figure>` > `<blockquote>` + optional `<cite>`), `<p>` for the body.
- `<aside>` for the sticky right rail; `<aside className="md:sticky md:top-grid md:flex md:flex-col md:gap-grid">` per the slice-010 `BlogRailToc` sticky pattern.
- `<SourcesCard>` is a `<section>` with the eyebrow `<p>` and inner `<DonutChart>` (SVG `role="img" aria-label="Sources breakdown: GitHub 26 quotes (55%), Hacker News 13 quotes (28%), ..."`) + a `<ul>` of breakdown rows.
- `<RelatedProblemsCard>` is a `<section>` containing an `<h3>` and a `<ul>` of `<li>` with `<a href="/problems/{slug}">` + title + `<p>` lead snippet.
- `<FrequencyChart>` is a `<figure>` with `<header>` containing the eyebrow + `<h2>` headline + `<div role="group" aria-label="Time range">` button group; the SVG carries `role="img" aria-label="Frequency chart for the 90d window"` (updated dynamically per `activeWindow`).
- `<EvidenceList>` is a `<section>` with `<h2>Evidence (47 quotes)</h2>` and a `<ul>` of `<li>` containing `<EvidenceQuote>` cards + a final `<EvidenceCTA>` block.
- `<EvidenceQuote>` is an `<article>` with `<header>` (author row) + `<blockquote>` (italic serif). Blurred cards: `<article aria-label="Locked preview — sign up to read">` + `<blockquote aria-hidden="true" className="blur-sm select-none">`.
- `<EvidenceCTA>` is an `<aside>` (or `<div>`) with the headline + subline + `<a href="/signup">`.
- `<SiteFooter>` (reused).

**`/problems/{stub-slug}` (stub pages)**:
- `<SampleBanner>` + `<TopNav>` + `<main>` + `<ProblemBreadcrumb>` + `<ProblemHero>` + `<p className="my-section text-body-md text-text-secondary">Full problem report forthcoming.</p>` + `<SiteFooter>`.
- The `<h1>` in `<ProblemHero>` remains the page's primary heading.
- No `<h2>` on stub pages (no Evidence / FREQUENCY sections to head).

**Tab order**:
- TopNav primary links → SampleBanner CTA ("Start free →") → breadcrumb (text-only, not in tab order) → Save → Share → body content (no focusable elements in prose) → time-range toggle buttons (×4) → SourcesCard donut (focusable? no — `<svg>` is not focusable by default; we don't need keyboard interaction with the donut) → RelatedProblems anchors (×4) → Evidence cards (each `<article>` is not focusable; the blurred-card `aria-label` is announced when SR navigates to the article landmark) → EvidenceCTA "Create free account →" → SiteFooter links.

**`prefers-reduced-motion`**: respected in `FrequencyChart` (no transition on re-render currently; the matchMedia fresh-read pattern is in place for future motion additions). All other animations on the page are CSS `transition-colors` color shifts (per Tailwind default 150ms), already reduced-motion-safe.

**Focus rings**: visible 2px `accent/bristle` + 4px outer ring on every interactive element. Recipe (already established in `globals.css`): `focus-visible:outline-2 focus-visible:outline-accent-bristle focus-visible:outline-offset-2`. Per CLAUDE.md §5.

**Scroll behavior**: deep-link anchor to evidence cards would benefit from `scroll-mt-section`, but there are no fragment anchors in v1.0 (no permalinks to individual evidence quotes). Skip `scroll-mt-section` this slice; add when permalinks land.

### 13. Risks, unknowns & tracked follow-ups

#### Risks (in-slice)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | 4px visual fidelity to `Public_pages.pdf` page 7 | Med | Low | Map every dimension to tokens; screenshot-compare at 1280 width; the donut segment proportions, the frequency-chart line shape, the blurred-card visual weight, and the sticky right rail's offset relative to TopNav are the most-likely 4px-tolerance suspects. |
| R2 | Donut math produces visually incorrect arcs (e.g. wrong sweep direction, wrong start angle, gaps between segments) | Med | Med | The `donut-math.ts` helper is pure — write a small mental-model sanity check in the implementing PR (manual: render with 4 equal-25%-segments and verify the donut renders as 4 equal quarters starting from 12 o'clock). For the Stripe data (26/13/3/5 = 55%/28%/6%/11%), the largest segment should sweep from 12 o'clock clockwise ~198°. Document expected angles in the PR. |
| R3 | `FrequencyChart` line path produces visually wrong rendering (Y-axis clipping, X-tick mis-positioning, dot mis-placement) | Med | Med | The `frequency-math.ts` helper is pure — same sanity-check posture as R2. For the Stripe 90d window (~90 points, count range 1-12), the line should rise from ~y=320 (low) to ~y=20 (high) across the full x-axis. |
| R4 | Save / Share buttons confuse the visitor by appearing functional but doing nothing | Low | Med | Voice + microcopy mitigates: label them with visible text "Save" / "Share" so they look like normal buttons (not promised features). Document in the PR test plan that this is per-design intent (presentational). A future slice ships real Save (account library) and Share (URL copy). |
| R5 | The `SampleBanner` above-`TopNav` placement breaks an unforeseen layout-shell assumption (e.g. a fixed-positioned modal trap from a future slice that assumes `TopNav` is the topmost sibling) | Low | Low | No such assumption exists in slices 005-011. Document the new precedent in `quickstart.md`. |
| R6 | Blurred evidence quotes leak the real text via DOM inspection (visitor saves an "all 47 quotes" view by removing the `blur-sm` class via DevTools) | Confirmed expected | Low | Acknowledged — the blur is a visual signal, not a security measure. Real quote gating happens via the API in a future app-tier slice. The 2 blurred quotes ship placeholder content (per FR-020) so even DOM-inspection leak reveals only placeholder text. |
| R7 | A future content edit breaks the data store's stubBody discriminator (e.g. sets `stubBody: false` on a stub without filling the required full-report fields) | Low | High | TypeScript's discriminated-union narrowing catches this at compile time — the typecheck gate at STOP-4 will fail. The discriminator is the safety rail. |
| R8 | Link-flip regression: slice-005 SampleReports landing cards point at the wrong slug after a slice-004 seed re-write | Very Low (no seed change this slice) | High (would render 404 on landing CTAs) | The 3 seed-flip stubs in `sample-problems.ts` MUST keep their slug strings aligned with `packages/db/src/seed.ts` verbatim. Cross-verify at STOP-1: `diff <(grep -E '^\s*slug:' apps/web/src/components/problem/sample-problems.ts | sort -u) <(grep -E '^\s*slug:' packages/db/src/seed.ts | sort -u)` should show 1 unique slug in the slice-012 store (`stripe-webhooks-vercel-cold-starts` and `webhook-ordering-on-retries` differ) and 0 unique slugs in the seed (every seed slug appears in the slice-012 store). |
| R9 | First Load JS on `/problems/stripe-...` exceeds 180 KB gz | Low | High | One client component (~2-4 KB); content-static; zero new deps; 4 windowed datasets (~1 KB). Estimation puts it at 112-115 KB. ≥130 KB triggers investigation. |
| R10 | The donut palette choice (decision §7) doesn't match the design tone (e.g. the monochrome tints read as "boring" or the brand-orange highlight reads as "noisy") | Low | Low | Decision §7 flags the palette choice for reviewer call. Option A is recommended; B and C are alternates. The choice is a single-class edit if changed post-PR. |

#### Tracked follow-ups (out of scope this slice, captured here for future-slice authoring)

**ELEVATED priority (top of the list, carried from slice 011)**:

- **Dedupe `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) + `ChangelogJumpNav` (011) into a shared `SectionScrollSpyRail`**. Slice 012 does NOT add a fifth structural mirror (its sticky right rail is a simple `<aside className="md:sticky md:top-grid">` without scroll-spy state), but the 4-mirror refactor pressure carries forward unchanged. **Recommended timing**: dedicated refactor slice between Tier 2 ship and Tier 3 start; OR batch with the next rail-introducing slice if one appears in Tier 2.

**NEW this slice (medium priority)**:

- **Extract `PullQuote` to `packages/ui/`**: slice 010's `InlinePullQuote` and slice 012's `ProblemPullQuote` are visually-and-prop identical. **Recommended timing**: when a third consumer appears OR when the `SectionScrollSpyRail` refactor lands (batch the two extractions). Target location: `packages/ui/src/pull-quote.tsx`. The two existing call sites become thin re-exports for backwards compatibility (or import the canonical name directly).

- **Wire the slice-005 landing Hero `ProblemCardFull` to a link**: the Hero's `ProblemCardFull` (`apps/web/src/components/landing/hero.tsx:37-47`) renders the Stripe problem but does not accept an `href`. The full Stripe page (`/problems/stripe-webhooks-vercel-cold-starts`) is reachable via direct URL only, not from the landing chrome. Wiring the hero card to the detail page is a small change to `packages/ui/src/problem-card-full.tsx` (add optional `href` prop) + `apps/web/src/components/landing/hero.tsx` (pass `href={`/problems/${problem.slug}`}`). **Recommended timing**: slice 2.7 (Tier-2 polish) or batch with the next polish opportunity.

**Standard follow-ups (in priority order)**:

- **Real evidence quotes for `SAMPLE_PROBLEMS[0].evidenceQuotes`** — founder authoring required pre-launch; the placeholder discipline (header marker + Assumptions ratification) is the safety rail. 7 quote records ship as placeholders.
- **Real frequency time-series for `SAMPLE_PROBLEMS[0].frequencyData`** — same — founder reconciles. 4 windowed datasets ship as synthesized placeholders matching the +312% MoM claim.
- **Real sources breakdown for `SAMPLE_PROBLEMS[0].sourcesBreakdown`** — same — founder reconciles. The 26/13/3/5 = 47 distribution is synthesized.
- **Per-problem OG image generation via `@vercel/og`** — currently all routes share `/og-image.png`; per-problem dynamic OG would improve social-share affordance. Parallel to the slice-010 Blog deferred follow-up.
- **Wire the `ProblemBreadcrumb` segments to category landing pages** — currently presentational text only (FR-006); when the `/library` index and `/categories/[category]` routes land, swap the spans for `<a>` tags. Recommended timing: with the slice-2.6b Library index (or whenever it lands).
- **`Save` and `Share` button real behavior** — `Save` becomes account-bound library (app tier); `Share` becomes URL-copy / OG-share affordance. Recommended timing: app tier (post-Tier-2).
- **Permalink anchors on individual evidence quotes** — would enable deep-linking to a specific quote (e.g. `/problems/{slug}#quote-3`). Skip until `<EvidenceQuote>` cards warrant it.
- **Frequency chart cross-fade animation on toggle** — currently instant re-render; a future motion-polish slice could add a 180ms cross-fade (CLAUDE.md §4.5 default). The reduced-motion fresh-read is already in place to support this addition safely.

**Carry-forwards** from slice 011 (in priority order; only the ones still applicable):

1. `SectionScrollSpyRail` shared extraction — **ELEVATED** (top of list above).
2. Real screenshot assets for `ChangelogFigure`.
3. Real authored content for changelog entries.
4. Atom feed validation tooling (`pnpm changelog:validate`).
5. Changelog entry permalink deep pages.
6. Tag/category filtering on changelog.
7. "Past releases" archive separation on changelog.
8. Per-article OG image generation for changelog entries.
9. Blog `categoryLabel` mapping dedupe.
10. `--duration-hover` token.
11. RSS feed for `/blog`.
12. Author profile pages.
13. `/blog/categories/[category]` SEO deep pages.
14. Slice-005 `<main>` landmark fix.
15. NewsletterStub markup convergence — slice 2.7.
16. `/privacy/sub-processors` deep page.
17. Refund-policy alignment audit (permanent cross-slice constraint).
18. Form spam protection.
19. Resend Vitest harness.
20. Custom Bristle-voiced 404 page.
21. **gh-token HTTPS push pattern** if SSH agent stays stale.

#### Unknowns

Two open palette-choice questions flagged for review (decision §7 donut palette A/B/C; decision §9 blur magnitude sm/md/base); no NEEDS CLARIFICATION markers in the spec. All other decisions are pinned.

### 14. Implementation batching — **confirmed: 4 batches / 4 STOPs**

- **Batch A / STOP 1 — Foundations** (~4 commits, sequential):
  - T001: `types.ts` (SampleProblem + discriminated union + all sub-shapes)
  - T002: `donut-math.ts` (`polarToCartesian`, `describeArc`, `buildDonutSegments`) — depends on T001 only for `SampleProblemSourceRow` import
  - T003: `frequency-math.ts` (Y-axis scaling, X-tick positioning, polyline path builder) — depends on T001 only for `FrequencyPoint` import
  - T004: `sample-problems.ts` (5 entries verbatim, `[PLACEHOLDER]` header) — depends on T001
  - **Verification gate**: typecheck/lint + `[PLACEHOLDER]` header check + entry count (5) + slug enumeration (cross-check the 4 stub slugs against the slice-004 seed for the 3 seed-flip slugs; verify the 4th stub `webhook-ordering-on-retries` is slice-012-local) + stubBody discriminator wired (Stripe = false; all 4 stubs = true) + sourceBadges array length sanity (≤5 per FR-007 / spec Assumption #7) + sourcesBreakdown rows sum to quoteCount (47) on Stripe + relatedProblems list length = 4 + each relatedProblems.slug appears in SAMPLE_PROBLEMS.

- **Batch B / STOP 2 — Primitive components** (~12 commits, mostly [P]-parallel):
  - T005 [P]: `SampleBanner` (server) — orange strip
  - T006 [P]: `ProblemBreadcrumb` (server) — text-only with " / " separators
  - T007 [P]: `ProblemMomentumChip` (server) — pill with tokens-only colors
  - T008 [P]: `ProblemSourceBadge` (server) — circular per-source glyph
  - T009 [P]: `ProblemHero` (server) — h1 + meta rows + Save/Share; depends on T007 + T008
  - T010 [P]: `ProblemPullQuote` (server) — near-duplicate of slice-010 InlinePullQuote
  - T011 [P]: `ProblemBody` (server) — lead + ProblemPullQuote + body; depends on T010
  - T012 [P]: `DonutChart` (server) — hand-rolled SVG; depends on T002
  - T013 [P]: `SourcesCard` (server) — eyebrow + DonutChart + breakdown list; depends on T012
  - T014 [P]: `RelatedProblemsCard` (server) — 4-item linked list
  - T015 [P]: `EvidenceQuote` (server) — single quote card with blurred prop
  - T016 [P]: `EvidenceCTA` (server) — gated sign-up callout
  - T017 [P]: `FrequencyChart` (client) — toggle + line chart; depends on T003
  - **Verification gate**: typecheck/lint + `grep -l "use client"` returns only T017 (single-client-island check; SC-017) + hex/font-family/voice/emoji greps + per-component visual smoke at the implementer's local dev server. Note: T005-T017 are mostly genuinely [P]; the few sequential pairs (T007/8/9, T010/11, T012/13, T003/17, T002/12) are explicitly noted.

- **Batch C / STOP 3 — Layout + Route** (~3 commits, sequential):
  - T018: `EvidenceList` (server) — composes EvidenceQuote × 5 + 2 + EvidenceCTA; depends on T015 + T016
  - T019: `ProblemLayout` (server) — composes SampleBanner + TopNav + main(breadcrumb + hero + body branch) + SiteFooter; depends on T005 + T006 + T009 + T011 + T013 + T014 + T017 + T018
  - T020: `/problems/[slug]/page.tsx` ADD — depends on T004 + T019
  - **Verification gate**: typecheck/lint/build + first read of First Load JS budgets on all 5 routes + each of the 5 prerendered routes returns 200 on `pnpm --filter web start` + initial structural verification (5 ● SSG in build output) + curl `/problems/{any-unknown-slug}` → 404.

- **Batch D / STOP 4 — Gates** (no commits, 2 verification gates):
  - T-local: T021 — pnpm typecheck/lint/build (SC-013); First Load JS < 180 KB on all 5 routes (SC-014); Lighthouse ≥ 90 on `/problems/stripe-webhooks-vercel-cold-starts` (SC-015); responsive sweep at 320/375/768/1024/1280/1440 + design page-7 visual diff at 1280; hex/font/voice/emoji greps clean (SC-016); frequency-chart toggle walk (click each of 4 buttons, verify aria-pressed flips, verify SVG re-renders); donut chart segment count + per-segment <title> presence + aria-label correctness (SC-007); evidence count = 8 elements (SC-008); Save/Share button presentational (no onClick, no state — verify in dev tools); breadcrumb plain-text " / " separator (zero <a> tags in rendered HTML — SC-011); single-client-island check (SC-017); pnpm-lock.yaml unchanged (SC-019); git diff --stat against origin/main shows zero modifications outside slice-012 dirs (SC-018); zero dark-mode class names introduced (SC-020); LINK-FLIP regression: 3 slice-005 SampleReports landing cards resolve to live stub pages (SC-005 — curl `/` and inspect href values + curl each href and verify HTTP 200).
  - T-preview-parity: T022 — push branch (gh-token HTTPS if SSH agent stale per slice-011 pattern); Vercel preview deploy; all 5 `/problems` routes return 200 on preview hostname; slice-005 SampleReports landing cards on preview navigate to live stub pages; slice-006/008/009/010/011 routes return 200 on preview (regression clean).

**Expected total: ~20 commit-producing tasks + 2 verification gates = 22 tasks**. Slightly larger than slice 011 (15 tasks) because: 1 additional pure helper module (`donut-math.ts` + `frequency-math.ts` vs slice-011's single `atom-xml.ts`); 4 additional components (Stripe full report has more parts than the changelog page); 2 hand-rolled SVG visualizations vs slice-011's 1.

### 15. Process-discipline note — slice-011 STOP-1 count-drift lesson

The slice-011 STOP-1 gate **caught a count-drift**: the spec and plan claimed "13 entries" while the data store had a different count. The lesson: every count claim across spec.md / plan.md / tasks.md MUST be cross-checked against the actual data store at STOP-1 before any other batch starts.

**For slice 012, the count claims to grep-clean are**:

| Count | Where it must appear | Value |
|---|---|---|
| Routes (total prerendered) | spec + plan + tasks + Next.js build output | **5** |
| Stubs | spec + plan + tasks | **4** |
| Full problems | spec + plan + tasks | **1** |
| RelatedProblemsCard items | spec + plan + tasks + Stripe full record | **4** |
| FrequencyData windows | spec + plan + tasks + types + Stripe full record | **4** (`7d`/`30d`/`90d`/`all`) |
| EvidenceList card-like elements | spec + plan + tasks | **8** (5 visible + 2 blurred + 1 CTA) |
| EvidenceQuote unblurred | spec + plan + tasks + Stripe full record | **5** |
| EvidenceQuote blurred | spec + plan + tasks + Stripe full record | **2** |
| SourcesBreakdown rows | spec + plan + tasks + Stripe full record | **4** (GitHub/HN/SO/Other) |
| SourceBadges in hero meta | spec + plan + tasks + Stripe full record | **5** |
| Pre-flight grep command (run at STOP-1) | | see below |

**Suggested pre-flight check command** (paste into the STOP-1 gate task):

```sh
echo "=== Count claims in spec ==="
grep -E "5 (route|shippable|entries)|4 stub|4 (related|window|source-breakdown row)|5 visible|2 blurred|8 (card|element)|5 source badge" specs/012-sample-report/spec.md | wc -l

echo "=== Count claims in plan ==="
grep -E "5 (route|shippable|entries)|4 stub|4 (related|window|source-breakdown row)|5 visible|2 blurred|8 (card|element)|5 source badge" specs/012-sample-report/plan.md | wc -l

echo "=== Data store cross-check ==="
echo "  SAMPLE_PROBLEMS entries: $(grep -cE '^const [A-Z_]+: SampleProblem' apps/web/src/components/problem/sample-problems.ts)"
echo "  stubBody: false count:   $(grep -c 'stubBody: false' apps/web/src/components/problem/sample-problems.ts)"
echo "  stubBody: true count:    $(grep -c 'stubBody: true'  apps/web/src/components/problem/sample-problems.ts)"
echo "  relatedProblems items:   $(grep -A 4 'relatedProblems:' apps/web/src/components/problem/sample-problems.ts | grep -c '^\s*{ slug:')"
echo "  frequencyData windows:   $(grep -E '\"(7d|30d|90d|all)\":' apps/web/src/components/problem/sample-problems.ts | wc -l)"
echo "  sourcesBreakdown rows:   $(grep -A 5 'sourcesBreakdown:' apps/web/src/components/problem/sample-problems.ts | grep -c 'name:')"
echo "  evidenceQuotes blurred=true:  $(grep -c 'blurred: true'  apps/web/src/components/problem/sample-problems.ts)"
echo "  evidenceQuotes blurred=false: $(grep -c 'blurred: false' apps/web/src/components/problem/sample-problems.ts)"
```

The actual counts MUST match: 5 entries / 1 false / 4 true / 4 related / 4 windows / 4 sources / 5 visible quotes / 2 blurred quotes.

**The `tasks.md` that `/speckit.tasks` generates MUST also pass the same grep** before /speckit.implement runs. Document this as a hard gate on tasks.md authoring.

## Order of operations

1. **Batch A**: T001 (types.ts) → T002 (donut-math.ts) and T003 (frequency-math.ts) and T004 (sample-problems.ts) [T002/T003/T004 all depend on T001; can be [P]-parallel after T001 lands].
2. **Batch B**: T005-T017 mostly [P]-parallel after T001-T004. Sequential pairs: T007 + T008 → T009; T010 → T011; T012 (needs T002) → T013; T003 → T017.
3. **Batch C**: T018 (EvidenceList) needs T015 + T016. T019 (ProblemLayout) needs T005 + T006 + T009 + T011 + T013 + T014 + T017 + T018. T020 (/problems/[slug]/page.tsx) needs T004 + T019.
4. **Batch D**: T021 (local gate) → push branch → T022 (preview parity).

`types.ts` (Batch A first task) gates the whole slice. `sample-problems.ts` gates the route. `donut-math.ts` gates `DonutChart`. `frequency-math.ts` gates `FrequencyChart`. `ProblemLayout` gates the page.

## Complexity Tracking

No constitution violations — section intentionally empty. The architectural-first chrome-above-`TopNav` placement (decision §8) is recorded above as a new project precedent for documentation in `quickstart.md`; it does NOT count as a violation because no §3-§9 constraint is breached. The donut palette choice (decision §7 — Option A recommended) and the blur magnitude (decision §9 — `blur-sm` recommended) are surfaced for reviewer call; the recommendations are token-clean and reversible single-class edits if changed post-PR.
