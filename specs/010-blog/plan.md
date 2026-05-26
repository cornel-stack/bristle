# Implementation Plan: Blog index + blog post template + 7 articles

**Branch**: `010-blog` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-blog/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Snippets are illustrative shapes for review.

## Summary

Ship the Tier-2 build-plan slice **2.4 — Blog index + post + first article**. Two surfaces land: a Blog index at `/blog` (replaces the slice-005 `<ComingSoon version="0.2.4" />` stub) and a dynamic blog-post route at `/blog/[slug]` (statically prerendered for all 7 article slugs via `generateStaticParams`). The index composes `TopNav` (reused) + `BlogHero` + `BlogArticleGrid` (the single client component that owns the filter state and houses `BlogFilterChips` + `BlogFeaturedCard` + the 6-card grid) + `SiteFooter` (reused). The post route composes `TopNav` + a shared `BlogPostLayout` (Server) wrapping `BlogPostHero` + `BlogPostBody` + `BlogRailToc` (client, scroll-spy) + `TryBristleCard` + `SiteFooter`. One article — the featured GitHub-issues analysis — renders full body (2-paragraph lead + 4 numbered sections with an inline pull-quote + an inline hand-rolled SVG figure); the other six render through the same `BlogPostLayout` with `stubBody: true`, collapsing `BlogPostBody` to a lead paragraph + a `Full article forthcoming.` caption. `BlogRailToc` is the **third** structural mirror of the slice-006 `FaqScrollSpyRail` and slice-009 `TocRail` (verbatim IO config, `[data-blog-section]` selector, current-location nav ARIA, modifier-key short-circuit, mobile-pill auto-scroll); the tracked follow-up to extract a shared `SectionScrollSpyRail` now grows from two to three structural mirrors. Filter-chip state ownership transposes the slice-008 `ContactForm` precedent: `BlogArticleGrid` owns `useState<BlogCategory | "all">("all")` and `BlogFilterChips` is presentational (the same way `ContactForm` owns `useActionState` and `ContactFormSuccess`/`ContactFormError` are presentational). All 7 article slugs prerender as `○ Static`; unknown slugs call `notFound()`. **Zero new top-level dependencies** (hand-rolled IO + hand-rolled SVG figure + pre-formatted `displayDate` strings — no recharts, no chart.js, no date library). **Zero edits to slice-005/006/008/009 files** other than the wholesale rewrite of the soft-404 `/blog/page.tsx` stub.

## Technical Context

**Language/Version**: TypeScript 5.8.x strict, React 19.1.0, Next.js 15.5.18 (App Router), Node 20.

**Primary Dependencies**: existing — `@bristle/shared` (`SITE_URL` consumed by both new routes' metadata exports), Tailwind v4, `next/font/google`, `lucide-react@1.16.0` (existing; not consumed this slice unless added for a mobile-pill chevron — see decision §6), `@radix-ui/react-accordion` (slice 006, unused this slice), `resend` + `zod` (slice 008, unused this slice), the `LegalLayout` / `TocRail` family from slice 009 (referenced only as structural precedent — **not** imported, **not** modified). **No new runtime dep.** `BlogRailToc` is a hand-rolled `IntersectionObserver` per slice-006 + slice-009 precedent (no scroll-spy library). `InlineFigure` is a hand-rolled inline SVG (no recharts / chart.js / victory / nivo / echarts).

**Storage**: N/A — all 8 pages are content-static. No schema change, no new query helper, no `@bristle/db` touch.

**Testing**: gates only (typecheck/lint/build, greps, route 200 + meta-tag curl, bundle budgets, filter-chip interaction walk, scroll-spy walk on the featured article, deep-link anchor check, responsive sweep, visual diff vs `design/Public_pages.pdf` pp. 5 + 6 at 1280, regression check on slice-005 nav "Blog" link). No Vitest/Playwright wired (same as slices 005 / 006 / 007 / 008 / 009).

**Target Platform**: Web (Vercel preview + production).

**Performance Goals (binding, CLAUDE.md §5)**: Lighthouse ≥ 90 Performance / Accessibility / Best Practices on `/blog` and on the featured-article route on local prod (SEO ≥ 90 on local; SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact and not a regression); First-Load JS < 180 KB gz **per route** for all 8 new routes. Expected: `/blog` ~115-120 KB (heavier than `/terms` at ~107 KB because `BlogArticleGrid` owns state, renders 7 cards, and houses `BlogFilterChips`); `/blog/[slug]` ~110-115 KB (TopNav + `BlogRailToc` ~1-2 KB compiled; close to `/terms` size).

**Constraints**: zero hex literals, zero font-family literals in any new file; voice CLAUDE.md §6 (no `!`, no emoji, no "amazing/awesome") on all visible prose; no `localStorage`; WCAG 2.2 AA — semantic headings (h1 in `BlogHero` for `/blog`; h1 in `BlogPostHero` for `/blog/[slug]`; h2 per article card and per BlogArticleSection); `<nav aria-label>` wrap on `BlogRailToc` with `aria-current="location"` on active anchor (slice-009 pattern); `role="toolbar"` (or `role="group"` with `aria-label`) on `BlogFilterChips` with `aria-pressed` per chip (decision §7); focus rings visible; only `BlogFilterChips`, `BlogArticleGrid`, `BlogRailToc` carry `"use client"` — all other new components are Server Components or server-only modules.

**Scale/Scope**: 2 new routes; **~19 new files** (1 type module + 1 data store + 10 server components + 3 client components + 1 server layout + 2 route files — see §"Project Structure"); 0 new top-level deps; **1 existing-on-main file rewritten** (`apps/web/src/app/blog/page.tsx`, the slice-005 `ComingSoon` stub → the full Blog index per FR-001); 0 other edits to existing-on-main files. The Blog index's `BlogArticleGrid` is non-trivial (renders all 7 cards, owns filter state, conditionally hides cards on filter change); the featured article's `BlogPostBody` renders 4 sections + inline pull-quote + inline SVG figure. Slice 010 has the largest client-component interaction surface in Tier 2 so far.

## Constitution Check

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | No new dependency. `IntersectionObserver` is a platform API, not a library. Inline SVG `<path>`, `<rect>`, `<text>` are platform primitives. `aria-pressed` / `aria-current="location"` / `role="toolbar"` are W3C ARIA attributes. The slice-009 plan §D6 precedent for `BlogRailToc` is structural (same rootMargin / threshold / topmost-visible resolution) — no new library, no new abstraction this slice. |
| §4 Tokens exact | PASS | All color/type/spacing/radii/motion via tokens. `BlogFilterChips` active state = `bg-text-primary text-surface-card` (same dark-pill recipe as slice-009 TocRail mobile pill row); inactive state = `border-border-default bg-surface-card text-text-secondary`. `BlogRailToc` active state = `border-l-2 border-accent-bristle` (desktop) + filled pill (mobile) — verbatim slice-009 token names. Inline SVG colors resolve via Tailwind utility classes on the SVG element or via `var(--color-...)` references — no inline `stroke="#C2410C"`. Pill radius = `rounded-pill` (999px from §4.4). Card radius = `rounded-card` (8px). Zero hex literals (SC-027), zero font-family literals (SC-027). |
| §5 Conventions + floors | PASS | Server Components default; client surface = **three** named files (`blog-filter-chips.tsx`, `blog-article-grid.tsx`, `blog-rail-toc.tsx`) — one more than slice 009 (added the chip + grid pair) because Tier-2 4 introduces the first stateful index UI in the product. Kebab-case files / PascalCase components; Tailwind only; no `localStorage`; voice rules applied to all visible prose; perf/a11y floors explicit (SC-019, SC-020); WCAG 2.2 AA via semantic headings + `aria-current` / `aria-pressed` + focus rings; reduced-motion respected in `BlogRailToc`. |
| §6 Voice | PASS | All visible prose authored to voice (plain-spoken, no `!`/emoji/hype). Em-dashes are punctuation, not exclamations. The featured-article prose uses apostrophe-quote constructs (`'look at trends.'`, `"yes, but not here"`) and the dollar-sign in article 3's title (`$4M in unmet demand`) — both are punctuation, not voice violations. The `[PLACEHOLDER]` header on `blog-articles.ts` never renders. Voice grep clean on the rendered output (SC-027). |
| §8 Repo structure | PASS | Page-local section components under `apps/web/src/components/blog/` (new directory; mirrors slice-005 `landing/`, slice-006 `pricing/` / `faq/`, slice-008 `about/` / `contact/`, slice-009 `legal/`). Content data colocated with consumers. Two route files at `apps/web/src/app/blog/page.tsx` (rewrite) and `apps/web/src/app/blog/[slug]/page.tsx` (new). No `lib/` change (no new infra module this slice). |
| §9 Never-do | PASS | No edits to `design/`, no edits to PDFs/docs; spec→plan→tasks→implement honored; building exactly the spec; **slice-005 nav and footer untouched** (FR-030 — top-nav and site-footer hrefs already point at `/blog` and the secondary article slugs are new, so no edit needed; verified via grep at plan time); **slice-006 pricing/FAQ untouched** (including `FaqScrollSpyRail` — `BlogRailToc` is a structural mirror in a separate file, not a refactor); **slice-008 about/contact untouched**; **slice-009 legal untouched** (including `TocRail` — `BlogRailToc` is a structural mirror in a separate file, not a refactor); no `localStorage`. The slice-005 `/blog/page.tsx` ComingSoon stub IS rewritten wholesale — this is the only existing-file change permitted by FR-001 / FR-030 and is the wholesale-replacement precedent slice 006 (`/pricing` stub → real) and slice 008 (`/about` stub → real) already established. |
| §10 Ambiguity | PASS | All 7 clarifications resolved in the spec (a-g per spec §Clarifications); no NEEDS CLARIFICATION markers remain. |

**Result**: PASS. Zero new top-level dependencies, zero edits to shipped slices other than the documented `/blog/page.tsx` wholesale rewrite. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/010-blog/
├── spec.md              # done (all 7 clarifications resolved)
├── plan.md              # this file
├── research.md          # Phase 0 — the 16 decisions
├── contracts/
│   └── ui-and-db.md     # Phase 1 — content-data shapes inline + BlogArticle type + BlogRailToc signature + route metadata shape
├── quickstart.md        # Phase 1 — gate recipe + SC mapping
├── checklists/
│   └── requirements.md  # passing
└── tasks.md             # Phase 2 — NOT created here
```

No `data-model.md` (per user direction — no schema change, no new DB shape; content-data shapes documented inline in `contracts/ui-and-db.md` instead).

### Source Code (exact file tree of additions)

```text
apps/web/src/
├── app/
│   └── blog/
│       ├── page.tsx                                # REWRITE — slice-005 ComingSoon stub → full Blog index (FR-001)
│       └── [slug]/
│           └── page.tsx                            # ADD — async Server Component, generateStaticParams + generateMetadata + BlogPostLayout
└── components/
    └── blog/
        ├── types.ts                                # ADD — BlogCategory + BlogArticle + BlogArticleSection + BlogPullQuote + BlogFigure + BlogTocItem shapes
        ├── blog-articles.ts                        # ADD — BLOG_ARTICLES: BlogArticle[] (7 entries — 1 featured full body + 6 stub leads, [PLACEHOLDER] header)
        ├── blog-hero.tsx                           # ADD — server component (BRISTLE BLOG eyebrow + Field Notes serif h1 + subhead)
        ├── blog-filter-chips.tsx                   # ADD — client component ("use client", presentational; 5 chips; aria-pressed)
        ├── blog-featured-card.tsx                  # ADD — server component (featured card with IN THIS ISSUE pull-quote callout)
        ├── blog-article-card.tsx                   # ADD — server component (secondary card; <article> with h2 link)
        ├── blog-article-grid.tsx                   # ADD — client component ("use client"; owns useState<BlogCategory|"all">; houses chips + featured + 6 cards)
        ├── blog-post-hero.tsx                      # ADD — server component (eyebrow + serif h1 + meta row + initials avatar)
        ├── blog-post-body.tsx                      # ADD — server component (branches on stubBody; renders lead + sections + InlinePullQuote/InlineFigure OR stubLead + "Full article forthcoming.")
        ├── inline-pull-quote.tsx                   # ADD — server component (serif <blockquote> + attribution)
        ├── inline-figure.tsx                       # ADD — server component (eyebrow + hand-rolled inline SVG line chart + caption)
        ├── blog-rail-toc.tsx                       # ADD — client component ("use client", IntersectionObserver, [data-blog-section] selector, current-location nav)
        ├── try-bristle-card.tsx                    # ADD — server component (TRY BRISTLE eyebrow + serif headline + Start free CTA → /signup)
        └── blog-post-layout.tsx                    # ADD — server component (TopNav + 2-col body wrapping BlogPostHero + BlogPostBody + BlogRailToc + TryBristleCard + SiteFooter)
```

**One modification to existing-on-main files**: `apps/web/src/app/blog/page.tsx` is rewritten wholesale (FR-001 — slice-005 `ComingSoon` stub → full Blog index per `design/Public_pages.pdf` page 5). All other existing-on-main files (top-nav, site-footer, all slice-005/006/008/009 component dirs and lib modules) are **unchanged**. Verified via grep at plan time:

```
$ grep -n '"/blog"\|/blog/' apps/web/src/components/landing/top-nav.tsx apps/web/src/components/landing/site-footer.tsx
apps/web/src/components/landing/top-nav.tsx:5:  { label: "Blog", href: "/blog" },
apps/web/src/components/landing/site-footer.tsx:17:      { label: "Blog", href: "/blog" },
```

Both already point at `/blog`; the link flips from a known-out-of-scope soft-404 (the slice-005 `ComingSoon` stub) to the live Blog index the moment slice 010 ships. **No edit to top-nav.tsx or site-footer.tsx** (FR-030, SC-022).

**Structure Decision**: page-local section components under `apps/web/src/components/blog/` follows the slice-005/006/008/009 precedent (`landing/`, `pricing/`/`faq/`, `about/`/`contact/`, `legal/`). The two route files at `apps/web/src/app/blog/page.tsx` (rewrite) and `apps/web/src/app/blog/[slug]/page.tsx` (new) follow Next.js App Router conventions. The `[slug]` dynamic segment + `generateStaticParams` is the canonical Next.js pattern for "many static pages from one route file"; statically prerenders all 7 article routes at build time (○ Static, per FR-027 / SC-021).

---

## The 16 required decisions

### 1. Composition — **confirmed: index = async SC + 1 client wrapper; post = async SC + shared layout + 1 client rail**

**`/blog` index**:

```tsx
// apps/web/src/app/blog/page.tsx (sketch — REWRITE; replaces slice-005 ComingSoon stub)
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { TopNav } from "@/components/landing/top-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { BlogHero } from "@/components/blog/blog-hero";
import { BlogArticleGrid } from "@/components/blog/blog-article-grid";
import { BLOG_ARTICLES } from "@/components/blog/blog-articles";

export const metadata: Metadata = { /* per decision §10 */ };

export default async function BlogIndex() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid pb-section">
        <BlogHero />
        <BlogArticleGrid articles={BLOG_ARTICLES} />
      </main>
      <SiteFooter />
    </>
  );
}
```

The route is async-but-trivial (no awaits in v1; the `async` keeps the file type-compatible with Next.js's async-component default and leaves room for future per-render reads without an API change). `BlogArticleGrid` is the single client component on `/blog`; it houses `BlogFilterChips` + `BlogFeaturedCard` + the 6-card grid AND owns the filter state — see decision §5.

**`/blog/[slug]` post**:

```tsx
// apps/web/src/app/blog/[slug]/page.tsx (sketch — NEW)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@bristle/shared";
import { BlogPostLayout } from "@/components/blog/blog-post-layout";
import { BLOG_ARTICLES } from "@/components/blog/blog-articles";

