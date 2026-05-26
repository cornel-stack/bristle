# Research: Blog index + blog post template + 7 articles

Phase 0 decisions (the 16 the user required). Format: Decision / Rationale / Alternatives.

## D1 — Composition: 2 distinct route compositions, shared `BlogPostLayout` for post

- **Decision**: `/blog` index = async Server Component → `TopNav` + `BlogHero` + `BlogArticleGrid` (client, owns state, houses chips + featured + grid) + `SiteFooter`. `/blog/[slug]` post = async Server Component → lookup by slug, `notFound()` if missing, `<BlogPostLayout article={article} />` (server, internally renders `BlogPostHero` + `BlogPostBody` + `BlogRailToc` (client) + `TryBristleCard`, wrapped in `TopNav` + `SiteFooter`).
- **Rationale**: maps 1:1 to spec sections + 4px gates vs `design/Public_pages.pdf` pages 5 and 6. Two compositions keep each route's chrome appropriate (index has no rail, post has no filter chips); a shared layout component for the post route lets both featured and the 6 stubs share grid + sticky-rail placement without conditional chrome.
- **Alternatives**: shared single layout for both routes (rejected — would need conditional rail/chips, too many props); inline `BlogPostLayout`'s JSX in the route file (rejected — couples metadata logic with chrome); context provider for the article (rejected — props are simpler at one level).

## D2 — Server vs Client boundary: 3 client files, 13 other new files + 1 rewrite

- **Decision**: only `blog-filter-chips.tsx`, `blog-article-grid.tsx`, `blog-rail-toc.tsx` carry `"use client"`. Routes, `BlogPostLayout`, `BlogHero`, `BlogFeaturedCard`, `BlogArticleCard`, `BlogPostHero`, `BlogPostBody`, `InlinePullQuote`, `InlineFigure`, `TryBristleCard`, `types.ts`, `blog-articles.ts` are all server / data / type modules. Verifiable by `grep -l "use client" apps/web/src/components/blog/ apps/web/src/app/blog/page.tsx apps/web/src/app/blog/\[slug\]/page.tsx` returning exactly three files.
- **Rationale**: more client surface than slices 006/008/009 (1 each) because Tier-2 4 introduces the first stateful index UI in the product. Three is the right count — chips (presentational; child of grid) + grid (state owner) + rail (unrelated scroll-spy on post route). Each is a principled client surface, not accidental.
- **Alternatives**: lift filter state to a parent client wrapper above chips + grid (rejected — adds a 4th client file for no benefit); URL `?category=` query param (rejected — heavier, requires router work, not in design).

## D3 — `BlogArticle` shape: `ReadonlyArray` + dual `date`/`displayDate` + optional `pullQuote` on featured

- **Decision**: per plan §3. Both `date` (ISO `yyyy-mm-dd`) and `displayDate` (pre-formatted `MAY 8 2026`) stored as fixed strings. `pullQuote` on the article drives the index's `IN THIS ISSUE` callout (only set on the featured article); `pullQuote` on `BlogArticleSection` is separate, drives inline pull-quotes between section paragraphs (both can quote the same line, but they're independent fields). `featured` and `stubBody` are independent booleans (allows future flexibility).
- **Rationale**: dual-date strategy avoids runtime `Intl.DateTimeFormat` (no locale drift between SSR and hydration, no date library); `ReadonlyArray<T>` matches the `as const` discipline from prior slices and prevents accidental mutation; separating page-level pull-quote from section-level pull-quote keeps the index callout independent of section structure.
- **Alternatives**: single `date: Date` field with formatting at render time (rejected — needs locale + tz reasoning, runtime formatting cost, hydration risk); single `pullQuote` field doing double duty (rejected — couples index display logic to section structure; what happens for an article with featured-on-index but no section pull-quote?); plain `T[]` instead of `ReadonlyArray<T>` (rejected — loses readonly safety).

