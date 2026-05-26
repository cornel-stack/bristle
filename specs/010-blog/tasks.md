# Tasks: Blog index + blog post template + 7 articles

**Input**: `spec.md` + `plan.md` + `research.md` + `contracts/ui-and-db.md` + `quickstart.md` in `specs/010-blog/`
**Branch**: `010-blog`
**Tests**: none added this slice (no Vitest/Playwright wired yet; same as slices 005 / 006 / 008 / 009). Verification is the gate phase — typecheck/lint/build, First-Load JS budgets, `[PLACEHOLDER]` + verbatim-opening-phrase greps, hex/font/voice greps, route 200 + meta-tag curl, filter-chip interaction walk, BlogRailToc scroll-spy walk, deep-link anchor walk, keyboard reach + reduced-motion walk, JS-disabled walk for filter degradation, 4px-tolerance visual-diff vs `Public_pages.pdf` p.5 (index) + p.6 (featured post) at 1280, slice-005 top-nav `Blog` link regression check, additive-only diff check, slice-006/008/009 regression check, and preview parity.

## Conventions

- **One commit per task.** Each commit-producing task lists its exact commit message.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (visitor reads Field Notes index + picks an article), US2 (visitor reads the featured article + navigates via the rail), US3 (visitor opens a secondary article + sees the stub treatment), US4 (perf/a11y/SEO/voice/responsive floors + slice integrity + nav-link flip), or SETUP.
- Every task has a **Verify** line — the objective check before committing (for edit tasks) or before STOPping (for gates).
- **Batching**: four batches, each ending in **one STOP** for review (per slice-006 / slice-008 / slice-009 policy). Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution prereqs (already done)**: PR #8 (slice 009) merged to `main` via merge commit `9ccbf3f` on 2026-05-24; `010-blog` cut from clean `main` (no stacking); branch starts at the spec commit `187684d`. Slice-005 top-nav line 5 `{ label: "Blog", href: "/blog" }` + slice-005 site-footer line 17 `{ label: "Blog", href: "/blog" }` — verified at plan time; **no top-nav or footer edit this slice** (FR-030). The slice-005 `apps/web/src/app/blog/page.tsx` is currently a `<ComingSoon version="0.2.4" />` stub with `robots: { index: false, follow: false }` — slice 010 rewrites this file wholesale (FR-001 / SC-022).
- **Additive-only, zero new deps**: no top-level dependency added (`BlogRailToc` hand-rolled `IntersectionObserver` per slice-006 + slice-009; `InlineFigure` hand-rolled inline SVG; dates pre-formatted `displayDate` strings per article — no chart library, no date library). `pnpm-lock.yaml` MUST remain unchanged. **No edits to slice-005 / slice-006 / slice-008 / slice-009 files** other than the one mandated `/blog/page.tsx` rewrite (FR-030, SC-028, SC-029).
- **Boundary reminder**: each of `apps/web/src/app/blog/page.tsx` (rewrite) and `apps/web/src/app/blog/[slug]/page.tsx` (new) is an async Server Component; **exactly three** files under `apps/web/src/components/blog/` carry `"use client"` — `blog-filter-chips.tsx`, `blog-article-grid.tsx`, `blog-rail-toc.tsx` (plan §D2 / FR-026 / SC-025). The optional `figure.placeholderText` field is developer-facing only and MUST NOT be rendered (parallels slice-009 `reviewNote?` discipline).
- **Structural-mirror discipline**: `BlogRailToc` is the **third** structural mirror of the slice-006 `FaqScrollSpyRail` and slice-009 `TocRail` pattern. It MUST NOT import from `apps/web/src/components/faq/scroll-spy-rail.tsx` or `apps/web/src/components/legal/toc-rail.tsx` — additive only. The tracked follow-up to extract a shared `SectionScrollSpyRail` now grows to absorb all three mirrors; that refactor is **explicitly out of scope this slice**.
- **Don't-implement guard**: tasks.md is generated only. Do NOT run `/speckit.implement` — hold for user review.

---

## Batch A — types + content data store  ▸ STOP 1

### Phase 1: Setup / Foundational

### T001 · [SETUP] `types.ts` (BlogCategory + BlogArticle + section / pull-quote / figure / TOC / card types)
Create `apps/web/src/components/blog/types.ts` exporting the canonical type module for the slice per plan §D3 + §D4 / contracts:
- `BlogCategory` — string-literal union `"data-analysis" | "product-strategy" | "indie-hacker" | "devtools"`.
- `BlogPullQuote` — `{ text: string; attribution: string }`.
- `BlogFigure` — `{ eyebrow: string; caption: string; placeholderText?: string }`. The `placeholderText` field is developer-facing only and is NEVER rendered (FR-022-like discipline; parallels slice-009 `reviewNote?`).
- `BlogArticleSection` — `{ id: string; title: string; railTitle?: string; paragraphs: ReadonlyArray<string>; pullQuote?: BlogPullQuote; figure?: BlogFigure }`. The optional `railTitle?` is the explicit shortened form for `BlogRailToc` display per plan §D4 (option (a) — explicit override beats projection-time heuristic).
- `BlogArticle` — `{ slug; category; date (ISO); displayDate (pre-formatted); title; summary; authorName; authorInitials; readTimeMinutes; featured; stubBody; pullQuote? (only on featured); body: { lead: ReadonlyArray<string>; stubLead?: string }; sections: ReadonlyArray<BlogArticleSection> }`. `body` is a nested object per plan §D3.
- `BlogArticleCard` — `Pick<BlogArticle, "slug"|"category"|"date"|"displayDate"|"title"|"summary"|"authorName"|"authorInitials"|"readTimeMinutes"|"featured"|"stubBody"|"pullQuote">` per plan §D13 (drops `body` and `sections` from client-bound payload — saves ~5-8 KB of hydration JSON).
- `BlogTocItem` — minimal projection `{ id: string; displayTitle: string }` consumed by `BlogRailToc`. `displayTitle` is derived in `BlogPostLayout` as `section.railTitle ?? section.title`.
- **Files**: `apps/web/src/components/blog/types.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; file exports all 7 named types/interfaces above (`grep -E "export (interface|type) (BlogCategory|BlogPullQuote|BlogFigure|BlogArticleSection|BlogArticle|BlogArticleCard|BlogTocItem)" apps/web/src/components/blog/types.ts` returns 7 hits); `BlogArticleSection.paragraphs` typed as `ReadonlyArray<string>`; `BlogArticle.sections` typed as `ReadonlyArray<BlogArticleSection>`; `BlogArticle.body` is a nested object with `lead: ReadonlyArray<string>` and `stubLead?: string`; `BlogArticleCard` is a `Pick` over the card-render fields only (NOT including `body` or `sections`); `BlogTocItem` is `{id; displayTitle}` (no other fields — tight rail prop surface per plan §D13).
- **Commit**: `feat(web): add blog/types.ts (BlogArticle + section + card + TOC shapes) (slice 010)`

### T002 · [P] [US1] [US2] [US3] `blog-articles.ts` (7-article BLOG_ARTICLES with featured full body + 6 stubs)
Create `apps/web/src/components/blog/blog-articles.ts` exporting `BLOG_ARTICLES: ReadonlyArray<BlogArticle>` containing exactly **7** entries per spec §10 + §11. The file MUST begin with the `// [PLACEHOLDER — article content awaiting founder review before production launch]` header comment on line 1 (FR-019 / SC-005-analog).

**Article 1 (featured)** — full body:
- `slug: "what-50000-github-issues-reveal-about-developer-pain"`, `category: "data-analysis"`, `date: "2026-05-08"`, `displayDate: "MAY 8 2026"`, `title: "What 50,000 GitHub issues reveal about developer pain."`, `summary: "We analyzed every closed-as-wontfix issue across the 200 most-starred repos. The patterns are not where you expect."`, `authorName: "Cornel Okoth"`, `authorInitials: "CO"`, `readTimeMinutes: 9`, `featured: true`, `stubBody: false`.
- `pullQuote: { text: "17% of closed-wontfix issues never receive a third opinion.", attribution: "— from the analysis" }` — drives the IN THIS ISSUE callout on the index `BlogFeaturedCard`.
- `body.lead: [P1, P2]` where P1 starts `"The first answer most product tools give you"` and P2 starts `"For this analysis we sampled every issue closed-as-wontfix"` (verbatim per spec §10 / contracts).
- `sections` array (4 entries, in order):
  1. `id: "scope-refusals"`, `title: "One: most refusals are about scope, not capability."`, `railTitle: "Scope refusals"`, `paragraphs: [P1, P2]` (P1 starts `"Maintainers close issues when they could fix them"`, P2 starts `"The implication for builders"`), `pullQuote: { text: "The closed-wontfix label is the closest thing the open source ecosystem has to a 'yes, but not here' signal.", attribution: "— from the analysis" }`, `figure: { eyebrow: "FIGURE 1 · WONTFIX CLOSURES BY CATEGORY", caption: "Devtools and developer-experience closures grew 4.1× while infrastructure stayed flat.", placeholderText: "Chart placeholder — line chart, 24-month rising trend" }`.
  2. `id: "comment-count"`, `title: "Two: comment count is the demand signal you ignore at your peril."`, `railTitle: "Comment count"`, `paragraphs: [P1]` (starts `"An issue that closes with three comments is a non-event"`).
  3. `id: "willingness-to-pay"`, `title: "Three: willingness-to-pay leaks out in comments."`, `railTitle: "Willingness-to-pay"`, `paragraphs: [P1]` (starts `"You will find phrases like 'I'd literally pay for this'"`).
  4. `id: "method-data"`, `title: "Method & data."`, `railTitle: "Method & data"`, `paragraphs: [P1, P2]` (P1 starts `"We pulled issues from GitHub's public API"`, P2 starts `"The full anonymized dataset is available to Pro and Team subscribers"`).