interface Params { slug: string }

export async function generateStaticParams(): Promise<Array<Params>> {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));   // 7 entries
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};                                 // notFound() handles 404 in default export
  return { /* per decision §10 */ };
}

export default async function BlogPost(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();
  return <BlogPostLayout article={article} />;
}
```

`BlogPostLayout` is the single Server Component composing the page chrome (`TopNav` reused + 2-col body wrapping `BlogPostHero` + `BlogPostBody` + `BlogRailToc` + `TryBristleCard` + `SiteFooter` reused). It's a separate component so the structural shape (especially the 2-col grid + sticky rail placement) lives in one place, even though both the featured article and the 6 stubs render through it.

**Rationale**: maps 1:1 to spec sections + 4px gates against `design/Public_pages.pdf` pages 5 (index) and 6 (post). Two compositions are the right granularity — collapsing them into one shared layout component would force conditional chrome (the index has no rail, no two-col body) and create a layout with too many props. Two distinct compositions, each in their respective `page.tsx`, are the cleanest expression.

**Alternatives considered**:
- Pass the article into `BlogPostLayout` via a context provider (rejected — adds a Provider component for zero benefit; props are simpler at this depth).
- Inline `BlogPostLayout`'s JSX directly in `/blog/[slug]/page.tsx` (rejected — couples route-level metadata logic with layout chrome; the two are independent concerns and benefit from separation).
- Compose `/blog`'s index inline without `BlogArticleGrid` and put the filter chips at the route level (rejected — would force `/blog/page.tsx` to be a client component since it owns `useState`; the wrapper-grid pattern keeps the route as a Server Component and isolates the client boundary to `BlogArticleGrid`).

**Files for `/blog` index** (5 imports): `top-nav`, `site-footer`, `blog-hero` (server), `blog-article-grid` (client — internally renders `blog-filter-chips`, `blog-featured-card`, `blog-article-card`), `blog-articles` (data).

**Files for `/blog/[slug]` post** (3 imports + 1 from next): `next/navigation` (`notFound`), `blog-post-layout` (server — internally renders `blog-post-hero`, `blog-post-body`, `blog-rail-toc`, `try-bristle-card`, plus `top-nav` and `site-footer`), `blog-articles` (data), `@bristle/shared` (`SITE_URL`).

### 2. Server vs Client boundary — **confirmed: 3 client files, all other new files are Server / data / type modules**

Only these three files under `apps/web/src/components/blog/` carry `"use client"`:
- `blog-filter-chips.tsx` — uses no React state itself; receives `selectedCategory` + `onSelectCategory` as props. It's a client component **only** because it's a child of `BlogArticleGrid` rendered with `onClick` handlers that mutate the parent's state. (A presentational client component, in the React 19 sense.)
- `blog-article-grid.tsx` — owns `useState<BlogCategory | "all">("all")`; this is the only state owner on `/blog`.
- `blog-rail-toc.tsx` — uses `useState` (active section), `useEffect` (IntersectionObserver setup + mobile-pill scroll), `useRef<Map>` for IO tracking + mobile-pill ref Map. Verbatim shape of slice-009 `TocRail`.

Every other new file:
- The two route entries (`/blog/page.tsx`, `/blog/[slug]/page.tsx`) — async Server Components.
- `BlogPostLayout`, `BlogHero`, `BlogFeaturedCard`, `BlogArticleCard`, `BlogPostHero`, `BlogPostBody`, `InlinePullQuote`, `InlineFigure`, `TryBristleCard` — Server Components.
- `types.ts` — pure TS module (types only, no runtime).
- `blog-articles.ts` — pure TS module (a single typed constant; no runtime logic).

**Net: 3 client files, 13 other new files + 1 rewrite + 1 type module + 1 data module.** Verifiable by `grep -l "use client" apps/web/src/components/blog/ apps/web/src/app/blog/page.tsx apps/web/src/app/blog/\[slug\]/page.tsx` returning exactly three files (FR-026 / SC-025).

**Rationale**: same posture as slice 006 (1 client: FAQ rail), slice 008 (1 client: ContactForm), slice 009 (1 client: TocRail) — but slice 010 has the first stateful index UI in the product, which is what pushes the count from 1 → 3 client files. The split is principled — `BlogArticleGrid` owns state, `BlogFilterChips` is a presentational child of the grid (analogous to how slice-008 `ContactFormSuccess` / `ContactFormError` are presentational children of `ContactForm`), and `BlogRailToc` is the unrelated scroll-spy client component on the post route.

**Alternatives considered**:
- Lift the filter state to a parent client wrapper component sitting above both chips and grid (rejected — adds a fourth client file for no benefit; the grid IS the parent already and naturally owns the state).
- Store filter state in URL search params via `useSearchParams` (rejected — heavier, requires `next/navigation` router work, forces all consumers to suspend, not in the design contract).

### 3. `BlogArticle` type shape — **confirmed (verbatim) with `ReadonlyArray` + an optional `pullQuote` on the featured article**

```ts
// apps/web/src/components/blog/types.ts (sketch)