## D4 — `BlogArticleSection` with optional `railTitle?` override (option (a))

- **Decision**: each `BlogArticleSection` carries `id`, `title`, optional `railTitle?: string`, `paragraphs: ReadonlyArray<string>`, optional `pullQuote?: BlogPullQuote`, optional `figure?: BlogFigure`. `BlogPostLayout` projects to `BlogTocItem[] = { id, displayTitle: s.railTitle ?? s.title }` before passing into the rail.
- **Rationale (user's recommendation honored)**: explicit `railTitle?` beats derivation heuristic (no "split on colon" magic; the featured article's section 4 title is `Method & data.` with no colon, which would break derivation). The `??` fallback means sections without rail-specific shortening don't need to set the field. One source of truth in the data file; founder edits both rail and h2 titles together.
- **Alternatives**: derive `displayTitle` at projection time via heuristic (rejected — brittle, magical, fails on `Method & data.`); co-locate `displayTitle` in a separate parallel array (rejected — drift risk, duplicates id list); make `railTitle` required (rejected — noisy for sections that don't need shortening).

## D5 — Filter state owned by `BlogArticleGrid`; `BlogFilterChips` presentational

- **Decision**: `BlogArticleGrid` is a client component with `useState<BlogCategory | "all">("all")`. `BlogFilterChips` receives `selected` + `onSelect` as props (no own state). Grid filters internally and renders 7 cards conditionally. When `selected === "all"`, the featured article renders in its own `BlogFeaturedCard` slot above the 6-card grid; when a category is filtered, the featured article (if it matches the filter) renders inline in the grid alongside other matching articles (no "featured slot under a filter" treatment).
- **Rationale**: transposes the slice-008 `ContactForm` precedent (form owns `useActionState`; success/error children are presentational). Single state owner, one-level prop pass, no context. Featured-inline-on-filter is the simpler honest behavior.
- **Alternatives**: separate context provider above both chips and grid (rejected — overkill at this depth); URL `?category=` query param (rejected — heavier, router work); CustomEvent DOM event for filter changes (rejected — DOM events for internal state is anti-pattern).

## D6 — `BlogRailToc` IO config: verbatim mirror of slice-009 `TocRail`

- **Decision**: `rootMargin: "-80px 0px -55% 0px"`, `threshold: 0`. `Map<itemId, topY>` ref updated by observer callback; topmost (smallest `topY`) intersecting item becomes active. When `visibleItems.size === 0`, early-return without clearing (no flicker). Selector: `document.querySelectorAll("[data-blog-section]")` — distinct from slice-006 `[data-faq-item]` and slice-009 `[data-legal-section]`. Initial `active` = `items[0]?.id ?? ""` (flicker fix). `matchMedia("(prefers-reduced-motion: reduce)").matches` read fresh in `handleClick` AND mobile-pill `useEffect`. Modifier-key short-circuit (`e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0`). ARIA: single `<nav aria-label="Sections of the article">` (article-scoped, vs slice-009's page-scoped); anchors are `<a href="#{id}">` with `aria-current={isActive ? "location" : undefined}`. NO `role="tablist"`, NO `role="tab"`, NO `aria-selected`. Returns `null` when `items.length === 0` (stub-body articles).
- **Rationale**: slice-009 `TocRail` is the latest in a 2-iteration line (slice 006 → 009); re-deriving from scratch would risk regression. The structural mirror is intentional per FR-013. The follow-up to extract `SectionScrollSpyRail` now grows to absorb three structural mirrors (slice 006 + 009 + 010).
- **Alternatives**: re-tune config per slice (rejected — wasted cost); different active-resolution rule like "section whose center crosses viewport center" (rejected — worse UX for long sections); ship a shared `SectionScrollSpyRail` now (rejected — out-of-scope refactor; would need to also touch FAQ rail and Legal TocRail; regression risk on two shipped surfaces).

## D7 — `BlogFilterChips` ARIA: Pattern A (`role="toolbar"` + `<button aria-pressed>`)

- **Decision**: `<div role="toolbar" aria-label="Filter articles by category">` wrapping 5 `<button type="button" aria-pressed={isSelected}>` chips. Active = filled dark pill (`bg-text-primary text-surface-card rounded-pill`); inactive = outlined pill (`border-border-default bg-surface-card text-text-secondary rounded-pill`). Tab order: chips in DOM order, each chip is a regular tab stop (no roving tabindex).
- **Rationale (user's recommendation honored)**: `role="radiogroup"` implies exactly-one-of-N siblings selected — but `All` is a meta-state (show everything), not a sibling category, so it violates the radiogroup semantics. The WAI-ARIA Authoring Practices Guide explicitly covers `<button aria-pressed>` toggles under the Toolbar Pattern for filter UIs. Screen readers announce "pressed" / "not pressed" accurately on each chip; the toolbar role provides the "this is a related group of toggles" grouping affordance.
- **Alternatives**: `role="radiogroup"` (rejected per above); no grouping role, raw `<button aria-pressed>` siblings (rejected — loses grouping affordance for screen readers); link-based filter with URL state (rejected per D5).

## D8 — `InlineFigure`: hand-rolled inline SVG line chart, tokens-only, ~200px tall

- **Decision**: `<figure>` wrapping eyebrow `<p>` + `<svg viewBox="0 0 720 200" role="img" aria-label={figure.caption} className="w-full" preserveAspectRatio="none">` + `<figcaption>`. SVG content: 5 horizontal grid lines in `stroke-border-default opacity-40`, a rising `<path>` with 12 data points in `stroke-accent-bristle stroke-width=2 fill=none stroke-linecap=round stroke-linejoin=round`, and 4 x-axis labels in `fill-text-secondary` at 11px. Eyebrow + caption render OUTSIDE the SVG as `<p>` and `<figcaption>`. Tokens-only — no hex literals, no inline `style`.
- **Rationale**: the figure is decorative per clarification (e) — represents what a chart looks like, not real data. Hand-rolled SVG keeps the bundle free of `recharts` (~80 KB) / `chart.js` (~60 KB) / etc. — would each blow the 180 KB First Load budget. Tokens-only colors keep §4 discipline. The founder swaps to a real chart before publishing.
- **Alternatives**: static PNG/JPG asset in `public/` (rejected — adds a binary; harder to iterate and swap); `next/image` with an SVG file (rejected — no benefit; inline renders at SSR with no extra bytes); add `recharts` now (rejected — propose-first per §9; not justified for placeholder content).

## D9 — `generateStaticParams`: returns all 7 slugs from the data store

- **Decision**: `export async function generateStaticParams(): Promise<Array<{ slug: string }>> { return BLOG_ARTICLES.map((a) => ({ slug: a.slug })); }`. Single source of truth = `blog-articles.ts`. Build output: 7 individual static entries under `/blog/[slug]` (the `●` marker in `next build`, equivalent to `○ Static`).
- **Rationale**: derives from data; can't drift from the data store. Adding an 8th article is a single-file change. Canonical Next.js 15 pattern.
- **Alternatives**: hardcode slug array (rejected — drift risk); set `dynamicParams: false` (rejected — `notFound()` is the cleaner Next.js pattern; produces the same 404 outcome).

## D10 — `generateMetadata` per article: dynamic title + description + `og:type: "article"`

- **Decision**: `/blog/[slug]` exports `generateMetadata({ params })` constructing `title = ${article.title} — Bristle`, `description = article.summary`, `openGraph` with same title + description, `type: "article"`, `url: ${SITE_URL}/blog/${slug}`, `images: [{ url: ${SITE_URL}/og-image.png, width: 1200, height: 630 }]`. `/blog` index exports static `metadata` with `title: "Field Notes — Bristle"`, `description: "Research, analysis, and the occasional opinion on building products against evidence."`, `openGraph` with `type: "website"`. No `robots` field on either route.
- **Rationale**: `og:type: "article"` is the canonical Open Graph type for blog posts / news / date-stamped editorial content (vs `website` for product/marketing/legal pages). Per-article OG image generation deferred per clarification (d) — all 7 articles + the index share the slice-005 raster. Index uses `website` because it's a section landing page, not a single article.
- **Alternatives**: `og:type: "blog"` (rejected — not a valid OG type; `article` is correct); auto-generated description from first paragraph (rejected — slice precedent is curated; quality > automation); per-article OG images via `@vercel/og` (deferred).

## D11 — `notFound()` from `next/navigation` for unknown slugs

- **Decision**: `/blog/[slug]` default export does `const article = BLOG_ARTICLES.find((a) => a.slug === slug); if (!article) notFound();`. Produces Next.js default 404 page (no custom `not-found.tsx` this slice). Custom Bristle-voiced 404 ships in Tier-7 polish.
- **Rationale**: canonical pattern; minimum viable behavior; the eventual Tier-7 system pages slice covers all routes with one global Bristle-voiced 404 (per `design/System_pages.pdf` page 1). Building a blog-specific custom 404 now is wasted scope.
- **Alternatives**: ship custom blog 404 this slice (rejected — Tier-7 covers it globally); `throw new Error()` (rejected — produces 500 not 404); ship `dynamicParams: false` so unknown slugs are framework-rejected before hitting the component (rejected — `notFound()` is the canonical Next.js 15 pattern, gives identical 404 outcome).

## D12 — `BlogPostBody` branches on `stubBody`; `BlogRailToc` returns null on empty items

- **Decision**: `BlogPostBody` is a Server Component that branches on `article.stubBody`. `false` (featured only) → render 2-paragraph lead + 4 `<section data-blog-section="...">` blocks with h2, paragraphs, inline pull-quote BETWEEN paragraph 0 and 1, inline figure AFTER all paragraphs. `true` (6 stubs) → render only `article.body.stubLead` as a single serif paragraph + `Full article forthcoming.` caption (italic ink-secondary). Zero `<section data-blog-section>` elements emitted on stubs. `BlogRailToc` on stub articles: returns `null` (because `tocItems.length === 0`). Right column on stubs renders only `TryBristleCard`; layout doesn't collapse (2-col grid remains, right column has one child).
- **Rationale**: branching in `BlogPostBody` keeps the layout component (`BlogPostLayout`) uniform — same chrome for both featured and stub articles. Returning `null` from the rail on stubs is cleaner than rendering an empty `<nav>` placeholder (visual emptiness reads as broken; null collapses naturally). `Full article forthcoming.` in the design's wry voice register signals intentional stub, not error.
- **Alternatives**: render empty `<nav>` placeholder (rejected — visible empty rail reads as broken); hide `TryBristleCard` on stubs (rejected — conversion CTA is the primary affordance on a stub page); single-column layout for stubs (rejected — visual inconsistency).

## D13 — Performance budget: card projection enforces server-only payload discipline

- **Decision**: `/blog` Server Component projects `BLOG_ARTICLES` through a `BlogArticleCard` `Pick`'d type (drops `body` and `sections`) before passing into `BlogArticleGrid` (client). Reduces client hydration JSON from ~10-15 KB (full articles) to ~2-3 KB (card-shape only). Expected First Load JS: `/blog` ~115-120 KB, `/blog/[slug]` ~110-115 KB. Investigate any route ≥ 130 KB.
- **Rationale**: without the projection, the featured article's body + sections (paragraphs of prose + figure data + pull-quote text) would serialize into the client JSON for hydration — wasted bytes. 5 lines of projection code saves 5-8 KB of client payload. The `BlogArticleCard` Pick'd type lives in `types.ts` (Batch A); the projection lives in `/blog/page.tsx` (Batch C).
- **Alternatives**: pass full `BlogArticle[]` to the client component (rejected — bundle leak); pass only the slugs and re-fetch the cards in the client (rejected — defeats the SSR + zero-runtime-fetch design; meaningless overhead).

## D14 — ARIA + a11y posture: `<main>` on both routes; `<article>` per card; rich landmark semantics

- **Decision**: `/blog`: `<main>` landmark wrapping body (h1 = `BlogHero` `Field Notes`); `BlogFilterChips` per D7; `BlogFeaturedCard` and `BlogArticleCard` as `<article>` with h2 title; `IN THIS ISSUE` callout as `<aside aria-label="In this issue">` with `<blockquote>`. `/blog/[slug]`: `<main>` landmark; h1 in `BlogPostHero` (article title); h2 per section in `BlogPostBody`; `BlogRailToc` per D6 (`<nav aria-label="Sections of the article">`); `InlinePullQuote` as `<blockquote>` + `<cite>`; `InlineFigure` as `<figure>` + `<svg role="img" aria-label>` + `<figcaption>`; `TryBristleCard` as `<aside>` with eyebrow + h3 + CTA `<a>`. `prefers-reduced-motion` respected in `BlogRailToc`. All other animations are §4.5 color transitions (already reduced-motion-safe).
- **Rationale**: WCAG 2.2 AA discipline carried forward from slice 005-009; semantic landmarks make screen-reader navigation clean (visitors can jump to main, nav, aside, etc.). The `aria-label` strings on landmarks distinguish multiple landmarks of the same role on the same page (e.g. top-nav `aria-label="Primary"` vs `BlogRailToc` `aria-label="Sections of the article"`).
- **Alternatives**: ship without explicit landmark roles (rejected — degrades screen-reader experience materially); use `role="main"` instead of `<main>` (rejected — native HTML5 element is preferred).

## D15 — Risks: see plan §15. Key items:

- R1 4px fidelity vs PDFs p.5 + p.6.
- R2 client-bundle leak via full-article serialization (mitigated by D13 card projection).
- R3 inline SVG distortion at narrow viewports (mitigated by responsive sweep at 320).
- R6 `placeholderText` field never rendered (parallels slice-009 `reviewNote?` discipline).
- R9 bundle budget on `/blog` (low risk with card projection; ≥ 130 KB triggers investigation).
- R10 third structural mirror of scroll-spy rail — refactor pressure mounting.
- Tracked follow-ups: shared `SectionScrollSpyRail` (now absorbs 3 mirrors), per-article OG images, RSS feed, real content for 6 stubs, real Method & data, real chart data, `/signup` carry, author pages, category deep pages, slice-005 `<main>` landmark, NewsletterStub convergence, refund-policy alignment, `/privacy/sub-processors`.

## D16 — Batching: 4 batches / 4 STOPs, Batch C heavier than prior slices

- **Decision**: Batch A foundations (2 tasks: types + data store); Batch B template primitives (9 tasks: BlogHero, BlogFeaturedCard, BlogArticleCard, BlogPostHero, InlinePullQuote, InlineFigure, BlogRailToc client, TryBristleCard, BlogPostBody — all [P]-parallel-eligible after Batch A); Batch C client interactions + layout + routes (5 tasks: BlogFilterChips client, BlogArticleGrid client owns state, BlogPostLayout server, /blog/page.tsx REWRITE, /blog/[slug]/page.tsx NEW); Batch D gates (2 verification gates, no commits).
- **Rationale**: same overall shape as slices 006/008/009 — but Batch B is larger (9 primitives vs 3 in slice 009) and Batch C is larger in lines-of-code (the index has state + filter + grid; the post route has generateStaticParams + generateMetadata + lookup + notFound + layout). ~16-17 commit-producing tasks total — the largest Tier-2 slice so far.
- **Alternatives**: collapse to 3 batches (rejected — separating primitives from interactions preserves per-STOP review discipline); single mega-batch (rejected — too much code for one review).