**Articles 2-7 (stubs)** — `featured: false`, `stubBody: true`, `sections: []`, no `pullQuote`. Each carries the verbatim card-preview metadata + `body.stubLead` from spec §11 / contracts:
- Article 2: `slug: "three-signals-that-separate-a-product-from-a-feature"`, `category: "product-strategy"`, `date: "2026-05-01"`, `displayDate: "MAY 1 2026"`, `readTimeMinutes: 6`, `stubLead` starts `"You can read 200 complaints and still build the wrong thing"`.
- Article 3: `slug: "how-we-tracked-4m-unmet-demand-developer-tool-60-days"`, `category: "indie-hacker"`, `date: "2026-04-22"`, `displayDate: "APR 22 2026"`, `readTimeMinutes: 7`, `stubLead` starts `"A case study using the willingness-to-pay column you have been ignoring"`.
- Article 4: `slug: "vercel-cold-starts-shared-hosting-cpu-limits"`, `category: "devtools"`, `date: "2026-04-14"`, `displayDate: "APR 14 2026"`, `readTimeMinutes: 5`, `stubLead` starts `"A frequency chart, a momentum chart"`.
- Article 5: `slug: "why-pricing-pages-worst-place-discover-demand"`, `category: "product-strategy"`, `date: "2026-04-03"`, `displayDate: "APR 3 2026"`, `readTimeMinutes: 8`, `stubLead` starts `"Comparing what people say they will pay"`.
- Article 6: `slug: "field-notes-32-paid-customer-interviews"`, `category: "indie-hacker"`, `date: "2026-03-27"`, `displayDate: "MAR 27 2026"`, `readTimeMinutes: 11`, `stubLead` starts `"A small experiment, with verbatim transcripts"`.
- Article 7: `slug: "app-store-reviews-most-underused-product-research-surface"`, `category: "data-analysis"`, `date: "2026-03-20"`, `displayDate: "MAR 20 2026"`, `readTimeMinutes: 6`, `stubLead` starts `"They are public, attributed, time-stamped"`.

All 7 articles use `authorName: "Cornel Okoth"` + `authorInitials: "CO"` (FR-021 / SC-030 / clarification (f)).

- **Files**: `apps/web/src/components/blog/blog-articles.ts`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; `head -1 apps/web/src/components/blog/blog-articles.ts` returns the `[PLACEHOLDER]` header; `BLOG_ARTICLES.length === 7`; filter by `featured: true` returns exactly 1 entry (the GitHub-issues article); filter by `stubBody: true` returns exactly 6 entries; the featured article has `sections.length === 4` with the 4 ids `scope-refusals` / `comment-count` / `willingness-to-pay` / `method-data` in order; the featured article's `pullQuote.text` starts `"17% of closed-wontfix issues"`; section 1 has `figure.eyebrow === "FIGURE 1 · WONTFIX CLOSURES BY CATEGORY"`; verbatim opening-phrase greps clean (each of the 10 distinctive opener strings in quickstart §"Article body integrity" matches at least once); all 7 articles have `authorName: "Cornel Okoth"` (`grep -c '"Cornel Okoth"'` returns `7`); voice grep on prose clean (no `!` outside JS-operator carve-out, no emoji, no `amazing`/`awesome`); the apostrophe-quote constructs (`'look at trends.'`, `"yes, but not here"`, `'I'd literally pay for this'`) and the dollar sign in article 3's title (`$4M`) are present and are intentional punctuation.
- **Commit**: `feat(web): add blog-articles with featured + 6 stub articles (slice 010)`

**▸ STOP 1** — foundations ready: types defined, 7-article data store in place with `[PLACEHOLDER]` header + featured-full-body + 6-stub structure + verbatim opening phrases + Cornel byline on all 7. Verification per T001/T002 Verify lines; STOP 1 gate also runs `pnpm --filter web typecheck && pnpm --filter web lint` against the two foundation files.

---

## Batch B — template primitives  ▸ STOP 2

### Phase 3: User Story 1 (index primitives) + User Story 2 (post primitives) + User Story 3 (stub treatment primitives)

### T003 · [P] [US1] `BlogHero` (server — index hero)
Create `apps/web/src/components/blog/blog-hero.tsx` — async Server Component. Renders the `/blog` page hero per `design/Public_pages.pdf` page 5 and contracts:
```tsx
<section className="pt-section pb-loose">
  <p className="font-mono text-body-sm uppercase tracking-wider text-accent-bristle">BRISTLE BLOG</p>
  <h1 className="mt-grid font-serif text-display-lg text-text-primary">Field Notes</h1>
  <p className="mt-grid max-w-2xl text-body-md text-text-secondary">
    Research, analysis, and the occasional opinion on building products against evidence.
  </p>
</section>
```
Zero hex literals, zero font-family literals. No props (the hero is identical on every render of `/blog`).
- **Files**: `apps/web/src/components/blog/blog-hero.tsx`
- **Depends on**: T001 (no direct import, but the module convention is established by T001)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders `BRISTLE BLOG` eyebrow in `text-accent-bristle`; serif `Field Notes` h1; subhead in `text-text-secondary`; `grep -E "#[0-9A-Fa-f]{3,8}" apps/web/src/components/blog/blog-hero.tsx` returns 0; `grep -E "font-family|font-name"` returns 0.
- **Commit**: `feat(web): add BlogHero (eyebrow + Field Notes serif h1 + subhead) (slice 010)`

### T004 · [P] [US2] [US3] `BlogPostHero` (server — article hero)
Create `apps/web/src/components/blog/blog-post-hero.tsx` — async Server Component. Accepts `props: { article: BlogArticle }`. Renders per `design/Public_pages.pdf` page 6:
- `<header className="pt-section pb-loose">`
- `<p>` eyebrow in `font-mono text-body-sm uppercase tracking-wider text-accent-bristle` reading `BRISTLE BLOG`.
- `<h1>` in `font-serif text-display-lg text-text-primary` rendering `{article.title}`.
- `<p>` meta row in `text-body-sm text-text-secondary` rendering `{article.displayDate} · {categoryLabel(article.category)} · {article.authorName} · {article.readTimeMinutes} min read` with bullet (`·`) separators (use `·` or just `·` literal). The `categoryLabel` helper maps the `BlogCategory` literal to its display label (`"data-analysis"` → `"Data analysis"`, `"product-strategy"` → `"Product strategy"`, `"indie-hacker"` → `"Indie hacker"`, `"devtools"` → `"Devtools"`); colocate inline as a small helper function in this file or in a shared `category-label.ts` module — recommend inline (used by 3 components but copy is short).
- Author-initials avatar — `<span aria-hidden="true" className="...rounded-full ring-1 ring-border-default ...">{article.authorInitials}</span>` (the visible byline is in the meta row prose; the avatar is decorative).
- Zero hex literals.
- **Files**: `apps/web/src/components/blog/blog-post-hero.tsx`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; imports `BlogArticle` from `./types`; renders `<h1>` with `article.title`; meta row contains `article.displayDate`, category label, `article.authorName`, `article.readTimeMinutes`; avatar carries `aria-hidden="true"`; hex grep clean.
- **Commit**: `feat(web): add BlogPostHero (eyebrow + serif h1 + meta row + initials avatar) (slice 010)`

### T005 · [P] [US2] `InlinePullQuote` (server)
Create `apps/web/src/components/blog/inline-pull-quote.tsx` — async Server Component. Accepts `props: { quote: BlogPullQuote }`. Renders:
```tsx
<figure className="my-section">
  <blockquote className="border-l-4 border-accent-bristle pl-grid font-serif text-display-sm text-text-primary">
    {quote.text}
  </blockquote>
  <cite className="mt-tight block text-body-sm text-text-secondary">{quote.attribution}</cite>