export type BlogCategory =
  | "data-analysis"
  | "product-strategy"
  | "indie-hacker"
  | "devtools";

export interface BlogPullQuote {
  text: string;
  attribution: string;                                  // e.g. "— from the analysis"
}

export interface BlogFigure {
  eyebrow: string;                                      // e.g. "FIGURE 1 · WONTFIX CLOSURES BY CATEGORY"
  caption: string;                                      // e.g. "Devtools and developer-experience closures grew 4.1× while infrastructure stayed flat."
  placeholderText?: string;                             // optional alt-text-like hint for code reviewers, NEVER rendered
}

export interface BlogArticleSection {
  id: string;                                           // e.g. "scope-refusals" — anchor target + [data-blog-section] marker
  title: string;                                        // full title rendered as <h2>; e.g. "One: most refusals are about scope, not capability."
  railTitle?: string;                                   // OPTIONAL shortened form for BlogRailToc; e.g. "Scope refusals" (see decision §4)
  paragraphs: ReadonlyArray<string>;                    // 1+ verbatim paragraphs
  pullQuote?: BlogPullQuote;                            // inline pull-quote; renders BETWEEN paragraph index 0 and 1 (see BlogPostBody)
  figure?: BlogFigure;                                  // inline figure; renders AFTER all paragraphs in the section
}

export interface BlogArticle {
  slug: string;                                         // kebab-case; matches /blog/{slug} route
  category: BlogCategory;
  date: string;                                         // ISO "yyyy-mm-dd" — for sorting / comparison
  displayDate: string;                                  // pre-formatted "MAY 8 2026" — for rendering (per clarification g; FR-022)
  title: string;
  summary: string;                                      // 2-line card preview + <meta description>
  authorName: string;                                   // always "Cornel Okoth" this slice (clarification f / FR-021)
  authorInitials: string;                               // always "CO" this slice
  readTimeMinutes: number;                              // e.g. 9
  featured: boolean;                                    // exactly one true in BLOG_ARTICLES
  stubBody: boolean;                                    // 6 true (stub treatment), 1 false (full featured body)
  pullQuote?: BlogPullQuote;                            // ONLY on the featured article — drives the IN THIS ISSUE callout on the index
  body: {
    lead: ReadonlyArray<string>;                        // 2 paragraphs for the featured article; ignored when stubBody is true
    stubLead?: string;                                  // single paragraph for stub articles; ignored when stubBody is false
  };
  sections: ReadonlyArray<BlogArticleSection>;          // 4 entries for the featured article; empty for stub articles
}

export interface BlogTocItem {                          // minimal projection consumed by BlogRailToc
  id: string;
  displayTitle: string;                                 // derived from section.railTitle ?? section.title (see decision §4)
}
```

**Confirmations from your draft**:
- Both `date` (ISO) and `displayDate` (pre-formatted) live on each article as fixed strings. No runtime `Intl.DateTimeFormat`. Avoids any locale drift between SSR and hydration (FR-022, clarification (g)).
- `pullQuote` on the article (not on a section) drives the index's `IN THIS ISSUE` callout box on `BlogFeaturedCard`. The featured article also has its first section carry an inline `pullQuote` on the section itself — these are **two separate fields** because (a) the index callout could quote a different line than any section's inline quote, and (b) section pull-quotes are scoped to a specific paragraph break, the index callout is page-level. The brief's scope §10 says both quote the same line — that's a content coincidence, not a type constraint.
- `featured: boolean` and `stubBody: boolean` are independent flags. Per FR-019, in `BLOG_ARTICLES` exactly one has `featured: true, stubBody: false` and six have `featured: false, stubBody: true` — but the type allows other combinations should the editorial program later ship multiple featured articles or a real-body article that isn't featured on the index.
- `ReadonlyArray<T>` on `paragraphs`, `sections`, `body.lead` — matches the `as const` discipline of slices 006/008/009.

**Refinement vs your draft**: added optional `railTitle?: string` on each `BlogArticleSection` (per decision §4 / clarification (c) on TOC display title). Your draft didn't include it explicitly; I'm pinning it to option (a) — co-located override — per the user's recommendation.

**Alternatives considered**:
- Use `Date` objects instead of string `date` (rejected — JSON-serializable string is cleaner, no time-zone semantics needed).
- Inline the `BlogArticleSection` shape into `BlogArticle` directly (rejected — composability and readability favor a named interface).
- Make `body.lead` a single string instead of `ReadonlyArray<string>` (rejected — the featured article's lead is 2 paragraphs; an array is the natural fit).

### 4. `BlogArticleSection` shape + `BlogTocItem` projection — **confirmed: option (a) — explicit `railTitle?` override on the section**

The featured article's section titles are intentionally long ("One: most refusals are about scope, not capability."), which doesn't fit cleanly in a sidebar TOC. The rail needs shorter labels ("Scope refusals", "Comment count", "Willingness-to-pay", "Method & data").

**Decision**: each `BlogArticleSection` carries an optional `railTitle?: string`. The projection function in `BlogPostLayout` (see below) reads `section.railTitle ?? section.title` to populate `BlogTocItem.displayTitle`:

```ts
// apps/web/src/components/blog/blog-post-layout.tsx (sketch — projection logic)
const tocItems: BlogTocItem[] = article.sections.map((s) => ({
  id: s.id,
  displayTitle: s.railTitle ?? s.title,
}));
```

In `blog-articles.ts`, the featured article's sections set `railTitle` explicitly:

```ts
{
  id: "scope-refusals",
  title: "One: most refusals are about scope, not capability.",
  railTitle: "Scope refusals",
  paragraphs: [...],
  pullQuote: { ... },
  figure: { ... },
},
// ... etc
```

**Rationale (your recommendation honored)**: explicit beats magical. A founder editing the article can change both the long title and the rail title in one place. A derivation rule like "split on the first colon and take the right side" would be brittle (section 4 title is `Method & data.` with no colon — would fall back to the full title, which works here but only by coincidence; section 1's `One: most refusals are about scope, not capability.` would yield `most refusals are about scope, not capability.` which is still too long for the rail). Explicit `railTitle?` is the right primitive.

The `?` (optional) is meaningful: any section that ships without a `railTitle` falls back to the full `title`. Slice 010 only has the 4 featured-article sections that need shortening; stub articles have `sections: []` so this never comes up for them. Future articles authored without rail shortening (e.g. naturally short section titles) don't need to set `railTitle`.

**`BlogTocItem` shape**: minimal `{id, displayTitle}`. Note this differs from slice-009 `TocItem` (which carries `{id, number, title}`) because legal pages render numbered sections (`1. Overview`, `2. Acceptable use`, ...) in the rail, whereas blog post sections aren't numbered in the rail — the rail shows the bare `displayTitle`. Slice-010 sections are numbered in the article body (the title text itself starts with `One:`, `Two:`, `Three:`, `Method & data.`) but the rail labels strip that.

**Alternatives considered**:
- Derive `displayTitle` from `title` via a heuristic at projection time (rejected — see rationale; brittle, magical, unclear what "shorten" means).
- Co-locate `displayTitle` on a separate `tocConfig` array per article (rejected — duplicates the section id list, must stay in sync manually, drift risk).
- Make `railTitle` required on every section (rejected — adds noise for sections that don't need shortening; the `??` fallback is exactly the right ergonomics).

### 5. `BlogFilterChips` + `BlogArticleGrid` state ownership — **confirmed: BlogArticleGrid owns `useState`; BlogFilterChips is presentational**

```tsx
// apps/web/src/components/blog/blog-article-grid.tsx (sketch — CLIENT COMPONENT)
"use client";

import { useState } from "react";
import type { BlogArticle, BlogCategory } from "./types";
import { BlogFilterChips } from "./blog-filter-chips";
import { BlogFeaturedCard } from "./blog-featured-card";
import { BlogArticleCard } from "./blog-article-card";

interface BlogArticleGridProps {
  articles: ReadonlyArray<BlogArticle>;
}

type Selection = BlogCategory | "all";

export function BlogArticleGrid({ articles }: BlogArticleGridProps) {
  const [selected, setSelected] = useState<Selection>("all");

  const featured = articles.find((a) => a.featured);
  const visible = selected === "all"
    ? articles
    : articles.filter((a) => a.category === selected);
  const showFeaturedSlot = selected === "all" && featured;
  const grid = selected === "all"
    ? visible.filter((a) => !a.featured)         // when "all" is active, featured card is in its own slot; the grid shows the 6 secondaries
    : visible;                                   // when a category is filtered, featured (if it matches) is rendered inline in the grid

  return (
    <>
      <BlogFilterChips selected={selected} onSelect={setSelected} />
      {showFeaturedSlot && <BlogFeaturedCard article={featured!} />}
      <div className="grid gap-grid sm:grid-cols-2 lg:grid-cols-3">
        {grid.map((a) => <BlogArticleCard key={a.slug} article={a} />)}
      </div>
    </>
  );
}
```

**Confirmation**: `BlogArticleGrid` is the parent client component owning `useState<BlogCategory | "all">("all")`. `BlogFilterChips` receives `selected` + `onSelect` as props (presentational). `BlogFeaturedCard` and `BlogArticleCard` are Server Components — but they're imported AND rendered inside a client component. **This is the React Server Components pattern**: Server Components can be passed as children OR imported and rendered by client components, but the moment a Server Component is rendered inside a client tree it's effectively serialized once at SSR + hydrated as static markup. In Next.js 15 App Router, this works correctly with no runtime warning provided the Server Components don't import server-only modules (`fs`, `db`) — which `BlogFeaturedCard` and `BlogArticleCard` don't.

**Single source of truth**: the filter selection lives in exactly one `useState` hook. No context, no prop drilling beyond one level (`BlogArticleGrid` → `BlogFilterChips`).

**Featured article placement under filter**: when `selected === "all"`, the featured article renders in its own `BlogFeaturedCard` slot above the 6-card grid (matching `design/Public_pages.pdf` page 5). When a category filter is active, the featured article is **inlined into the grid** alongside other matching articles — there's no "featured slot under a filter" treatment. This is the simpler and more honest behavior: the filter is a "show only articles in category X" gesture, and the featured article either matches the filter or it doesn't. The `data-analysis` chip will surface the featured article in the grid alongside article 7; the `Devtools` chip will surface only article 4.

**Rationale**: transposes the slice-008 `ContactForm` precedent (the form owns `useActionState`, the success/error children are presentational). Single state owner, one-level prop pass, no context. The pattern scales: when slice 2.5 ships the Changelog with date-range filters, the changelog grid can own its filter state the same way.

**Alternatives considered**:
- Move filter state to URL `?category=` query param (rejected — heavier; not in design contract; clarification (b) recommendation honored).
- Make `BlogFilterChips` its own stateful wrapper that emits a `CustomEvent` (rejected — DOM events for component-internal state is anti-pattern).
- Wrap chips and grid in a React Context provider (rejected — overkill at this depth; props are clearer and faster).

### 6. `BlogRailToc` IntersectionObserver config — **confirmed: structural mirror of slice-009 `TocRail`**

The slice-009 `TocRail` is the most-recent precedent and is verbatim-correct (slice-009 plan §D6 / `apps/web/src/components/legal/toc-rail.tsx` lines 1-120 — read in full at plan time). `BlogRailToc` is the **third** structural mirror of the same pattern (slice-006 `FaqScrollSpyRail`, slice-009 `TocRail`, now slice-010 `BlogRailToc`). The exact configuration:

```ts
// apps/web/src/components/blog/blog-rail-toc.tsx (sketch — CLIENT)
"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { BlogTocItem } from "./types";

// IntersectionObserver config — verbatim from slice-009 TocRail per slice-010
// plan §D6 (the tracked follow-up now grows to dedupe THREE structural mirrors
// — FaqScrollSpyRail / TocRail / BlogRailToc — into a shared SectionScrollSpyRail
// in a future refactor slice).
const ROOT_MARGIN = "-80px 0px -55% 0px";
const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_MQ = "(min-width: 768px)";

interface BlogRailTocProps {
  items: ReadonlyArray<BlogTocItem>;
  ariaLabel?: string;
}

export function BlogRailToc({ items, ariaLabel = "Sections of the article" }: BlogRailTocProps) {
  if (items.length === 0) return null;                                         // stub-body articles — see decision §12

  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const visibleSections = useRef<Map<string, number>>(new Map());
  const mobilePillRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-blog-section]");
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleSections.current.set(id, entry.boundingClientRect.top);
          } else {
            visibleSections.current.delete(id);
          }
        }
        if (visibleSections.current.size === 0) return;                        // no-flicker preserve-active branch
        let topId: string | null = null;
        let topY = Infinity;
        for (const [id, y] of visibleSections.current) {
          if (y < topY) { topY = y; topId = id; }
        }
        if (topId) setActive(topId);
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {                                                            // mobile pill auto-scroll
    if (window.matchMedia(DESKTOP_MQ).matches) return;
    const pill = mobilePillRefs.current.get(active);
    if (!pill) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    pill.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [active]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;        // modifier-key passthrough
    e.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav aria-label={ariaLabel}>
      {/* Desktop sticky vertical rail (md+) */}
      <ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">
        {/* anchors per item, active = border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary */}
      </ul>
      {/* Mobile horizontal pill row (below md) */}
      <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
        {/* anchors per item, active = bg-text-primary text-surface-card rounded-pill */}
      </ul>
    </nav>
  );
}
```

**All four IO + scroll + ARIA invariants from slice-009 are honored verbatim**:
- **`rootMargin: "-80px 0px -55% 0px"`, `threshold: 0`** — exactly as slice 006 / 009 (top inset clears the TopNav; bottom inset biases active to upper-middle).
- **Selector `[data-blog-section]`** — distinct from `[data-faq-item]` (slice 006) and `[data-legal-section]` (slice 009), so the three rails never cross-observe.
- **`useState<string>(items[0]?.id ?? "")` initial** — first section's `id` is active pre-IO; same flicker fix as slice-009 plan §D6 / line 24 of `toc-rail.tsx`.
- **`Map<string, number>` ref + linear scan** for topmost-visible — identical to slice-009 lines 26-65.
- **`matchMedia("(prefers-reduced-motion: reduce)").matches` read fresh** in both `handleClick` (line 85) and the mobile-pill `useEffect` keyed on `[active]` (line 70) — slice-009 pattern, no caching.
- **Modifier-key short-circuit** (`e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0`) — verbatim slice-009 line 88; preserves Cmd-click new tab, middle-click, Shift-click selection.
- **ARIA**: single `<nav aria-label="Sections of the article">` wrapping both the desktop and mobile lists; anchors are plain `<a href="#{id}">` with `aria-current={isActive ? "location" : undefined}`. **NO `role="tablist"`**, NO `role="tab"`, NO `aria-selected`. Same as slice 009 (the slice-006 STOP-2 semantic correction was carried into slice 009 from day one; slice 010 inherits it the same way).

**One semantic refinement vs slice 009**: the `aria-label` string is `"Sections of the article"` (article-scoped) instead of `"Sections of the page"` (page-scoped). The blog post route's page-level navigation is the TopNav; the rail navigates **within** the article. The two labels coexist on the same page (TopNav `aria-label="Primary"`, BlogRailToc `aria-label="Sections of the article"`); both should be distinct so screen reader users hear unambiguous landmark labels.

**Empty-items branch**: `BlogRailToc` returns `null` when `items.length === 0` (stub-body articles, where `article.sections.length === 0` → projected `tocItems` is empty). The right column on stub articles renders only `TryBristleCard`. See decision §12 for the layout consequence.

**Tracked follow-up updated**: from slice-009's "extract `FaqScrollSpyRail` (006) + `TocRail` (009) into a shared `SectionScrollSpyRail`" to "extract `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) into a shared `SectionScrollSpyRail` in a future refactor slice." Three structural mirrors now exist; the refactor pressure is real but still NOT done this slice — would expand additive-only scope into a multi-component refactor with regression risk on two shipped rails.

**Rationale**: same as slice 009 — re-deriving the IO config from scratch would risk regressing two slices of iteration; the structural mirror is **intentional** per FR-013; the shared abstraction is a future-slice problem.

### 7. `BlogFilterChips` ARIA pattern — **confirmed: Pattern A (`role="toolbar"` or `role="group"` with `aria-pressed` per chip)**