</figure>
```
Used both inline within a section's paragraphs (by `BlogPostBody`) and potentially elsewhere. Zero hex literals.
- **Files**: `apps/web/src/components/blog/inline-pull-quote.tsx`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders `<blockquote>` with serif type + accent-bristle left border; `<cite>` for attribution; hex grep clean.
- **Commit**: `feat(web): add InlinePullQuote (serif blockquote + attribution) (slice 010)`

### T006 · [P] [US2] `InlineFigure` (server — hand-rolled inline SVG line chart)
Create `apps/web/src/components/blog/inline-figure.tsx` — async Server Component. Accepts `props: { figure: BlogFigure }`. Renders a hand-rolled inline SVG line chart per plan §D8 / contracts:
```tsx
<figure className="my-section flex flex-col gap-tight">
  <p className="font-mono text-body-sm uppercase tracking-wider text-text-secondary">{figure.eyebrow}</p>
  <svg viewBox="0 0 720 200" role="img" aria-label={figure.caption} className="w-full h-auto" preserveAspectRatio="none">
    {/* 5 horizontal grid lines */}
    <g className="stroke-border-default opacity-40">
      <line x1="0" y1="40"  x2="720" y2="40"  strokeWidth="1" />
      <line x1="0" y1="80"  x2="720" y2="80"  strokeWidth="1" />
      <line x1="0" y1="120" x2="720" y2="120" strokeWidth="1" />
      <line x1="0" y1="160" x2="720" y2="160" strokeWidth="1" />
      <line x1="0" y1="200" x2="720" y2="200" strokeWidth="1" />
    </g>
    {/* Rising line — 12 data points */}
    <path
      d="M 20 170 L 80 165 L 140 155 L 200 150 L 260 138 L 320 130 L 380 115 L 440 100 L 500 85 L 560 65 L 620 45 L 680 30"
      className="stroke-accent-bristle"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* 4 x-axis labels */}
    <g className="fill-text-secondary" fontSize="11">
      <text x="20"  y="195" textAnchor="middle">Q1 ’24</text>
      <text x="220" y="195" textAnchor="middle">Q3 ’24</text>
      <text x="420" y="195" textAnchor="middle">Q1 ’25</text>
      <text x="620" y="195" textAnchor="middle">Q4 ’25</text>
    </g>
  </svg>
  <figcaption className="text-body-sm text-text-secondary">{figure.caption}</figcaption>
</figure>
```
**The component MUST NOT read or render `figure.placeholderText`** — that field is developer-facing data only (parallels slice-009 FR-018 / `reviewNote?` discipline). All colors via Tailwind utilities (`stroke-accent-bristle`, `stroke-border-default`, `fill-text-secondary`); NO inline `style="stroke: #..."`, NO hex literals anywhere in the file. NO chart library imports (`recharts`, `chart.js`, etc.).
- **Files**: `apps/web/src/components/blog/inline-figure.tsx`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; SVG `viewBox="0 0 720 200"`; `<path>` has exactly 11 `L` commands (12 data points = 1 `M` + 11 `L`); 5 `<line>` grid elements; 4 `<text>` axis labels; SVG carries `role="img"` and `aria-label={figure.caption}`; `grep "placeholderText" apps/web/src/components/blog/inline-figure.tsx` returns **0 hits** (component must not reference the field); `grep -E "#[0-9A-Fa-f]{3,8}|stroke=\"rgb"` returns 0 (tokens-only); `grep -E "recharts|chart\\.js|victory|nivo|echarts"` returns 0 (no chart library import).
- **Commit**: `feat(web): add InlineFigure (hand-rolled SVG line chart, tokens-only) (slice 010)`

### T007 · [P] [US2] [US3] `TryBristleCard` (server — fixed conversion CTA)
Create `apps/web/src/components/blog/try-bristle-card.tsx` — async Server Component. No props (content is fixed module-level constants per FR-017 — same across all 7 article pages). Renders:
```tsx
<aside className="rounded-card border border-border-default bg-surface-card p-card flex flex-col gap-grid">
  <p className="font-mono text-body-sm uppercase tracking-wider text-accent-bristle">TRY BRISTLE</p>
  <h3 className="font-serif text-heading-h3 text-text-primary">See today's high-signal problems.</h3>
  <Link href="/signup" className="...primary-button-styles rounded-btn bg-text-primary text-surface-card text-body-md font-medium px-grid py-tight ...">
    Start free
  </Link>
</aside>
```
Use Next.js `Link` from `next/link`. The `/signup` destination is a known-out-of-scope soft-404 until Tier 3 slice 3.1 — documented carry-forward. Zero hex literals.
- **Files**: `apps/web/src/components/blog/try-bristle-card.tsx`
- **Depends on**: T001 (no direct import; module convention)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; eyebrow `TRY BRISTLE` in `text-accent-bristle`; serif h3 with exact text `See today's high-signal problems.`; `Link` from `next/link` with `href="/signup"` and `Start free` label; hex grep clean.
- **Commit**: `feat(web): add TryBristleCard (TRY BRISTLE eyebrow + serif headline + Start free CTA) (slice 010)`