```tsx
// apps/web/src/components/blog/blog-filter-chips.tsx (sketch — CLIENT, presentational)
"use client";

import type { BlogCategory } from "./types";

const CHIPS: ReadonlyArray<{ value: BlogCategory | "all"; label: string }> = [
  { value: "all",              label: "All" },
  { value: "data-analysis",    label: "Data analysis" },
  { value: "product-strategy", label: "Product strategy" },
  { value: "indie-hacker",     label: "Indie hacker" },
  { value: "devtools",         label: "Devtools" },
];

interface BlogFilterChipsProps {
  selected: BlogCategory | "all";
  onSelect: (next: BlogCategory | "all") => void;
}

export function BlogFilterChips({ selected, onSelect }: BlogFilterChipsProps) {
  return (
    <div role="toolbar" aria-label="Filter articles by category" className="flex flex-wrap gap-tight">
      {CHIPS.map((chip) => {
        const isSelected = selected === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(chip.value)}
            className={
              isSelected
                ? "rounded-pill bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                : "rounded-pill border border-border-default bg-surface-card px-snug py-1 text-body-sm text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            }
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
```

**Decision**: Pattern A — `role="toolbar"` (or `role="group"`) wrapping a row of `<button>` elements; each chip carries `aria-pressed={isSelected}`. The toolbar/group has `aria-label="Filter articles by category"`. **Active chip** = filled dark pill (`bg-text-primary text-surface-card`); **inactive** = outlined pill (`border-border-default bg-surface-card text-text-secondary`).

**Why Pattern A over Pattern B (`role="radiogroup"` + `role="radio"`)**:
- `radiogroup` implies "exactly one of N siblings is selected at any time, and selection is mutually exclusive". The `All` chip violates this — it's a **meta-state** (show everything), not a sibling category. A radiogroup pattern would force `All` to be the "default" radio that gets re-checked on every other chip's deselect, which is not how radio groups work semantically.
- Pattern A's `<button aria-pressed>` is the canonical W3C pattern for **toggle buttons**, and the WAI-ARIA Authoring Practices Guide explicitly covers it under "Toolbar Pattern" for filter UIs. Screen readers announce "pressed" / "not pressed" on each chip, which is the accurate description.

**Keyboard interaction** (FR-005 / AC US4-7): Tab enters the toolbar at the first chip; subsequent Tabs move between chips in DOM order; `Enter` and `Space` activate (fire the `onClick`). No roving tabindex, no arrow-key navigation — those are tablist patterns. Each chip is a regular tab stop.

**Rationale (your recommendation honored)**: Pattern A is the semantically correct match for a filter that includes a meta-state. The toolbar role groups the chips for screen readers without imposing tabs-style behavior. Same posture as slice-006 STOP-2's correction of the FAQ rail from `role="tablist"` to current-location nav — get the ARIA right from day one.