### T008 · [P] [US1] `BlogFeaturedCard` (server — index featured card with IN THIS ISSUE callout)
Create `apps/web/src/components/blog/blog-featured-card.tsx` — async Server Component. Accepts `props: { article: BlogArticleCard }`. Renders the index featured card per `design/Public_pages.pdf` page 5:
```tsx
<article className="rounded-card border border-border-default bg-surface-card p-card flex flex-col gap-grid md:grid md:grid-cols-[1fr_auto] md:gap-section">
  <div className="flex flex-col gap-grid">
    <p className="text-body-sm text-text-secondary">{article.displayDate} · {categoryLabel(article.category)}</p>
    <h2 className="font-serif text-heading-h2 text-text-primary">
      <Link href={`/blog/${article.slug}`} className="hover:text-accent-bristle">{article.title}</Link>
    </h2>
    <p className="text-body-md text-text-secondary">{article.summary}</p>
    <p className="text-body-sm text-text-tertiary">{article.authorName} · {article.readTimeMinutes} min read</p>
  </div>
  {article.pullQuote && (
    <aside aria-label="In this issue" className="rounded-card bg-surface-raised p-card flex flex-col gap-tight md:max-w-xs">
      <p className="font-mono text-body-sm uppercase tracking-wider text-text-secondary">IN THIS ISSUE</p>
      <blockquote className="font-serif text-body-lg text-text-primary">{article.pullQuote.text}</blockquote>
      <cite className="text-body-sm text-text-secondary">{article.pullQuote.attribution}</cite>
    </aside>
  )}
</article>
```
The whole card is keyboard-navigable via the `<h2><Link>` (cards are NOT wrapped in a single outer Link — that's an a11y anti-pattern). Zero hex literals. Co-locate the `categoryLabel` helper or import it from a shared module if added during T004.
- **Files**: `apps/web/src/components/blog/blog-featured-card.tsx`
- **Depends on**: T001 (imports `BlogArticleCard`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders `<article>` element; `<h2>` wrapping `<Link href={`/blog/${article.slug}`}>`; IN THIS ISSUE `<aside aria-label="In this issue">` renders only when `article.pullQuote` is set; hex grep clean.
- **Commit**: `feat(web): add BlogFeaturedCard (featured card + IN THIS ISSUE pullquote callout) (slice 010)`

### T009 · [P] [US1] `BlogArticleCard` (server — secondary card)
Create `apps/web/src/components/blog/blog-article-card.tsx` — async Server Component. Accepts `props: { article: BlogArticleCard }`. Renders a secondary article card per `design/Public_pages.pdf` page 5 (the 3×2 grid items):
```tsx
<article className="rounded-card border border-border-default bg-surface-card p-card flex flex-col gap-grid hover:border-border-strong transition-colors duration-120">
  <p className="text-body-sm text-text-secondary">{article.displayDate} · {categoryLabel(article.category)}</p>
  <h2 className="font-serif text-heading-h3 text-text-primary">
    <Link href={`/blog/${article.slug}`} className="hover:text-accent-bristle">{article.title}</Link>
  </h2>
  <p className="text-body-md text-text-secondary line-clamp-2">{article.summary}</p>
  <p className="mt-auto text-body-sm text-text-tertiary">{article.authorName} · {article.readTimeMinutes} min read</p>
</article>
```
Hover state per §4.5 — 120ms color transition only, no scale or rotate. Card is `<article>` (US1 a11y posture). Zero hex literals.
- **Files**: `apps/web/src/components/blog/blog-article-card.tsx`
- **Depends on**: T001 (imports `BlogArticleCard`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders `<article>` with `<h2>` wrapping `<Link href={`/blog/${article.slug}`}>`; hover state on the card border via `hover:border-border-strong` (color-only); `duration-120` (120ms per §4.5); hex grep clean.
- **Commit**: `feat(web): add BlogArticleCard (secondary card with hover state + Link to /blog/{slug}) (slice 010)`

### T010 · [P] [US2] `BlogRailToc` (client — third structural mirror of slice-006/009 rails)
Create `apps/web/src/components/blog/blog-rail-toc.tsx` as the slice's first `"use client"` file. Structurally mirrors slice-006 `apps/web/src/components/faq/scroll-spy-rail.tsx` and slice-009 `apps/web/src/components/legal/toc-rail.tsx` **without importing from either** (additive only; FR-013 / plan §D6). Start the file with `"use client";`.

Specifics — per plan §D6 / contracts:
- Props: `{ items: ReadonlyArray<BlogTocItem>; ariaLabel?: string }` with `ariaLabel` defaulting to `"Sections of the article"` (article-scoped vs slice-009's page-scoped `"Sections of the page"` — distinguishes from TopNav landmark on the same page).
- **Empty-items early return**: `if (items.length === 0) return null;` — stub-body articles pass an empty array and the rail must not render. (Hooks must NOT run before this early return — alternative is to render the JSX conditionally inside the return path. Implementor's choice; both pass typecheck. Recommend hoisting the empty check before all hook calls to keep the React rules-of-hooks clean: the hooks order is invariant across renders since the same article never toggles between stub and full-body without a route change.) **However**, if React's hook discipline blocks an early `return null` before `useState`, restructure to `if (items.length === 0) { return null; }` AFTER all hook calls but before any DOM-dependent useEffect work (or use a sentinel state pattern). The slice-009 TocRail returns the JSX unconditionally; for slice 010, the cleaner shape is to do the empty check at the call site in `BlogPostLayout` (pass `<BlogRailToc items={tocItems} />` only when `tocItems.length > 0`) and have the rail itself NOT check items.length. **Decision**: do the empty check at the call site (`BlogPostLayout`); `BlogRailToc` itself unconditionally renders its hooks + JSX assuming `items.length > 0`. This avoids the rules-of-hooks edge case entirely. (Update contracts §"Client component" sketch accordingly during T010.)
- `useState<string>(items[0]?.id ?? "")` for active section — flicker fix (initial active = first section id).
- `useRef<Map<string, number>>(new Map())` for `visibleSections` (IO topY tracking).
- `useRef<Map<string, HTMLAnchorElement>>(new Map())` for `mobilePillRefs`.
- Constants: `ROOT_MARGIN = "-80px 0px -55% 0px"`, `PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"`, `DESKTOP_MQ = "(min-width: 768px)"`.
- First `useEffect` (mount-only): `document.querySelectorAll<HTMLElement>("[data-blog-section]")` → new `IntersectionObserver` with `{ rootMargin: ROOT_MARGIN, threshold: 0 }`; callback updates `visibleSections` Map (set on intersect, delete on non-intersect); after batch, if `visibleSections.size === 0` early-return without clearing (no flicker); otherwise linear scan for smallest `topY` → `setActive(topId)`; cleanup disconnects observer.
- Second `useEffect` keyed on `[active]`: mobile pill auto-scroll. `if (window.matchMedia(DESKTOP_MQ).matches) return` (desktop no-op); `pill = mobilePillRefs.current.get(active)`; `pill.scrollIntoView({inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth"})` reading reduced-motion fresh.
- `handleClick(e, sectionId)`: modifier-key passthrough — `if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return` (Cmd/Ctrl/middle/shift clicks fall through to native anchor behavior — open in new tab / etc.); otherwise `e.preventDefault()`, find target by id, read reduced-motion fresh, `target.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"})`.
- Render: `<nav aria-label={ariaLabel}>` wrapping:
  - Desktop sticky vertical rail: `<ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">`. Each item: `<a href="#{item.id}" aria-current={isActive ? "location" : undefined} onClick={(e) => handleClick(e, item.id)}>{item.displayTitle}</a>`. Active class: `border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary`; inactive: `border-l-2 border-transparent py-1 pl-snug text-text-secondary hover:text-text-primary`. Focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle`.
  - Mobile horizontal pill row: `<ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">`. Each pill is `<a>` with ref registered to `mobilePillRefs`. Active: `bg-text-primary text-surface-card rounded-pill px-grid py-1.5`; inactive: `border border-border-default bg-surface-card text-text-secondary rounded-pill`. Same focus ring.
- **NO** `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, or `aria-orientation` anywhere in the file (current-location nav pattern; same posture as slice-006 STOP-2 fix carried into slice 009).
- **NO** import from `apps/web/src/components/faq/scroll-spy-rail.tsx` or `apps/web/src/components/legal/toc-rail.tsx`.
- Zero hex literals.
- **Files**: `apps/web/src/components/blog/blog-rail-toc.tsx`
- **Depends on**: T001 (imports `BlogTocItem`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file starts with `"use client";`; imports `useState`, `useEffect`, `useRef` from `react` and `type MouseEvent`; imports `BlogTocItem` from `./types`; selector literal `"[data-blog-section]"` present (NOT `"[data-faq-item]"` or `"[data-legal-section]"`); `rootMargin: "-80px 0px -55% 0px"` present; `threshold: 0` present; `<nav aria-label=` present; `aria-current={` present; NO `role="tablist"` / `role="tab"` / `aria-selected` substrings anywhere (`grep` returns 0); reduced-motion read inside `handleClick` and inside the mobile-pill `useEffect` (not at module top); `grep -E "scroll-spy-rail|legal/toc-rail" apps/web/src/components/blog/blog-rail-toc.tsx` returns 0 (additive only — no import of prior rails); hex grep clean.
- **Commit**: `feat(web): add BlogRailToc (client, IO scroll-spy + current-location nav, third mirror of FAQ/Legal rails) (slice 010)`

### T011 · [US2] [US3] `BlogPostBody` (server — branches on stubBody)
Create `apps/web/src/components/blog/blog-post-body.tsx` — async Server Component. Accepts `props: { article: BlogArticle }`. Branches on `article.stubBody` per plan §D12 / contracts:

**Stub branch** (`article.stubBody === true`):
```tsx
<div className="flex flex-col gap-grid">
  {article.body.stubLead && (
    <p className="font-serif text-body-lg leading-relaxed text-text-primary">{article.body.stubLead}</p>
  )}
  <p className="italic text-body-md text-text-secondary">Full article forthcoming.</p>
</div>
```
**NO** `<section data-blog-section="...">` elements emitted (verified by SC-026: curl-grep on stub routes returns 0 for `data-blog-section`).

**Full branch** (`article.stubBody === false`):
```tsx
<div className="flex flex-col gap-section">
  {/* Lead */}
  <div className="flex flex-col gap-grid">
    {article.body.lead.map((p, i) => (
      <p key={i} className="font-serif text-body-lg leading-relaxed text-text-primary">{p}</p>
    ))}
  </div>
  {/* Sections */}
  {article.sections.map((section) => (
    <section
      key={section.id}
      id={section.id}
      data-blog-section={section.id}
      className="flex flex-col gap-grid scroll-mt-section"
    >
      <h2 className="font-serif text-heading-h3 text-text-primary">{section.title}</h2>
      {section.paragraphs.map((p, i) => (
        <Fragment key={i}>
          <p className="font-serif text-body-lg leading-relaxed text-text-primary">{p}</p>
          {section.pullQuote && i === 0 && <InlinePullQuote quote={section.pullQuote} />}
        </Fragment>
      ))}
      {section.figure && <InlineFigure figure={section.figure} />}
    </section>
  ))}
</div>
```
The `scroll-mt-section` class on each section ensures deep-link anchors (`#scope-refusals`, `#willingness-to-pay`, etc.) don't land hidden behind the visible top nav. Inline `<InlinePullQuote>` renders **between paragraph index 0 and 1** of a section (after the first paragraph). Inline `<InlineFigure>` renders **after all paragraphs** in a section. Zero hex literals.
- **Files**: `apps/web/src/components/blog/blog-post-body.tsx`
- **Depends on**: T001, T005 (InlinePullQuote), T006 (InlineFigure)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; imports `BlogArticle` from `./types`; imports `InlinePullQuote` from `./inline-pull-quote`; imports `InlineFigure` from `./inline-figure`; branches on `article.stubBody` (two return paths); stub branch renders `Full article forthcoming.` caption; full branch renders `<section id={section.id} data-blog-section={section.id}>` with `<h2>{section.title}</h2>`; pull-quote conditional renders only when `i === 0` (after first paragraph); figure conditional renders after the paragraphs `.map`; `grep "Fragment" apps/web/src/components/blog/blog-post-body.tsx` shows `Fragment` imported from `react` (or use `<>...</>` shorthand — but shorthand can't carry `key`, so import `Fragment` for the keyed case); hex grep clean.
- **Commit**: `feat(web): add BlogPostBody (server, branches on stubBody, lead + sections + inline pullquote/figure) (slice 010)`

**▸ STOP 2** — template primitives done: 9 components typecheck in isolation (8 server + 1 client). `BlogRailToc` is the only client component in Batch B. The empty-items rendering decision lives at the `BlogPostLayout` call site, not inside the rail itself (decided during T010). STOP 2 gate also runs `grep -l "use client" apps/web/src/components/blog/` and confirms exactly 1 match (`blog-rail-toc.tsx`); hex/font/voice/emoji greps clean across all 9 new files.

---

## Batch C — Client interactions + Layout + Routes  ▸ STOP 3

### Phase 4: User Story 1 (index assembly + filter) + US2 (post assembly) + US3 (stub treatment) + US4 (nav-link flip)

### T012 · [US1] `BlogFilterChips` (client — presentational, role="toolbar" + aria-pressed)
Create `apps/web/src/components/blog/blog-filter-chips.tsx` as the slice's second `"use client"` file. Start file with `"use client";`. Per plan §D7 (Pattern A: `role="toolbar"` + `aria-pressed`). Accepts `props: { selected: BlogCategory | "all"; onSelect: (next: BlogCategory | "all") => void }`. **Presentational** — owns no state.

Define a module-level `CHIPS` constant:
```ts
const CHIPS: ReadonlyArray<{ value: BlogCategory | "all"; label: string }> = [
  { value: "all",              label: "All" },
  { value: "data-analysis",    label: "Data analysis" },
  { value: "product-strategy", label: "Product strategy" },
  { value: "indie-hacker",     label: "Indie hacker" },
  { value: "devtools",         label: "Devtools" },
] as const;
```

Render:
```tsx
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
            ? "rounded-pill bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            : "rounded-pill border border-border-default bg-surface-card px-snug py-1 text-body-sm text-text-secondary transition-colors duration-120 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        }
      >
        {chip.label}
      </button>
    );
  })}
</div>
```

**NO** `role="radiogroup"` / `role="radio"` / `aria-checked`. Tab order: chips in DOM order (no roving tabindex). 120ms color transition per §4.5. Zero hex literals.
- **Files**: `apps/web/src/components/blog/blog-filter-chips.tsx`
- **Depends on**: T001 (imports `BlogCategory`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file starts with `"use client";`; imports `BlogCategory` from `./types`; renders `<div role="toolbar" aria-label="Filter articles by category">`; 5 `<button type="button">` chips in order `All`, `Data analysis`, `Product strategy`, `Indie hacker`, `Devtools`; each chip has `aria-pressed={isSelected}`; NO `role="radiogroup"` / `role="radio"` / `aria-checked` (`grep` returns 0); active state = filled dark pill (`bg-text-primary text-surface-card rounded-pill`); inactive = outlined pill (`border-border-default bg-surface-card`); hex grep clean.
- **Commit**: `feat(web): add BlogFilterChips (client, role="toolbar" + aria-pressed, 5 chips) (slice 010)`

### T013 · [US1] `BlogArticleGrid` (client — owns useState, Pick'd input, featured-inline-on-filter)
Create `apps/web/src/components/blog/blog-article-grid.tsx` as the slice's third `"use client"` file. Start file with `"use client";`. Per plan §D5 + §D13. Accepts `props: { articles: ReadonlyArray<BlogArticleCard> }`. **Owns `useState<BlogCategory | "all">("all")`**; renders chips + featured + secondary grid conditionally based on selection.

```tsx
"use client";

import { useState } from "react";
import type { BlogArticleCard, BlogCategory } from "./types";
import { BlogFilterChips } from "./blog-filter-chips";
import { BlogFeaturedCard } from "./blog-featured-card";
import { BlogArticleCard } from "./blog-article-card";

type Selection = BlogCategory | "all";

interface BlogArticleGridProps {
  articles: ReadonlyArray<BlogArticleCard>;
}

export function BlogArticleGrid({ articles }: BlogArticleGridProps) {
  const [selected, setSelected] = useState<Selection>("all");

  const featured = articles.find((a) => a.featured);
  const showFeaturedSlot = selected === "all" && featured !== undefined;

  // When "all" is active: featured renders in its own slot above; grid = 6 non-featured.
  // When a category filter is active: featured (if it matches) renders inline in the grid alongside other matching articles.
  const grid = selected === "all"
    ? articles.filter((a) => !a.featured)
    : articles.filter((a) => a.category === selected);

  return (
    <div className="flex flex-col gap-section">
      <BlogFilterChips selected={selected} onSelect={setSelected} />
      {showFeaturedSlot && featured && <BlogFeaturedCard article={featured} />}
      <div className="grid gap-grid sm:grid-cols-2 lg:grid-cols-3">
        {grid.map((a) => <BlogArticleCard key={a.slug} article={a} />)}
      </div>
    </div>
  );
}
```

Single source of truth for filter state; `BlogFilterChips` receives `selected` + `onSelect` as props. No context provider. Zero hex literals. NO URL state (no `useSearchParams`).
- **Files**: `apps/web/src/components/blog/blog-article-grid.tsx`
- **Depends on**: T001, T008 (BlogFeaturedCard), T009 (BlogArticleCard), T012 (BlogFilterChips)
- **Verify**: `pnpm --filter web typecheck` exits 0; file starts with `"use client";`; imports `useState` from `react`; imports `BlogArticleCard, BlogCategory` types from `./types`; imports `BlogFilterChips`, `BlogFeaturedCard`, `BlogArticleCard` components; declares `useState<Selection>("all")` exactly once; renders chips + featured slot (conditional on `selected === "all"`) + grid (filtered); grid uses `sm:grid-cols-2 lg:grid-cols-3` (3-col on desktop, 2-col on `sm`-`md`, single-col below); featured-inline-on-filter behavior present (when `selected !== "all"`, featured article — if its category matches — appears in the `grid` array); hex grep clean.
- **Commit**: `feat(web): add BlogArticleGrid (client, owns filter useState, Pick'd input, featured-inline-on-filter) (slice 010)`

### T014 · [US2] [US3] `BlogPostLayout` (server — shared template, md:grid-cols-[1fr_18rem] right-rail)
Create `apps/web/src/components/blog/blog-post-layout.tsx` — async Server Component. Accepts `props: { article: BlogArticle }`. Per plan §D12b (right-rail at 18rem) / contracts:

```tsx
import { TopNav } from "@/components/landing/top-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { BlogPostHero } from "./blog-post-hero";
import { BlogPostBody } from "./blog-post-body";
import { BlogRailToc } from "./blog-rail-toc";
import { TryBristleCard } from "./try-bristle-card";
import type { BlogArticle, BlogTocItem } from "./types";

interface BlogPostLayoutProps {
  article: BlogArticle;
}

export function BlogPostLayout({ article }: BlogPostLayoutProps) {
  // Project sections → TOC items per plan §D4 (railTitle ?? title fallback).
  const tocItems: BlogTocItem[] = article.sections.map((s) => ({
    id: s.id,
    displayTitle: s.railTitle ?? s.title,
  }));

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid">
        <BlogPostHero article={article} />
        <div className="grid gap-grid pb-section md:grid-cols-[1fr_18rem] md:gap-section">
          <div className="flex flex-col gap-section">
            <BlogPostBody article={article} />
          </div>
          <aside className="flex flex-col gap-grid">
            {tocItems.length > 0 && <BlogRailToc items={tocItems} />}
            <TryBristleCard />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
```

The empty-items check (`tocItems.length > 0 && <BlogRailToc...>`) is at the call site, not inside the rail — per T010 decision. On stub articles, `tocItems` is empty, `BlogRailToc` is not rendered, and the right column collapses to just `TryBristleCard`. The 2-col grid template `md:grid-cols-[1fr_18rem]` does NOT collapse (right column retains its width via the aside container, even when it contains only `TryBristleCard`).

Imports use the existing slice-005 `TopNav` and `SiteFooter` unchanged. Zero hex literals. No `"use client"`.
- **Files**: `apps/web/src/components/blog/blog-post-layout.tsx`
- **Depends on**: T001 (types), T004 (BlogPostHero), T007 (TryBristleCard), T010 (BlogRailToc), T011 (BlogPostBody)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders top nav + main + grid + site footer in order; grid template `md:grid-cols-[1fr_18rem]` present (right rail at 18rem); `BlogRailToc` rendered conditionally on `tocItems.length > 0` (not unconditionally); `TryBristleCard` rendered unconditionally; projection logic present (`s.railTitle ?? s.title`); `grep -E "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add BlogPostLayout (server template, right-rail 18rem, conditional BlogRailToc) (slice 010)`

### T015 · [US1] [US4] `/blog/page.tsx` (REWRITE — slice-005 ComingSoon stub → full Field Notes index)
**Wholesale rewrite** of `apps/web/src/app/blog/page.tsx`. The slice-005 file content is:
```tsx
import { ComingSoon } from "@/components/coming-soon";
export const metadata = { robots: { index: false, follow: false } };
export default function Page() { return <ComingSoon version="0.2.4" />; }
```
Replace entirely with the full Blog index per plan §D1 + §D13 / contracts:

```tsx
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { TopNav } from "@/components/landing/top-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { BlogHero } from "@/components/blog/blog-hero";
import { BlogArticleGrid } from "@/components/blog/blog-article-grid";
import { BLOG_ARTICLES } from "@/components/blog/blog-articles";
import type { BlogArticleCard } from "@/components/blog/types";

const TITLE = "Field Notes — Bristle";
const DESCRIPTION = "Research, analysis, and the occasional opinion on building products against evidence.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/blog",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

// Card projection — drops `body` and `sections` from client-bound payload per plan §D13.
const CARDS: ReadonlyArray<BlogArticleCard> = BLOG_ARTICLES.map(
  ({ slug, category, date, displayDate, title, summary, authorName, authorInitials, readTimeMinutes, featured, stubBody, pullQuote }) => ({
    slug, category, date, displayDate, title, summary, authorName, authorInitials, readTimeMinutes, featured, stubBody, pullQuote,
  }),
);

export default async function BlogIndex() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid pb-section">
        <BlogHero />
        <BlogArticleGrid articles={CARDS} />
      </main>
      <SiteFooter />
    </>
  );
}
```

**Removes the slice-005 `robots: { index: false, follow: false }`** — the new page IS launched and indexable (FR-029). No `robots` field in the new metadata. Zero hex literals.
- **Files**: `apps/web/src/app/blog/page.tsx`
- **Depends on**: T001, T002 (BLOG_ARTICLES), T003 (BlogHero), T013 (BlogArticleGrid)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; default export is `async function`; metadata has `title: "Field Notes — Bristle"`, `description` matches verbatim, `openGraph.type: "website"`, `openGraph.url: SITE_URL + "/blog"`, absolute OG image; **NO `robots` field** in the new metadata (`grep "robots" apps/web/src/app/blog/page.tsx` returns 0); CARDS projection present (dropping `body` and `sections`); `grep "ComingSoon" apps/web/src/app/blog/page.tsx` returns 0 (full rewrite); imports `BlogArticleCard` as type-only.
- **Commit**: `feat(web): rewrite /blog → Field Notes index (replaces slice-005 ComingSoon stub) (slice 010)`

### T016 · [US2] [US3] [US4] `/blog/[slug]/page.tsx` (ADD — generateStaticParams + generateMetadata + notFound)
Create `apps/web/src/app/blog/[slug]/page.tsx` — brand-new dynamic route. Per plan §D9 + §D10 + §D11 / contracts:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@bristle/shared";
import { BlogPostLayout } from "@/components/blog/blog-post-layout";
import { BLOG_ARTICLES } from "@/components/blog/blog-articles";

interface Params { slug: string }

export async function generateStaticParams(): Promise<Array<Params>> {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));   // 7 entries → 7 ○ Static
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};
  const title = `${article.title} — Bristle`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: article.summary,
    openGraph: {
      title,
      description: article.summary,
      type: "article",                                          // canonical OG type for blog posts (plan §D10)
      url: `${SITE_URL}/blog/${article.slug}`,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  };
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

**No `robots` field** → indexable (FR-029). `notFound()` produces the Next.js default 404 (no custom blog 404 this slice — Tier-7 polish ships the global Bristle-voiced 404 per `design/System_pages.pdf` page 1). The Next.js 15 async-params shape is used (`params: Promise<Params>` + `await params`); matches React 19 / Next.js 15 conventions. Zero hex literals.
- **Files**: `apps/web/src/app/blog/[slug]/page.tsx`
- **Depends on**: T002 (BLOG_ARTICLES), T014 (BlogPostLayout)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; `generateStaticParams` returns `BLOG_ARTICLES.map((a) => ({slug: a.slug}))`; `generateMetadata` constructs title `${article.title} — Bristle`, description = `article.summary`, `openGraph.type: "article"`, `openGraph.url` absolute (`${SITE_URL}/blog/${article.slug}`); default export calls `notFound()` on unknown slug; renders `<BlogPostLayout article={article} />`; imports `notFound` from `next/navigation`; NO `robots` field (`grep "robots" apps/web/src/app/blog/\[slug\]/page.tsx` returns 0); hex grep clean.
- **Commit**: `feat(web): add /blog/[slug] route (generateStaticParams + dynamic metadata + notFound) (slice 010)`

**▸ STOP 3** — stateful interactions assembled; layout composed; both routes wired. The slice-005 top-nav `Blog` link (line 5) and site-footer `Blog` link (line 17) flip from soft-404 → live the moment the rewrite of `/blog/page.tsx` is in place (without touching top-nav or footer files). STOP 3 gate runs `pnpm typecheck && pnpm lint && pnpm --filter web build` and reads First Load JS budgets for `/blog` + `/blog/[slug]`; if either ≥ 130 KB, investigate.

---

## Batch D — gates  ▸ STOP 4

### Phase 5: User Story 4 (perf / a11y / SEO / voice / responsive floors + slice integrity + nav-link flip)

### T017 · [US4] VERIFY — local gate
Run the local loop + audits against the post-implementation state.
- **Depends on**: T015, T016
- **Verify**:
  - **Build**: `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. *(SC-023)*
  - **First Load JS budgets** (FR-028 / SC-020): `/blog` target ~115-120 KB; `/blog/[slug]` target ~110-115 KB; ALL < 180 KB gz. If any route ≥ 130 KB, investigate bundle leak (full `BlogArticle` shipping in client JSON because CARDS projection was skipped, accidental chart library import, etc.).
  - **Empirical Pick'd-projection savings** (plan §D13): measure the size delta of the `/blog` client bundle WITH the CARDS projection (T015's current state) vs WITHOUT (temporarily edit `/blog/page.tsx` to pass `BLOG_ARTICLES` directly into `BlogArticleGrid`, rebuild, measure; revert immediately). The delta is the concrete number to cite in the PR description per the user's request. Expected ~5-8 KB; if the measurement materially diverges from that range, document the actual number (the projection's value is the savings, not the prediction).
  - **Static prerender** (SC-021): `next build` output marks `/blog` as `○ Static`; the `/blog/[slug]` dynamic route resolves to **7 individual static entries** (one per slug from `generateStaticParams`).
  - **`pnpm-lock.yaml` unchanged** (SC-029): `git diff --stat origin/main..HEAD -- pnpm-lock.yaml` returns empty (zero new deps).
  - **Server/client boundary** (SC-025): `grep -l "use client" apps/web/src/components/blog/ apps/web/src/app/blog/page.tsx apps/web/src/app/blog/\[slug\]/page.tsx` returns **exactly three** files: `blog-filter-chips.tsx`, `blog-article-grid.tsx`, `blog-rail-toc.tsx`. Both route entries are `async function` with no `"use client"`.
  - **Additive-only** (SC-028 / FR-030): `git diff --stat origin/main..HEAD --` shows changes ONLY under `apps/web/src/components/blog/` and `apps/web/src/app/blog/`. Zero modifications under `apps/web/src/components/{landing,pricing,faq,about,contact,legal}/`, `apps/web/src/lib/`, `apps/web/src/app/contact/`, `packages/`, or `design/`. The one existing-file change permitted is `apps/web/src/app/blog/page.tsx` (the wholesale rewrite per FR-001).
  - **Greps on all new files + the two route files** (SC-027): `apps/web/src/components/blog/{types.ts,blog-articles.ts,blog-hero.tsx,blog-post-hero.tsx,inline-pull-quote.tsx,inline-figure.tsx,try-bristle-card.tsx,blog-featured-card.tsx,blog-article-card.tsx,blog-rail-toc.tsx,blog-post-body.tsx,blog-filter-chips.tsx,blog-article-grid.tsx,blog-post-layout.tsx}` + `apps/web/src/app/blog/{page.tsx,[slug]/page.tsx}`:
    - `hex (#[0-9A-Fa-f]{3,8})` — clean (the `Q1 '24` etc. axis labels in `InlineFigure` are `'24` not `#24` — verify).
    - `font-family|font-name` — clean.
    - **Voice grep on user-visible copy** (`grep -nE '"[^"]*![^"]*"|>[^<]*![^<]*<' apps/web/src/components/blog/*.{ts,tsx} apps/web/src/app/blog/**/page.tsx`) — clean. JS-operator carve-out stands; the apostrophe-quotes in the featured article (`'look at trends.'`, `"yes, but not here"`, `'I'd literally pay for this'`) and the `$4M` dollar sign in article 3's title are punctuation, not voice violations.
    - `emoji` — clean.
    - `amazing|awesome` (case-insensitive) — clean.
  - **placeholderText rendering discipline**: start the dev server (`pnpm --filter web start`) and curl `/blog/what-50000-github-issues-reveal-about-developer-pain`; `grep -c "Chart placeholder" /tmp/featured.html` returns **0** — the `placeholderText` developer field never leaks into rendered HTML. (Parallels slice-009 `reviewNote?` discipline.)
  - **Per-page metadata** (SC-017 + SC-018): `curl -s <local>/blog | grep -oE '<title>[^<]+</title>|og:(title|description|url|image|type)'` shows title `Field Notes — Bristle`, all five OG tags, `og:type` = `website`, absolute `og:url`, absolute OG image, **no `<meta name="robots">` in body**. Same checks for each of the 7 `/blog/[slug]` routes — titles per article (`{article.title} — Bristle`), descriptions per `article.summary`, `og:type` = `article`, absolute `og:url` = `${SITE_URL}/blog/${slug}`.
  - **Stub article body check** (SC-026): for each of the 6 secondary slugs, `curl -s <local>/blog/{slug} | grep -F "Full article forthcoming."` returns at least one match; `curl -s <local>/blog/{slug} | grep -cE "data-blog-section"` returns `0`. For the featured slug, `grep -cE "data-blog-section"` returns `4` (the 4 sections).
  - **Cornel byline** (SC-030): `grep -c "Cornel Okoth" apps/web/src/components/blog/blog-articles.ts` returns `7`.
  - **Filter-chip interaction walk** (SC-004): on `<local>/blog`, click each chip and confirm visible article count:
    - `All` → 7 visible (1 featured slot + 6 grid).
    - `Data analysis` → 2 visible (articles 1 + 7 — featured renders inline in grid since no separate slot under filter).
    - `Product strategy` → 2 (articles 2 + 5).
    - `Indie hacker` → 2 (articles 3 + 6).
    - `Devtools` → 1 (article 4).
    - Each chip's `aria-pressed` toggles correctly via DevTools inspector.
  - **Scroll-spy walk on featured** (SC-010, SC-011, SC-012, SC-013, SC-014, SC-015): on `<local>/blog/what-50000-github-issues-reveal-about-developer-pain`, exercise the rail:
    - 4 desktop sticky anchor links visible (`Scope refusals`, `Comment count`, `Willingness-to-pay`, `Method & data`).
    - At 375 width, 4 horizontal pill anchors visible above the body.
    - Click anchor 3 (`Willingness-to-pay`) → smooth-scroll to `#willingness-to-pay`; with OS reduced-motion ON, instant.
    - Scroll naturally → active state follows topmost section; `aria-current="location"` updates on the matching anchor.
    - Cmd-click (Mac) / Ctrl-click anchor 2 → opens in new tab (modifier-key passthrough working).
    - Deep-link `<local>/blog/what-...#method-data` → loads scrolled to `#method-data`, rail anchor 4 becomes active within ~100ms.
    - At 375 width, scroll the page → active mobile pill auto-scrolls horizontally into view.
  - **JS-disabled walk on `/blog`**: open `/blog` with JavaScript disabled in the browser. Verify: the filter chips render as inert buttons (no `onClick` handler fires); the featured `BlogFeaturedCard` + 6 secondary `BlogArticleCard` items all render (server-side, hydration unnecessary for SSR HTML); clicking a card link navigates to `/blog/{slug}` correctly (native `<a href>` works without JS). Filter is client-only — graceful degradation to All-shown card set, as documented in spec Edge Cases.
  - **Stub article preview** (SC-007 / AC US3-3): on each of the 6 secondary slugs:
    - `BlogPostHero` renders metadata.
    - Body = stub lead paragraph + `Full article forthcoming.` caption.
    - Right column = `TryBristleCard` only (no rail, no empty `<nav>`).
    - Zero `<section data-blog-section="...">` elements in HTML.
  - **Unknown slug 404** (SC-009 / AC US3-5): `curl -sI <local>/blog/this-slug-does-not-exist` → HTTP 404; the page renders Next.js default 404.
  - **Responsive sweep** (SC-016) at 320/375/768/1024/1280/1440 on `/blog` and each of the 7 `/blog/[slug]` routes — no h-scroll, no overlap, no clipped text; `BlogArticleGrid` collapses 3-col → 2-col (`sm`) → single-col (below `sm`); `BlogRailToc` collapses sticky vertical rail → horizontal pill row at and below `md`; on stub articles, the right column contains only `TryBristleCard` cleanly at every width.
  - **Visual diff** (SC-003, SC-006) vs `design/Public_pages.pdf` page 5 (Blog index) and page 6 (featured post) at 1280 width within a 4px tolerance per section. The 6 stub articles get structural correctness only (no per-stub PDF).
  - **Inline figure render check**: on the featured article, the `InlineFigure` SVG renders at viewport width with a visibly rising line over 4 x-axis labels (`Q1 '24` through `Q4 '25`) and a caption below. At 320 width, the line still renders (acknowledge that `preserveAspectRatio="none"` stretches the path vertically; if visibly distorted/unreadable, file as a follow-up to switch to `xMidYMid meet`).
  - **Keyboard reach** (FR-023 / AC US4-7, AC US4-8): Tab through `/blog` — chips reachable in DOM order, each chip has visible focus ring (`focus-visible:outline-2 outline-offset-2 outline-accent-bristle`); article cards reachable via Tab on each `<h2><Link>`. Tab through `/blog/what-...` — BlogRailToc anchors reachable, focus rings visible; section headings render as semantic `<h2>`; the post's `<h1>` is in `BlogPostHero` (article title); `TryBristleCard` h3 is the deepest level.
  - **Reduced-motion walk** (SC-011, SC-014 / AC US4-9): with OS `prefers-reduced-motion: reduce` ON, click a `BlogRailToc` anchor → instant scroll, no animation; mobile pill auto-scroll-into-view also instant. Toggle OS preference OFF mid-session → next click smooth-scrolls (fresh read per invocation, no caching).
  - **Lighthouse on local prod build** (SC-019): `/blog` and `/blog/what-50000-github-issues-reveal-about-developer-pain` — Performance / Accessibility / Best Practices / SEO each ≥ 90 on local. (Lighthouse on the 6 stub articles is optional — same template applies, structurally identical to the featured route.)
  - **Slice-005 top-nav `Blog` link regression check (local)** (SC-022): from `<local>/`, click top-nav `Blog` → lands on `/blog` (HTTP 200; was the slice-005 `ComingSoon` soft-404). From `<local>/`, scroll to footer Company column `Blog` → lands on `/blog` (HTTP 200; same flip). `git diff --stat origin/main..HEAD -- apps/web/src/components/landing/` returns empty (top-nav and site-footer unchanged).
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T018 · [US4] VERIFY — preview parity (gate)
Push the branch via the gh-token HTTPS workaround (SSH agent currently refusing per the prior session — verify status before push); confirm the Vercel preview.
- **Depends on**: T017
- **Verify (SC-024)**:
  - **Preview URL pattern**: `https://bristle-git-010-blog-cornel-okoths-projects.vercel.app` (exact URL surfaced via `gh api repos/cornel-stack/bristle/commits/<sha>/check-runs` after the Vercel build completes).
  - **Routes resolve on preview**: `curl -sI <preview>/blog` and each of `curl -sI <preview>/blog/{slug}` for all 7 slugs → all return HTTP 200.
  - **Unknown slug on preview**: `curl -sI <preview>/blog/this-slug-does-not-exist` → HTTP 404.
  - **Meta tags on preview**: `curl -s <preview>/blog | grep -oE 'og:(title|description|url|image|type)'` shows all 5 OG tags with absolute `bristle.vercel.app` URLs (NOT preview host) and `og:type=website`; same per-article preview curl on each of the 7 article URLs shows `og:type=article` + dynamic title + dynamic description.
  - **No body `<meta robots>`** on any of the 8 new routes: `curl -s <preview>/blog | grep -c '<meta[^>]*name="robots"'` returns 0; same for each article slug. (The `x-robots-tag: noindex` HTTP header is the Vercel preview default — same artifact as prior slices, not a body meta; pages indexable in production.)
  - **Slice-005 top-nav `Blog` link regression check on preview**: from `<preview>/`, click top-nav `Blog` → lands on `/blog` on preview (HTTP 200, NOT 404 as it was pre-slice-010 when the slice-005 `ComingSoon` stub was live). Same for the footer Company column `Blog` link.
  - **Slice-006 / 008 / 009 regression check on preview**: `/pricing` Enterprise card "Contact sales" → still lands on `/contact` (slice 008); `/faq` rail / accordion / bottom CTA still work (slice 006); footer "Help center" still goes to `/faq`; `/about` + `/contact` still render (slice 008); `/terms` / `/privacy` / `/security` / `/gdpr` still render with intact TocRail behavior (slice 009).
  - **No client-side console errors** on any of the 8 new routes (`/blog` + 7 article slugs) in the browser console.
  - **BlogRailToc behavior on preview**: scroll the featured article → active section in rail follows topmost-visible content; click a TOC anchor → smooth-scroll (instant if OS reduced-motion ON); modifier-key clicks pass through to native browser behavior (open in new tab); at 375 width, horizontal pill row visible above the body with active-pill auto-scroll.
  - **BlogFilterChips behavior on preview**: clicking each of the 5 chips changes the visible card set per SC-004 expectations; `aria-pressed` toggles correctly; chip group announces as toolbar in screen reader if available.
- **Commit**: none (verification/deploy only).

**▸ STOP 4** — Field Notes index + featured blog post + 6 stub articles live locally and on the preview; slice-005 top-nav `Blog` link flips from soft-404 to live without any nav-file edit; slice complete.

---

## Dependencies & Execution Order

```
Batch A:
  T001 (types.ts)
    └── T002 [P] (blog-articles)

Batch B (all depend on T001):
  T003 [P] (BlogHero)
  T004 [P] (BlogPostHero)
  T005 [P] (InlinePullQuote)
  T006 [P] (InlineFigure)
  T007 [P] (TryBristleCard)
  T008 [P] (BlogFeaturedCard)
  T009 [P] (BlogArticleCard)
  T010 [P] (BlogRailToc — client, additive only: does NOT import slice-006 FaqScrollSpyRail or slice-009 TocRail)
  T011    (BlogPostBody) ← T005 + T006

Batch C (sequential — each task depends on prior siblings):
  T012 (BlogFilterChips — client)              ← T001
  T013 (BlogArticleGrid — client)              ← T001 + T008 + T009 + T012
  T014 (BlogPostLayout)                        ← T001 + T004 + T007 + T010 + T011
  T015 (/blog/page.tsx REWRITE)                ← T001 + T002 + T003 + T013
  T016 (/blog/[slug]/page.tsx ADD)             ← T002 + T014

Batch D:
  T017 (local gate)     ← T015 + T016
  T018 (preview parity) ← T017
```

### Critical dependency edges

- **T001 → EVERYTHING**: type-only gate. T002 + T003-T011 + T012-T016 all import from `./types`. Must compile before any other Batch A/B/C task can typecheck. (Note: T003 and T007 don't strictly *need* T001 since they don't import types, but the module-convention precedent and the STOP 1 gate dependency mean they wait for T001 in practice.)
- **T002 → T015 + T016**: the `/blog/page.tsx` rewrite imports `BLOG_ARTICLES` (for the CARDS projection); the `/blog/[slug]/page.tsx` imports `BLOG_ARTICLES` for both `generateStaticParams` (the 7-slug array) and the per-request slug lookup. Without T002, neither route can compile.
- **T011 → T014**: `BlogPostLayout` renders `BlogPostBody` as its body content. Sequential within Batch B (T011 is the only non-[P] task in Batch B because it depends on T005 + T006).
- **T010 → T014**: `BlogPostLayout` conditionally renders `BlogRailToc` based on `tocItems.length > 0`. T010 must compile before T014.
- **T012 → T013**: `BlogArticleGrid` imports `BlogFilterChips` as its child. T012 sequential before T013.
- **T013 → T015**: `/blog/page.tsx` imports `BlogArticleGrid`. T013 sequential before T015.
- **T014 → T016**: `/blog/[slug]/page.tsx` imports `BlogPostLayout`. T014 sequential before T016.
- **T015 + T016 → T017**: local gate runs only after both routes are wired (typecheck/lint/build cover both routes' compilation; the empirical Pick'd-projection savings measurement requires the deployed `/blog` build).
- **T017 → T018**: preview parity runs after local checks pass + the branch is pushed.

### Parallel opportunities

- **Batch A**: T002 [P] after T001 lands (T002 imports `BlogArticle` from T001). Slice 009 ran 4 content files [P]; slice 010 has 1 (`blog-articles.ts`) so it's trivially parallel — no fan-out to capture.
- **Batch B**: T003 / T004 / T005 / T006 / T007 / T008 / T009 / T010 are all independent files → 8 parallel candidates. T011 is **NOT** [P] (depends on T005 + T006). Maximum parallel width in Batch B = 8 (all 8 [P] tasks).
- **Batch C**: linearizes (each task depends on the prior). **No parallel opportunities** within Batch C. This is the heavier-than-prior-slices batch noted in plan §D16.

### Sequencing concerns

1. **T001 (`types.ts`) is the hardest gate of the slice** — must compile before any of T002-T016 (every Batch A/B/C task imports a type from it). Recommended order: T001 first, then T002, then STOP 1, then the Batch B [P] cohort (T003-T010 in parallel where staffed), then T011, then STOP 2, then sequentially through Batch C, then the two gates.
2. **T011 (`BlogPostBody`) is the second-hardest gate of Batch B** — must complete before T014 in Batch C. T011 itself depends on T005 + T006 being in place; in practice the Batch B [P] cohort completes T005 + T006 early (small server components) and T011 lands as the last Batch B task.
3. **T014 (`BlogPostLayout`) is the central gate of Batch C** — gates T016. T014 itself depends on 4 Batch B tasks (T004 + T007 + T010 + T011), so all of Batch B must be in place before T014 can be written.
4. **The `/blog/page.tsx` rewrite (T015)** has a delicate moment: between T015's commit landing and `pnpm --filter web build` completing, the route file is in transition — old `ComingSoon` import deleted, new imports staged. If the build is interrupted mid-Batch-C, the `/blog` route may not compile. Recommendation: complete T015 + T016 together in tight succession before pushing or running the local gate.
5. **Empirical Pick'd-projection savings measurement at T017** requires a temporary edit-rebuild-revert dance (build with projection, measure; edit to remove projection, build, measure; subtract; revert). Document the actual delta in the PR description. Plan estimates ~5-8 KB; the measurement should land in that range or the projection's value will be smaller than the contracts/plan claim — useful to know either way.
6. **Visual diff + Lighthouse + responsive sweep + keyboard reach + reduced-motion walk + JS-disabled walk defer to reviewer** at T017/T018 — same CLI-agent constraint as prior slices. Code-side proxies (build, greps, diff-stat, route-200 curls, meta-tag curls, dep audit, deep-link HTML inspection, stub-body curl-greps, `"use client"` count) are agent coverage; viewport sweep + Lighthouse + PDF visual diff + browser-driven BlogRailToc + BlogFilterChips behavior + reduced-motion runtime check + JS-disabled walk are reviewer coverage.
7. **Slice-005 top-nav `Blog` link regression check** (SC-022) is the US4-defining verification — `apps/web/src/components/landing/top-nav.tsx` AND `apps/web/src/components/landing/site-footer.tsx` must remain in the `git diff --stat` empty zone. Both hrefs were authored in slice 005 to point at `/blog`; the route goes live the moment T015 lands.
8. **No rebase noise expected at T018 push** — branch is on top of clean `main` from the start of this slice (no stacking like 006 → 007 had).
9. **`placeholderText` rendering discipline** (parallels slice-009 FR-018 / `reviewNote?`): the T006 `InlineFigure` component MUST NOT reference `figure.placeholderText` at all (verified at T006 commit time via `grep "placeholderText" apps/web/src/components/blog/inline-figure.tsx` returning 0); the T017 gate additionally curls the rendered featured-article HTML and confirms zero `"Chart placeholder"` substrings escape. Two independent checks for the same invariant.
10. **The `BlogRailToc` empty-items decision** lives in T014 (`BlogPostLayout`)'s conditional render, NOT in T010 (`BlogRailToc`) itself. T010's component renders unconditionally assuming `items.length > 0` (avoids React rules-of-hooks edge case with early return before hooks); T014's call site does `{tocItems.length > 0 && <BlogRailToc items={tocItems} />}`. Documented in the T010 task description; verify at T014 time.

### Surprising parallelism opportunity

**Batch B is unusually wide (8 [P] tasks).** Slice 009 had 3 [P] template primitives; slice 010 has 8. With staffing, all 8 can land in a single review cycle. Without staffing (single-implementer), the sequential order matters less than the dependency edges: T005 + T006 should land before T011 (the only non-[P] task in Batch B). Recommended single-implementer order: T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011, but any topological order that satisfies T005 + T006 before T011 works.

---

## Implementation strategy (4 stops)

1. **Stop 1 (Batch A)**: foundations — `types.ts` + `blog-articles.ts` with `[PLACEHOLDER]` header + 7 articles (1 featured full body + 6 stubs) + verbatim opening phrases + Cornel byline on all 7. STOP-1 gate verifies type exports, article count, featured/stub partition, verbatim openers, byline grep, voice grep clean.
2. **Stop 2 (Batch B)**: 9 template primitives (8 server + 1 client). Client surface is exactly 1 file (`blog-rail-toc.tsx`). The `placeholderText` discipline kicks in at T006. STOP-2 gate verifies typecheck/lint + `"use client"` count = 1 (in this batch) + hex/font/voice/emoji greps clean across all 9 files.
3. **Stop 3 (Batch C)**: stateful interactions + shared layout + 2 routes. The `/blog/page.tsx` wholesale rewrite (FR-001) happens here; client surface grows from 1 to 3 (`blog-filter-chips.tsx`, `blog-article-grid.tsx`, `blog-rail-toc.tsx`). STOP-3 gate verifies build + first read of First Load JS budgets.
4. **Stop 4 (Batch D)**: full local quality gate including the empirical Pick'd-projection savings measurement (a concrete number for the PR description per the user's request), then preview parity including slice-005 top-nav `Blog` link regression check.

## Task count

**18 tasks** — **16 commit-producing** (T001-T016), **2 verification gates** (T017 + T018). Grouped into **4 batches / 4 stops**. Slightly larger than slice 009 (16 tasks) because: 2 more components in Batch B (9 vs 3 primitives), but 1 fewer route file in Batch C (2 routes vs 4), 1 wholesale-rewrite file in Batch C, and the empirical-savings measurement in Batch D adds work (not a separate task).

## Out of scope (no tasks)

- Per-article OG image generation (`@vercel/og` dynamic image routes per clarification (d)) — **deferred follow-up**.
- RSS feed for `/blog` — **slice 2.7**.
- Real authored content for the 6 secondary articles — **founder content patch slice** (10a/10b precedent or between Tier 2 ship and Tier 3 work).
- Real authored Method & data section content for the featured article — **founder edit pass before publishing**.
- Real chart data swap for `InlineFigure` — **founder swaps decorative SVG for real chart before publishing**.
- Extract shared `SectionScrollSpyRail` from `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) — **tracked follow-up refactor slice**; explicitly out of scope this slice per spec to keep change additive only. Refactor pressure now real (third structural mirror) — primary tracked follow-up.
- `/blog/categories/[category]` SEO-driven category deep pages — **future-slice ask**.
- Author profile pages (`/authors/{name}` routes) — **future-slice ask if/when Bristle grows beyond one author**.
- Newsletter wiring (still **slice 2.7**); Better Stack status integration (still **slice 2.7**); next-themes integration / Editorial Dark (still deferred to **slice 2.6**).
- `/privacy/sub-processors` deep page (carried from slice 009) — **follow-up**.
- Refund-policy alignment audit (carried from slice 009, **permanent cross-slice constraint**).
- Slice-005 `<main>` landmark fix (carried from slice 006) — **one-line fix in a future micro-slice**.
- NewsletterStub markup convergence (carried from slice 008) — **slice 2.7**.
- Form spam protection (carried from slice 008) — N/A for slice 010 (no form).
- Real `/api/contact` JSON route handler (carried from slice 008) — N/A for slice 010.
- Custom Bristle-voiced 404 page — **Tier-7 polish slice** ships a global 404 covering all routes per `design/System_pages.pdf` page 1.
- Any modifications to slice-005 chrome (top-nav, site-footer), slice-006 pricing/FAQ, slice-008 about/contact, slice-009 legal, or any `lib/` module.
- Any modifications to `design/Public_pages.pdf` or any other read-only `design/` / `docs/` PDF.
- Any DB schema change, any new `@bristle/db` query helper.