**Alternatives considered**:
- Pattern B (`role="radiogroup"`) — rejected per above.
- No grouping role, just `<button aria-pressed>` siblings (rejected — screen readers don't announce "filter group" context; the toolbar grouping is the accessibility affordance for the "this is a related set of toggles" semantic).
- Use links (`<a>`) with URL `?category=` — rejected per decision §5.

### 8. `InlineFigure` — **confirmed: hand-rolled inline SVG line chart, tokens-only, ~200px tall**

```tsx
// apps/web/src/components/blog/inline-figure.tsx (sketch — server component)
import type { BlogFigure } from "./types";

interface InlineFigureProps { figure: BlogFigure; }

export function InlineFigure({ figure }: InlineFigureProps) {
  return (
    <figure className="my-section flex flex-col gap-tight">
      <p className="font-mono text-body-sm uppercase tracking-wider text-text-secondary">
        {figure.eyebrow}
      </p>
      <svg
        viewBox="0 0 720 200"
        role="img"
        aria-label={figure.caption}
        className="w-full"
        preserveAspectRatio="none"
      >
        {/* Grid lines (5 horizontal) — surface-raised at low opacity */}
        <g className="stroke-border-default opacity-40">
          <line x1="0" y1="40"  x2="720" y2="40"  strokeWidth="1" />
          <line x1="0" y1="80"  x2="720" y2="80"  strokeWidth="1" />
          <line x1="0" y1="120" x2="720" y2="120" strokeWidth="1" />
          <line x1="0" y1="160" x2="720" y2="160" strokeWidth="1" />
          <line x1="0" y1="200" x2="720" y2="200" strokeWidth="1" />
        </g>
        {/* Rising line — accent-bristle stroke, no fill */}
        <path
          d="M 20 170 L 80 165 L 140 155 L 200 150 L 260 138 L 320 130 L 380 115 L 440 100 L 500 85 L 560 65 L 620 45 L 680 30"
          className="stroke-accent-bristle"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Axis ticks (x: 4 labels, y: 3 labels) — text-secondary at body-sm */}
        <g className="fill-text-secondary" fontSize="11">
          <text x="20"  y="195" textAnchor="middle">Q1 ’24</text>
          <text x="220" y="195" textAnchor="middle">Q3 ’24</text>
          <text x="420" y="195" textAnchor="middle">Q1 ’25</text>
          <text x="620" y="195" textAnchor="middle">Q4 ’25</text>
        </g>
      </svg>
      <figcaption className="text-body-sm text-text-secondary">
        {figure.caption}
      </figcaption>
    </figure>
  );
}
```

**Confirmations from your draft**:
- Width 100%, height ~200px via `viewBox="0 0 720 200"` + `preserveAspectRatio="none"` + `className="w-full"`. Renders at intrinsic 720×200 but stretches to container width.
- Rising line path with 12 data points (`M` + 11 `L` commands) — visually represents the trend `Devtools and developer-experience closures grew 4.1×` described in the caption.
- Stroke: `stroke-accent-bristle` Tailwind utility (resolves to `var(--color-accent-bristle)`); fill: `none`; stroke-width: 2.
- Grid: 5 horizontal lines in `stroke-border-default opacity-40`.
- Axis ticks: 4 x-axis labels in `fill-text-secondary` at 11px. No y-axis labels (the chart is decorative; labels would imply false precision).
- Eyebrow (above) + caption (below) render as `<p>` and `<figcaption>` elements **outside** the SVG, in `font-mono text-body-sm uppercase tracking-wider` and `text-body-sm` respectively — both via tokens.
- **No inline hex literals.** `stroke-accent-bristle`, `stroke-border-default`, `fill-text-secondary` are Tailwind utility classes that compile to `stroke: var(--color-accent-bristle);` etc. — token-resolving. The grep gate (SC-027) confirms zero hex in the new file.
- **Accessibility**: SVG carries `role="img"` and `aria-label={figure.caption}` so screen readers announce the chart with the caption text. The `<figcaption>` provides the visible caption.

**Refinement vs your draft**: explicit 12-point path (not 24) — 12 is enough to visually convey "rising" without over-cluttering at small viewports; matches the design's visual density on `design/Public_pages.pdf` page 6.

**Rationale**: the figure is decorative (clarification (e)) — represents what a chart looks like, not real data. The founder swaps to a real chart (recharts or a static SVG export from the actual analysis) before publishing. Hand-rolled SVG keeps the bundle free of chart libraries (`recharts` is ~80 KB, `chart.js` is ~60 KB, both would blow the 180 KB First-Load budget). Tokens-only colors keep §4 discipline intact.

**Alternatives considered**:
- Render a static PNG/JPG asset from `public/` (rejected — adds a binary asset to the repo for placeholder content; harder to iterate; harder to swap to a real chart later).
- Use `next/image` with an SVG file (rejected — no benefit; inline SVG renders at SSR with zero extra bytes).
- Add `recharts` now as the eventual real-chart library (rejected — propose-first rule per §9; can be added in a future content patch when real data lands).

### 9. `generateStaticParams` for `/blog/[slug]` — **confirmed: returns all 7 article slugs from the data store**

```ts
// apps/web/src/app/blog/[slug]/page.tsx (sketch — export)
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}
```

**Decision**: returns `BLOG_ARTICLES.map((a) => ({ slug: a.slug }))` — exactly 7 entries derived directly from the data store, no hardcoded slug list. **Single source of truth** = `blog-articles.ts`; adding an 8th article means adding one entry to the array and the build picks up an 8th static route automatically.

**Build output expectation** (from `next build`):

```
├ ● /blog/[slug]                          ~7.5 kB   115 kB
├   ├ /blog/what-50000-github-issues-reveal-about-developer-pain
├   ├ /blog/three-signals-that-separate-a-product-from-a-feature
├   ├ /blog/how-we-tracked-4m-unmet-demand-developer-tool-60-days
├   ├ /blog/vercel-cold-starts-shared-hosting-cpu-limits
├   ├ /blog/why-pricing-pages-worst-place-discover-demand
├   ├ /blog/field-notes-32-paid-customer-interviews
├   └ /blog/app-store-reviews-most-underused-product-research-surface
```

The `●` marker (not `ƒ`) confirms static generation at build time. Each of the 7 slugs is materialized; not lazily generated on first request. (Next.js 15 marks `generateStaticParams` routes as `●` when all params are returned at build time — equivalent to `○ Static` in the route listing.)

**Rationale**: derives from data; can't drift from `blog-articles.ts`. Same pattern used by Next.js docs for dynamic-from-static routes.

**Alternatives considered**:
- Hardcode the 7 slugs in `generateStaticParams` (rejected — drift risk on future content edits; the data store IS the truth).
- Set `dynamicParams: false` so unknown slugs error out at the framework level instead of calling `notFound()` (rejected — `notFound()` is the canonical Next.js 15 pattern, plays nicely with `not-found.tsx` fallback files; setting `dynamicParams: false` adds friction with no benefit since the runtime guard is the same).

### 10. `generateMetadata` for `/blog/[slug]` — **confirmed: dynamic per-article + `og:type: "article"`**

```ts
// apps/web/src/app/blog/[slug]/page.tsx (sketch — export)
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};  // unknown slug → notFound() handles 404 in default export
  const title = `${article.title} — Bristle`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: article.summary,
    openGraph: {
      title,
      description: article.summary,
      type: "article",                                          // confirmed — semantically correct for blog posts
      url: `${SITE_URL}/blog/${article.slug}`,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  };
}
```

And for `/blog` (static metadata, not generateMetadata):

```ts
// apps/web/src/app/blog/page.tsx (sketch — export)
const TITLE = "Field Notes — Bristle";
const DESCRIPTION = "Research, analysis, and the occasional opinion on building products against evidence.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",                                            // index is a section landing page, not a single article
    url: `${SITE_URL}/blog`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
};
```

**Confirmation of `og:type: "article"` for post pages** (your question): yes. Open Graph's `og:type` vocabulary uses `article` for blog posts, news articles, and other date-stamped editorial content — semantically correct, used by Facebook/Twitter/LinkedIn to render slightly richer cards (sometimes including the byline and published time, depending on the platform). The slice-005 / 006 / 008 / 009 pages all use `type: "website"` because they're product/marketing/legal pages, not editorial articles.

**Per-article OG image deferred** (clarification (d)): all 7 articles share `${SITE_URL}/og-image.png` (the slice-005 brand wordmark + tagline raster). Acceptable for v0.2.0 launch; per-article generation (e.g. via `@vercel/og` showing the article title + author + chart preview) is a future-slice ask.

**No `robots` field** on either route → both indexable by default (FR-029).

**Alternatives considered**:
- `og:type: "blog"` (rejected — not a valid Open Graph type; `article` is the correct one for blog posts).
- Cache the unknown-slug lookup result (rejected — `BLOG_ARTICLES.find` over 7 items is microseconds; caching would add complexity for negligible gain).
- Per-article OG images via `@vercel/og` dynamic image routes (deferred — see clarification (d)).

### 11. `notFound()` pattern — **confirmed: standard Next.js 404 fallback**

```ts
// apps/web/src/app/blog/[slug]/page.tsx (sketch — default export)
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();                              // → next/navigation
  return <BlogPostLayout article={article} />;
}
```

**Decision**: `notFound()` from `next/navigation` — produces the Next.js default 404 page. No custom `/blog/[slug]/not-found.tsx` authored this slice. The eventual Tier-7 polish slice ships a Bristle-voiced 404 (the design `design/System_pages.pdf` page 1 mockup: *"We searched 142,318 problems. None of them were this page."*).

**Rationale**: minimum viable behavior — visitors hitting `/blog/this-slug-does-not-exist` see the framework default, which is functional but unstyled. The custom 404 is a system-pages slice (out-of-scope per spec §"Out of scope"). Slice 010 doesn't ship Bristle-voiced 404 chrome.

**Alternatives considered**:
- Ship a custom `not-found.tsx` for the blog segment this slice (rejected — scope creep; the eventual Tier-7 system pages slice will ship a single global Bristle-voiced 404 that covers all routes; building a blog-specific one now would be wasted work).
- Throw an error instead of `notFound()` (rejected — `notFound()` is the canonical Next.js 15 pattern; throws would produce a 500 instead of a 404).

### 12. `BlogPostBody` branching on `stubBody` + rail behavior on stubs — **confirmed: branch in body; rail returns null**

```tsx
// apps/web/src/components/blog/blog-post-body.tsx (sketch — server component)
import type { BlogArticle } from "./types";
import { InlinePullQuote } from "./inline-pull-quote";
import { InlineFigure } from "./inline-figure";

interface BlogPostBodyProps { article: BlogArticle; }

export function BlogPostBody({ article }: BlogPostBodyProps) {
  if (article.stubBody) {
    return (
      <div className="flex flex-col gap-grid">
        {article.body.stubLead && (
          <p className="font-serif text-body-lg leading-relaxed">{article.body.stubLead}</p>
        )}
        <p className="italic text-body-md text-text-secondary">
          Full article forthcoming.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section">
      {/* 2-paragraph lead (featured article) */}
      <div className="flex flex-col gap-grid">
        {article.body.lead.map((p, i) => (
          <p key={i} className="font-serif text-body-lg leading-relaxed">{p}</p>
        ))}
      </div>
      {/* Numbered sections */}
      {article.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          data-blog-section={section.id}
          className="flex flex-col gap-grid"
        >
          <h2 className="font-serif text-heading-h3 text-text-primary">{section.title}</h2>
          {section.paragraphs.map((p, i) => (
            <>
              <p key={`p-${i}`} className="font-serif text-body-lg leading-relaxed">{p}</p>
              {/* Inline pull-quote renders BETWEEN paragraph 0 and 1 */}
              {section.pullQuote && i === 0 && (
                <InlinePullQuote key={`pq-${i}`} quote={section.pullQuote} />
              )}
            </>
          ))}
          {/* Inline figure renders AFTER all paragraphs */}
          {section.figure && <InlineFigure figure={section.figure} />}
        </section>
      ))}
    </div>
  );
}
```

**Branch on `stubBody`**:
- **`stubBody === false`** (featured article only this slice): render the 2-paragraph lead + 4 `<section data-blog-section="...">` blocks each containing the section title h2 + paragraphs + optional inline `<InlinePullQuote>` between paragraph 0 and 1 + optional inline `<InlineFigure>` after all paragraphs. The pull-quote-between-paragraphs rule matches `design/Public_pages.pdf` page 6 (section 1 has the pull-quote callout exactly between its 2 paragraphs).
- **`stubBody === true`** (6 secondary articles this slice): render only `article.body.stubLead` (one paragraph, in the same serif body-lg as the featured-article lead) + a `Full article forthcoming.` caption in italic ink-secondary. **Zero `<section data-blog-section="...">` elements** — verified by SC-026 (curl-grep for `data-blog-section` on each stub route returns 0).

**Rail behavior on stubs**: `BlogPostLayout` computes `tocItems = article.sections.map((s) => ({id: s.id, displayTitle: s.railTitle ?? s.title}))` which is an empty array for stub articles (`sections: []`). `<BlogRailToc items={[]} />` **returns `null`** per the early-return in decision §6. The right column on stub articles renders only `TryBristleCard`.

**Confirmation of which rail-on-stub option**: return `null`. The alternative (render an empty `<nav>` placeholder) would mean the rail column would visibly take up space but be empty — visually awkward, and the page would look "broken" to a visitor. Returning `null` lets the right column collapse to its natural content (just the `TryBristleCard`), which is what the visitor expects when an article is stubbed.

**Layout consequence on stubs**: the 2-column grid (`md:grid-cols-[18rem_1fr]` — wider than slice-009's 16rem to fit longer English titles in the rail) still applies; the right column just contains a single child (`TryBristleCard`). The grid doesn't collapse. On mobile, the layout naturally stacks (body above the TryBristleCard, no rail visible).

**Rationale**: keeps the layout coherent in both states; the visitor gets the same chrome (top nav, two-column body, footer) on both a real-body and a stub-body article, which makes the stub feel like a legitimate publication-pending page rather than a broken or under-construction one. The `Full article forthcoming.` caption (in the design's wry voice register — short, plain-spoken, no hype) signals to a knowledgeable reader that the body is intentionally short for now, not missing due to error.

**Alternatives considered**:
- Render an empty `<nav>` placeholder so the right column "always has a rail" (rejected — visual emptiness reads as broken; the `null` return is cleaner).
- Hide `TryBristleCard` on stub articles (rejected — the conversion CTA is the *primary* affordance on a stub page; visitors who click in and find a short article should still be invited to convert).
- Single-column layout for stub articles (rejected — visual inconsistency between featured and stubs; the visitor's expectation should be uniform).

### 13. Performance / SEO budget — **strategy for keeping each route under 180 KB gz**

| Route | Expected First Load JS | Client bundles | Notes |
|---|---|---|---|
| `/blog` | **~115-120 KB** | `BlogArticleGrid` + `BlogFilterChips` (compiled together, ~2-3 KB) | Heavier than slice-009 `/terms` (107 KB) because `BlogArticleGrid` is non-trivial (renders 7 cards conditionally, owns `useState`); chips add ~0.5 KB. Still ~60 KB under budget. |
| `/blog/[slug]` × 7 routes | **~110-115 KB** each | `BlogRailToc` (~1-2 KB) | Very close to slice-009 `/terms` baseline; `BlogRailToc` is identical bundle size to slice-009 `TocRail`. Inline SVG figure renders as zero-JS HTML; no chart-lib bundle leak. |

**Estimation method**:
- Slice-005 `/` baseline = ~106 KB First Load JS (TopNav + SiteFooter + Next.js runtime).
- Slice-006 `/faq` = ~116 KB (baseline + Radix Accordion ~5 KB + FaqScrollSpyRail ~1 KB + FAQ data serialization).
- Slice-009 `/terms` = ~107 KB (baseline + TocRail ~1-2 KB; no Radix Accordion, no zod, no Resend).
- Slice-010 `/blog`: baseline + `BlogArticleGrid` (`useState` hook + list filter + 7 card renders) + `BlogFilterChips` (presentational, 5 button renders + `onClick` props) ≈ 106 + 8-12 ≈ **~115-120 KB**.
- Slice-010 `/blog/[slug]`: baseline + `BlogRailToc` (~1-2 KB; identical to slice-009) + inline SVG path (zero KB JS, ~1.5 KB HTML markup) + the article's prose (server-rendered, not in JS bundle) ≈ 106 + 4-7 ≈ **~110-115 KB**.

**Investigation threshold**: if any route exceeds **130 KB** at build, investigate via grep across `.next/static/chunks/` and the build output. Common offenders if exceeded: accidental `recharts` import in `InlineFigure`, accidental Radix component in `BlogFilterChips`, the entire `BLOG_ARTICLES` array shipping in client JSON (would happen if a Server Component accidentally became a Client Component via an `import { BLOG_ARTICLES }` from a client file).

**Content-as-server-only safeguard**: the only client component that needs article data is `BlogArticleGrid`, which receives `articles: BlogArticle[]` as a prop from the `/blog/page.tsx` Server Component. Next.js serializes the prop to a JSON payload for hydration — this is unavoidable but limited to the article *cards*' metadata (slug, category, displayDate, title, summary, authorName, authorInitials, readTimeMinutes, featured, stubBody, pullQuote) for all 7 articles, **NOT** the section bodies or paragraph text. To enforce this, the `/blog/page.tsx` Server Component should pass a card-projected slice of `BLOG_ARTICLES` (not the full objects) into `BlogArticleGrid`:

```ts
// apps/web/src/app/blog/page.tsx (refinement, sketch)
import { BLOG_ARTICLES } from "@/components/blog/blog-articles";

const CARDS = BLOG_ARTICLES.map(({ slug, category, date, displayDate, title, summary, authorName, authorInitials, readTimeMinutes, featured, stubBody, pullQuote }) => ({
  slug, category, date, displayDate, title, summary, authorName, authorInitials, readTimeMinutes, featured, stubBody, pullQuote,
}));

export default async function BlogIndex() {
  return (
    /* ... */
    <BlogArticleGrid articles={CARDS} />
    /* ... */
  );
}
```

This projection drops `body`, `sections` (the large fields) from the client-bound payload. Each article's payload becomes ~250-400 bytes serialized; all 7 articles ≈ 2-3 KB JSON for hydration, well within the bundle estimate.

**Refinement vs your draft**: introduced this card-projection step explicitly. Without it, the entire featured article's body + sections (5+ paragraphs of prose + the 4 sections' paragraphs + figure) would serialize into the client hydration JSON — adding ~5-8 KB unnecessarily. The card projection is a 5-line cost that saves 5-8 KB.

To support this, `BlogArticleGrid`'s prop type should be `articles: ReadonlyArray<BlogArticleCard>` where `BlogArticleCard` is a `Pick`'d type from `BlogArticle` (the card-render fields only). This is a small type addition in `types.ts`:

```ts
export type BlogArticleCard = Pick<
  BlogArticle,
  "slug" | "category" | "date" | "displayDate" | "title" | "summary" | "authorName" | "authorInitials" | "readTimeMinutes" | "featured" | "stubBody" | "pullQuote"
>;
```

**Lighthouse posture**:
- Performance ≥ 90: large-static-content + minimal-JS approach; LCP candidates are `BlogHero`'s `Field Notes` serif headline on `/blog` and `BlogPostHero`'s article title on `/blog/[slug]`. Both server-rendered text with `font-display: swap` — same LCP profile as slice 005/006/008/009.
- Accessibility ≥ 90: WCAG 2.2 AA discipline (heading semantics, `aria-pressed`, `aria-current="location"`, focus rings, keyboard reach on chips + rail, `role="img"` + `aria-label` on the SVG figure).
- Best Practices ≥ 90: HTTPS-only, no console errors, image alt-text where applicable.
- SEO ≥ 90 on local-prod; SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact.

### 14. ARIA + a11y posture — **confirmed**

**`/blog`**:
- `<main>` landmark wrapping the page body (h1 is `BlogHero`'s `Field Notes`).
- `BlogFilterChips`: `role="toolbar" aria-label="Filter articles by category"` group; each chip is a `<button aria-pressed>`. Per decision §7.
- `BlogFeaturedCard`: rendered as `<article>` with the article's title as `<h2>`. The `IN THIS ISSUE` callout is rendered as `<aside aria-label="In this issue">` containing the pull-quote text as a `<blockquote>` element.
- Each `BlogArticleCard`: rendered as `<article>` with the article's title as `<h2>` wrapped in a `<Link>` (Next.js `Link` component → `<a>`). The whole card is keyboard-navigable via the link.
- Tab order: TopNav → `BlogFilterChips` (5 chips in DOM order) → `BlogFeaturedCard` link → 6 secondary card links in DOM order → `SiteFooter`.

**`/blog/[slug]`**:
- `<main>` landmark wrapping the page body. `<h1>` is `BlogPostHero`'s article title; `<h2>` per section in `BlogPostBody`.
- `BlogPostHero`: eyebrow (small caps mono `BRISTLE BLOG` or the category chip), serif `<h1>`, meta row (`<p>` with bullet-separated date / category / author / read-time), author-initials avatar (`<span aria-hidden="true">` since the name is in the meta row prose).
- `BlogRailToc`: `<nav aria-label="Sections of the article">` per decision §6; on stub articles, returns `null` (no rail).
- `InlinePullQuote`: `<blockquote>` with `<cite>` for attribution.
- `InlineFigure`: `<figure>` containing eyebrow `<p>`, `<svg role="img" aria-label={figure.caption}>`, `<figcaption>` for caption. The SVG's `aria-label` makes the figure announce its caption text to screen readers; the visible `<figcaption>` reinforces this for sighted users.
- `TryBristleCard`: `<aside>` with eyebrow `<p>`, serif `<h3>` (since `<h2>` is reserved for sections), `<a>` CTA button.
- Tab order: TopNav → article body (links inside prose, if any) → rail anchors (desktop sticky rail; on mobile, after the body) → `TryBristleCard` CTA → `SiteFooter`.

**`prefers-reduced-motion`**: respected in `BlogRailToc`'s click handler and mobile-pill scroll effect (decision §6). All other animations on the page are `120-180ms` color transitions per §4.5, which already comply with the reduced-motion spec (color-only animation is allowed under reduced-motion).

### 15. Risks, unknowns & tracked follow-ups

#### Risks (in-slice)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | 4px visual fidelity to `Public_pages.pdf` p.5 (index) and p.6 (featured post) | Med | Low | Map every dimension to tokens; screenshot-compare at 1280 width; the BlogHero serif headline, the IN THIS ISSUE callout's position/size, the 3-column grid gap (`gap-grid` = 16px), and the inline figure's height + caption styling are the most-likely 4px-tolerance suspects. The 6 stub-body articles get structural-correctness review only (no per-stub PDF). |
| R2 | `BlogArticleGrid` accidentally pulls in the full article-body payload to the client bundle | Med | Med | Explicit card projection per §13 (drop `body` and `sections` before passing to the client component). T021 verifies `/blog` First Load JS ≤ 125 KB; if exceeds, suspect this leak. |
| R3 | Inline SVG figure renders incorrectly at narrow viewports (the 720×200 viewBox stretches via `preserveAspectRatio="none"`, which can make the path look squished at 320px width) | Med | Low | T021 responsive-sweep includes the figure check at 320; if visible distortion, switch to `preserveAspectRatio="xMidYMid meet"` and accept letterboxing instead of stretching. |
| R4 | `BlogRailToc` "between sections" no-flicker behavior fails on `/blog/[slug]/what-...#method-data` deep-link load due to multiple sections briefly intersecting (page scrolls to method-data on initial paint, but earlier sections might still intersect from the rootMargin's bottom 55% inset) | Low | Low | Same risk as slice-006 / 009 — both rails handle this correctly because the rootMargin's `-55% 0px` is on the *bottom* (only sections in the upper 45% of viewport "count"); the visitor at `#method-data` sees only method-data in the upper 45%. Tested by slice-009 (same code path, longer pages). |
| R5 | The 7 article slugs accidentally collide with a future product route (e.g. if Tier 4 ships `/blog/categories/` and the dynamic `[slug]` swallows it) | Very Low | Med | Spec slugs are all multi-word article-shape strings; no risk of collision with single-word category-like paths. If a future Tier-4 slice adds `/blog/categories/` as a literal route, it takes precedence over the catch-all per Next.js routing rules. Document as a known constraint in the eventual Blog category slice. |
| R6 | A reader of the source confuses `figure.placeholderText` (a developer-facing optional hint, NEVER rendered) with the visible caption | Low | Med | Same discipline as slice-009 `reviewNote?` — the field is on the type but the `InlineFigure` component reads only `figure.eyebrow` and `figure.caption`. T021 verify includes a grep that the `placeholderText` string never appears in rendered HTML. |
| R7 | Founder-edit pass on the featured article's 2-paragraph lead or 4 sections introduces a hex literal or font-family literal via copy-paste from elsewhere | Med | Med | T021 voice + tokens grep across all new files catches this before commit. Same discipline as slices 005-009. |
| R8 | `displayDate` strings drift from `date` ISO values (founder edits one, forgets the other) | Med | Low | Soft check at T-local: a quick eyeball pass that each article's `displayDate` matches `date`. A future content-tooling slice could add a script that re-derives `displayDate` from `date` at commit time; not in scope here. |
| R9 | First-Load JS on `/blog` exceeds 180 KB gz | Very Low | High | Card projection (§13) + strict no-new-deps + Server Component default keeps bundle small. T021 verifies; ≥130 KB triggers investigation. |
| R10 | The third structural mirror of the scroll-spy rail (slice 006 + 009 + 010 now) increases refactor pressure to the point where a slice 2.7 or follow-up refactor slice is mandatory | Confirmed expected | Low (in slice 010), Med (future) | Documented as the primary tracked follow-up below. Slice 010 ships the mirror knowingly; the eventual `SectionScrollSpyRail` refactor absorbs all three in one pass. The refactor cost is bounded — the three rails share ~80% of their code, so the dedupe is a clean 3-file → 1-file consolidation, not a redesign. |

#### Tracked follow-ups (out of scope this slice, captured here for future-slice authoring)

- **Dedupe `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) into a shared `SectionScrollSpyRail`** — primary follow-up; refactor pressure now real. Parameterize over (a) selector (`[data-faq-item]` / `[data-legal-section]` / `[data-blog-section]`), (b) items source (`FaqItem` / `TocItem` / `BlogTocItem`), (c) `aria-label` string, (d) initial active id derivation. Likely lands in a dedicated refactor slice between Tier 2 close and Tier 3 open.
- **Per-article OG image generation** (deferred per clarification (d)) — likely via `@vercel/og` dynamic image routes showing article title + author + chart preview. Not necessary for v0.2.0 launch.
- **RSS feed** for `/blog` — still slice 2.7. Renders `BLOG_ARTICLES` as a feed; subscribers and search engines pick up new content. Static generation at build time, hits `/blog/feed.xml`.
- **Real authored content for the 6 secondary articles** — founder authors in a content patch slice (10a/10b precedent from 008→009 if needed) OR directly in source between Tier 2 ship and Tier 3 work. Replaces each article's `stubLead` + adds `body.lead` + `sections`, flips `stubBody: false`.
- **Real authored Method & data section** for the featured article — founder edits the 2 placeholder paragraphs in scope §10 / FR-020 before publishing. Replaces the `[PLACEHOLDER]` paragraphs with real method documentation + a real SQL query link.
- **`InlineFigure` real chart data** — when the founder publishes the featured article, swap the 12-point placeholder path for a real chart (recharts component, or a static SVG export from the actual GitHub-issues analysis). The decorative SVG is the placeholder; the real chart is content work.
- **`/signup` known-out-of-scope-404** — the `TryBristleCard` CTA on all 7 article pages links to `/signup`, still a soft-404 stub until Tier 3 slice 3.1 ships. Documented carry-forward; same posture as slice-005 nav `Login` / `Start free`.
- **Author profile pages** — no `/authors/{name}` routes this slice; bylines render as plain text. If/when Bristle grows beyond one author, this becomes a meaningful follow-up (likely in or after Tier 5).
- **`/blog/categories/[category]` deep pages** — currently the filter chips are client-side only (no URL state). A future SEO-driven slice could ship dedicated `/blog/categories/data-analysis`, etc. routes for category-scoped landing pages. Not in v1.0 scope.
- **Slice-005 `<main>` landmark** (carried since slice 006 STOP 4) — `apps/web/src/app/page.tsx` still lacks `<main>` wrap. Both new slice-010 routes get it from day one. Defer the slice-005 one-line fix to a future micro-slice touching landing chrome.
- **NewsletterStub markup duplication** (slice-008 About + footer stubs) — still pending; slice 2.7 wires newsletter and likely converges to one shared component.
- **Form spam protection** (slice 008 carry) — Cloudflare Turnstile or Vercel KV rate limiting if spam volume warrants.
- **Vitest harness for Server Actions** (slice 008 carry) — N/A this slice (no Server Action).
- **`/privacy/sub-processors` deep page** (slice 009 carry) — referenced from Privacy section 5 + GDPR section 6; still 404. Follow-up.
- **Refund-policy alignment audit** (slice 009 carry, permanent) — Terms §6 ↔ FAQ q-5. Any future legal/pricing slice MUST audit both.

#### Unknowns

None. The spec has 7 clarifications, all resolved upstream.

### 16. Implementation batching — **confirmed: 4 batches / 4 STOPs, with Batch C heavier than prior slices**

- **Batch A / STOP 1 — Foundations** (~2 commits): `types.ts` (BlogCategory + BlogArticle + BlogArticleSection + BlogPullQuote + BlogFigure + BlogTocItem + BlogArticleCard types) + `blog-articles.ts` (the 7-article data store with full featured body + 6 stub leads, [PLACEHOLDER] header). **Verification gate**: typecheck/lint + [PLACEHOLDER] header check + article-count check (`length === 7`, `filter(a => a.featured).length === 1`, `filter(a => a.stubBody).length === 6`) + verbatim opening-phrase greps for the featured article's 4 sections + voice greps clean.

- **Batch B / STOP 2 — Template primitives** (~9 commits, [P]-parallel-eligible after Batch A): `BlogHero`, `BlogFeaturedCard`, `BlogArticleCard`, `BlogPostHero`, `BlogPostBody`, `InlinePullQuote`, `InlineFigure`, `BlogRailToc` (client), `TryBristleCard`. The interactive surface is `BlogRailToc`; the other 8 are Server Components and can [P]-parallel.

- **Batch C / STOP 3 — Client interactions + Layout + Routes** (~5 commits): `BlogFilterChips` (client, presentational), `BlogArticleGrid` (client, owns state), `BlogPostLayout` (server shared template), `/blog/page.tsx` (rewrite), `/blog/[slug]/page.tsx` (new — generateStaticParams + generateMetadata + default export). Assembly + the only existing-file change. **Heavier than slice-009 Batch C** because slice 010 has 2 routes (vs 4 thin route wrappers in slice 009) but each route has materially more logic (the index has state + filter + grid; the post route has `generateStaticParams`, `generateMetadata`, lookup + notFound, layout composition).

- **Batch D / STOP 4 — Gates** (no commits): T-local gate (typecheck/lint/build + bundle budgets verified against §13 + Lighthouse on `/blog` + featured-article route + responsive sweep at 320/375/768/1024/1280/1440 on all 8 routes + greps + filter-chip interaction walk + scroll-spy walk on featured + visual-diff vs PDF pp. 5 + 6 + slice-005 nav "Blog" regression check + stub-route curl-grep for `Full article forthcoming.`) + T-preview parity gate.

**Expected total: ~16-17 commit-producing tasks + 2 verification gates**. About the same shape as slice 009 (~13-14 commits) but slightly larger Batch B (9 vs 3 primitives) and slightly larger Batch C (5 commits with bigger files vs 5 commits with thinner files). Total file count is the largest of any Tier-2 slice (~19 new + 1 rewrite).

**Refinement vs your draft**: confirmed batch shape. Added the card-projection refinement (§13) — implementing it lives in Batch C (where `/blog/page.tsx` is written), not Batch A. The type addition (`BlogArticleCard` Pick'd type) lives in Batch A.

## Order of operations

1. **Batch A**: `types.ts` → `blog-articles.ts` (sequential — articles import types). Single commit per file.
2. **Batch B**: 9 primitives, all [P]-parallel-eligible after Batch A lands. Recommended order for review clarity: `BlogHero` → `BlogFeaturedCard` → `BlogArticleCard` → `BlogPostHero` → `InlinePullQuote` → `InlineFigure` → `BlogRailToc` (client) → `TryBristleCard` → `BlogPostBody`. Single commit per file.
3. **Batch C**: `BlogFilterChips` (client, depends on `BlogCategory` type) → `BlogArticleGrid` (client, depends on `BlogFilterChips` + `BlogFeaturedCard` + `BlogArticleCard`) → `BlogPostLayout` (server, depends on `BlogPostHero` + `BlogPostBody` + `BlogRailToc` + `TryBristleCard`) → `/blog/page.tsx` (REWRITE, depends on `BlogHero` + `BlogArticleGrid` + `BLOG_ARTICLES`) → `/blog/[slug]/page.tsx` (NEW, depends on `BlogPostLayout` + `BLOG_ARTICLES`). Single commit per file.
4. **Batch D**: T-local gate (no commit) → push branch → T-preview parity (no commit).

`types.ts` (Batch A first task) gates the whole slice. `blog-articles.ts` (Batch A second task) gates Batch B (every primitive imports a type-relevant subset of the data). Within Batch B, the 9 primitives are independent. Batch C linearizes around the data flow (chips into grid into route; primitives into layout into post route).

## Complexity Tracking

No constitution violations — section intentionally empty. The third structural mirror of the scroll-spy rail (006 → 009 → 010) is recorded above in §15 / tracked follow-ups as a deliberate trade-off (additive-only this slice; refactor in a future slice).
