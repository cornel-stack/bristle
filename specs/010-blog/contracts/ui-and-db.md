# Contracts: UI + DB surfaces (Slice 010)

## `@bristle/db` — **no change**

This slice does not modify, add, or remove any DB query helper. No DB reads. No schema change. The slice-005 through slice-009 surface is preserved as-is.

## `@bristle/ui` — **no API change; no new dep**

No new components exported. No existing exports modified. No new package dependency.

## `@bristle/shared` — **no change**

`SITE_URL` is consumed (not modified) by both new routes' `metadata` / `generateMetadata` exports.

## `apps/web` — **no new top-level dependency**

`apps/web/package.json` is **unchanged**. `pnpm-lock.yaml` is unchanged. `BlogRailToc` is hand-rolled `IntersectionObserver` (verbatim slice-009 `TocRail` pattern). `InlineFigure` is hand-rolled inline SVG (no chart library). Date formatting is via pre-formatted `displayDate` strings per article (no `Intl.DateTimeFormat`, no date library).

## New app-local files (no public package surface)

These live under `apps/web/src/components/blog/` (new directory) and `apps/web/src/app/blog/` — page-specific, not re-exported.

### Shared type module

```ts
// apps/web/src/components/blog/types.ts (TS module, no JSX)

export type BlogCategory =
  | "data-analysis"
  | "product-strategy"
  | "indie-hacker"
  | "devtools";

export interface BlogPullQuote {
  text: string;
  /** e.g. "— from the analysis"; rendered as <cite> below the <blockquote>. */
  attribution: string;
}

export interface BlogFigure {
  /** e.g. "FIGURE 1 · WONTFIX CLOSURES BY CATEGORY" — small-caps mono. */
  eyebrow: string;
  /** Visible <figcaption>. */
  caption: string;
  /**
   * Optional developer-facing hint (NEVER rendered). Parallels slice-009's
   * `reviewNote?` discipline — the InlineFigure component reads only
   * eyebrow + caption.
   */
  placeholderText?: string;
}

export interface BlogArticleSection {
  /** kebab-case; serves as both the <section id> anchor target AND the
   *  [data-blog-section] marker the BlogRailToc IntersectionObserver queries. */
  id: string;
  /** Full title rendered as the section's <h2>. e.g.
   *  "One: most refusals are about scope, not capability." */
  title: string;
  /** Optional shortened form for BlogRailToc display. e.g. "Scope refusals".
   *  Fallback: `title` when omitted. (See plan §D4 — explicit beats magical.) */
  railTitle?: string;
  /** 1+ verbatim paragraphs; each renders as a <p> in display order. */
  paragraphs: ReadonlyArray<string>;
  /** Optional inline pull-quote; renders BETWEEN paragraph index 0 and 1
   *  (per BlogPostBody / FR-011). */
  pullQuote?: BlogPullQuote;
  /** Optional inline figure; renders AFTER all paragraphs in the section. */
  figure?: BlogFigure;
}

export interface BlogArticle {
  /** kebab-case article slug; matches /blog/{slug} route. */
  slug: string;
  category: BlogCategory;
  /** ISO yyyy-mm-dd; used for sorting / comparison. */
  date: string;
  /** Pre-formatted display string; e.g. "MAY 8 2026" / "MAR 27 2026".
   *  Per clarification (g) / FR-022 — avoids runtime Intl.DateTimeFormat. */
  displayDate: string;
  title: string;
  /** 2-line card preview AND <meta description>. */
  summary: string;
  /** Always "Cornel Okoth" this slice (FR-021, clarification (f)). */
  authorName: string;
  /** Always "CO" this slice. */
  authorInitials: string;
  readTimeMinutes: number;
  /** Exactly one true in BLOG_ARTICLES. */
  featured: boolean;
  /** 6 true (stub treatment), 1 false (full featured body). Independent of
   *  `featured` for future flexibility. */
  stubBody: boolean;
  /** ONLY set on the featured article — drives the IN THIS ISSUE callout on
   *  the index. Separate from section-level pull-quotes. */
  pullQuote?: BlogPullQuote;
  body: {
    /** 2 paragraphs for the featured article; ignored when stubBody is true. */
    lead: ReadonlyArray<string>;
    /** Single paragraph for stub articles; ignored when stubBody is false. */
    stubLead?: string;
  };
  /** 4 entries for the featured article; empty for the 6 stub articles. */
  sections: ReadonlyArray<BlogArticleSection>;
}

/** Pick'd subtype passed from /blog/page.tsx Server Component to
 *  BlogArticleGrid Client Component. Drops `body` and `sections` from the
 *  client-bound payload (~5-8 KB savings per plan §D13). */
export type BlogArticleCard = Pick<
  BlogArticle,
  | "slug"
  | "category"
  | "date"
  | "displayDate"
  | "title"
  | "summary"
  | "authorName"
  | "authorInitials"
  | "readTimeMinutes"
  | "featured"
  | "stubBody"
  | "pullQuote"
>;

/** Minimal projection consumed by BlogRailToc. BlogPostLayout maps
 *  article.sections to BlogTocItem[] before passing into the rail —
 *  keeps the rail's prop surface tight and avoids serializing
 *  paragraph prose for client hydration. */
export interface BlogTocItem {
  id: string;
  /** Derived from section.railTitle ?? section.title (plan §D4). */
  displayTitle: string;
}
```

### Content data store

```ts
// apps/web/src/components/blog/blog-articles.ts (sketch — head)
// [PLACEHOLDER — article content awaiting founder review before production launch]

import type { BlogArticle } from "./types";

export const BLOG_ARTICLES: ReadonlyArray<BlogArticle> = [
  // 1. FEATURED ARTICLE — full body (4 sections + lead + pull quote + inline figure)
  {
    slug: "what-50000-github-issues-reveal-about-developer-pain",
    category: "data-analysis",
    date: "2026-05-08",
    displayDate: "MAY 8 2026",
    title: "What 50,000 GitHub issues reveal about developer pain.",
    summary: "We analyzed every closed-as-wontfix issue across the 200 most-starred repos. The patterns are not where you expect.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 9,
    featured: true,
    stubBody: false,
    pullQuote: {
      text: "17% of closed-wontfix issues never receive a third opinion.",
      attribution: "— from the analysis",
    },
    body: {
      lead: [
        "The first answer most product tools give you is 'look at trends.' That answer is wrong. Trends tell you what people are talking about. They do not tell you what people are frustrated by. Those are different surfaces with different motivations, and you build different things from them.",
        "For this analysis we sampled every issue closed-as-wontfix across the 200 most-starred repositories on GitHub from 2024 through Q1 2026. The dataset is 50,318 issues, 416,440 comments, and a long aftermath of arguments. Three patterns emerged that we did not expect.",
      ],
    },
    sections: [
      {
        id: "scope-refusals",
        title: "One: most refusals are about scope, not capability.",
        railTitle: "Scope refusals",
        paragraphs: [
          "Maintainers close issues when they could fix them, but the fix would take the project somewhere they do not want it to go. This is the gap where products are born. The closed-wontfix label is the closest thing the open source ecosystem has to a 'yes, but not here' signal.",
          "The implication for builders: closed-wontfix is your idea backlog. We rank our reports partly on this.",
        ],
        pullQuote: {
          text: "The closed-wontfix label is the closest thing the open source ecosystem has to a 'yes, but not here' signal.",
          attribution: "— from the analysis",
        },
        figure: {
          eyebrow: "FIGURE 1 · WONTFIX CLOSURES BY CATEGORY",
          caption: "Devtools and developer-experience closures grew 4.1× while infrastructure stayed flat.",
          placeholderText: "Chart placeholder — line chart, 24-month rising trend",
        },
      },
      {
        id: "comment-count",
        title: "Two: comment count is the demand signal you ignore at your peril.",
        railTitle: "Comment count",
        paragraphs: [
          "An issue that closes with three comments is a non-event. An issue that closes with 80 comments — over five months, with the same five users returning — is a product. We re-ranked the dataset by sustained comment cadence and found that 17% of closed-wontfix issues never receive a third opinion, but the long tail is enormous.",
        ],
      },
      {
        id: "willingness-to-pay",
        title: "Three: willingness-to-pay leaks out in comments.",
        railTitle: "Willingness-to-pay",
        paragraphs: [
          "You will find phrases like 'I'd literally pay for this' in 2.3% of long-comment threads. The percentage sounds small. The absolute number across 50,000 issues is not. Bristle treats these phrases as a column.",
        ],
      },
      {
        id: "method-data",
        title: "Method & data.",
        railTitle: "Method & data",
        paragraphs: [
          "We pulled issues from GitHub's public API across the 200 highest-starred repositories spanning JavaScript, Python, Go, Rust, and Ruby ecosystems. Closed-as-wontfix was extracted from the issue's closing label; comments were tokenized and classified for sentiment, willingness-to-pay phrases, and back-and-forth cadence.",
          "The full anonymized dataset is available to Pro and Team subscribers in the methods download — including the SQL queries we used and the labeled training set for the willingness-to-pay classifier.",
        ],
      },
    ],
  },

  // 2-7. SIX SECONDARY ARTICLES — stub body
  {
    slug: "three-signals-that-separate-a-product-from-a-feature",
    category: "product-strategy",
    date: "2026-05-01",
    displayDate: "MAY 1 2026",
    title: "Three signals that separate a product from a feature.",
    summary: "You can read 200 complaints and still build the wrong thing. Here is the heuristic we use to tell which clusters are products.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 6,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead: "You can read 200 complaints and still build the wrong thing. Here is the heuristic we use to tell which clusters are products — and which are just features the maintainer should have shipped years ago.",
    },
    sections: [],
  },
  {
    slug: "how-we-tracked-4m-unmet-demand-developer-tool-60-days",
    category: "indie-hacker",
    date: "2026-04-22",
    displayDate: "APR 22 2026",
    title: "How we tracked $4M in unmet demand for one developer tool in 60 days.",
    summary: "A case study using the willingness-to-pay column you have been ignoring.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 7,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead: "A case study using the willingness-to-pay column you have been ignoring. Sixty days, one developer tool, one spreadsheet we wish we had built sooner.",
    },
    sections: [],
  },
  {
    slug: "vercel-cold-starts-shared-hosting-cpu-limits",
    category: "devtools",
    date: "2026-04-14",
    displayDate: "APR 14 2026",
    title: "Vercel cold starts are the new shared-hosting CPU limits.",
    summary: "A frequency chart, a momentum chart, and three quotes that should worry the serverless industry.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 5,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead: "A frequency chart, a momentum chart, and three quotes that should worry the serverless industry. The pattern from 2014 is back, just with smaller granularity.",
    },
    sections: [],
  },
  {
    slug: "why-pricing-pages-worst-place-discover-demand",
    category: "product-strategy",
    date: "2026-04-03",
    displayDate: "APR 3 2026",
    title: "Why pricing pages are the worst place to discover demand.",
    summary: "Comparing what people say they will pay versus what they actually say in support tickets.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 8,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead: "Comparing what people say they will pay versus what they actually say in support tickets. The two numbers are not the same and the gap is where most product mistakes live.",
    },
    sections: [],
  },
  {
    slug: "field-notes-32-paid-customer-interviews",
    category: "indie-hacker",
    date: "2026-03-27",
    displayDate: "MAR 27 2026",
    title: "Field notes from 32 paid customer interviews.",
    summary: "A small experiment, with verbatim transcripts. The hits and the duds.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 11,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead: "A small experiment, with verbatim transcripts. The hits and the duds — and a heuristic for which question always produces a usable answer.",
    },
    sections: [],
  },
  {
    slug: "app-store-reviews-most-underused-product-research-surface",
    category: "data-analysis",
    date: "2026-03-20",
    displayDate: "MAR 20 2026",
    title: "App Store reviews are the most under-used product research surface.",
    summary: "They are public, attributed, time-stamped, and ignored by every tool that calls itself 'AI-native'.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 6,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead: "They are public, attributed, time-stamped, and ignored by every tool that calls itself 'AI-native.' The result is one of the most overlooked datasets in product research.",
    },
    sections: [],
  },
] as const;
```

### Index components

```tsx
// apps/web/src/components/blog/blog-hero.tsx (server)
export function BlogHero(): JSX.Element;
//   <section>
//     <p className="font-mono text-body-sm uppercase tracking-wider text-accent-bristle">BRISTLE BLOG</p>
//     <h1 className="font-serif text-display-lg text-text-primary">Field Notes</h1>
//     <p className="text-body-md text-text-secondary">
//       Research, analysis, and the occasional opinion on building products against evidence.
//     </p>
//   </section>

// apps/web/src/components/blog/blog-filter-chips.tsx ("use client", presentational)
export interface BlogFilterChipsProps {
  selected: BlogCategory | "all";
  onSelect: (next: BlogCategory | "all") => void;
}
export function BlogFilterChips(props: BlogFilterChipsProps): JSX.Element;
//   "use client";
//   <div role="toolbar" aria-label="Filter articles by category">
//     5 <button type="button" aria-pressed={isSelected}> chips:
//     All, Data analysis, Product strategy, Indie hacker, Devtools
//   </div>

// apps/web/src/components/blog/blog-featured-card.tsx (server)
export interface BlogFeaturedCardProps { article: BlogArticleCard; }
export function BlogFeaturedCard(props: BlogFeaturedCardProps): JSX.Element;
//   <article className="rounded-card border border-border-default ...">
//     <p eyebrow>{article.displayDate} · {categoryLabel(article.category)}</p>
//     <h2 serif><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
//     <p summary>{article.summary}</p>
//     <p meta>{article.authorName} · {article.readTimeMinutes} min read</p>
//     {article.pullQuote && (
//       <aside aria-label="In this issue" className="...callout...">
//         <p eyebrow>IN THIS ISSUE</p>
//         <blockquote serif>{article.pullQuote.text}</blockquote>
//         <cite>{article.pullQuote.attribution}</cite>
//       </aside>
//     )}
//   </article>

// apps/web/src/components/blog/blog-article-card.tsx (server)
export interface BlogArticleCardProps { article: BlogArticleCard; }
export function BlogArticleCard(props: BlogArticleCardProps): JSX.Element;
//   <article className="rounded-card border border-border-default hover:border-border-strong">
//     <p eyebrow>{article.displayDate} · {categoryLabel(article.category)}</p>
//     <h2 serif><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
//     <p summary>{article.summary}</p>
//     <p meta>{article.authorName} · {article.readTimeMinutes} min read</p>
//   </article>

// apps/web/src/components/blog/blog-article-grid.tsx ("use client", state owner)
export interface BlogArticleGridProps { articles: ReadonlyArray<BlogArticleCard>; }
export function BlogArticleGrid(props: BlogArticleGridProps): JSX.Element;
//   "use client";
//   const [selected, setSelected] = useState<BlogCategory | "all">("all");
//   filters articles by selected; when "all": featured in its own slot + 6 grid cards;
//   when non-"all" filter: featured (if matches) renders inline in the grid;
//   houses <BlogFilterChips selected onSelect> + featured slot + grid
```

### Blog-post components

```tsx
// apps/web/src/components/blog/blog-post-hero.tsx (server)
export interface BlogPostHeroProps { article: BlogArticle; }
export function BlogPostHero(props: BlogPostHeroProps): JSX.Element;
//   <header>
//     <p eyebrow className="text-accent-bristle">BRISTLE BLOG</p>
//     <h1 className="font-serif text-heading-h1">{article.title}</h1>
//     <p meta className="text-body-sm text-text-secondary">
//       {article.displayDate} · {categoryLabel(article.category)} · {article.authorName} · {article.readTimeMinutes} min read
//     </p>
//     <span avatar aria-hidden="true">{article.authorInitials}</span>
//   </header>

// apps/web/src/components/blog/blog-post-body.tsx (server, branches on stubBody)
export interface BlogPostBodyProps { article: BlogArticle; }
export function BlogPostBody(props: BlogPostBodyProps): JSX.Element;
//   if (article.stubBody) {
//     return <div><p serif>{article.body.stubLead}</p><p italic muted>Full article forthcoming.</p></div>;
//   }
//   return <div>
//     {article.body.lead.map(p => <p serif>{p}</p>)}
//     {article.sections.map(s =>
//       <section id={s.id} data-blog-section={s.id}>
//         <h2 serif>{s.title}</h2>
//         {s.paragraphs.map((p, i) => (
//           <>
//             <p serif>{p}</p>
//             {s.pullQuote && i === 0 && <InlinePullQuote quote={s.pullQuote} />}
//           </>
//         ))}
//         {s.figure && <InlineFigure figure={s.figure} />}
//       </section>
//     )}
//   </div>;

// apps/web/src/components/blog/inline-pull-quote.tsx (server)
export interface InlinePullQuoteProps { quote: BlogPullQuote; }
export function InlinePullQuote(props: InlinePullQuoteProps): JSX.Element;
//   <blockquote className="border-l-4 border-accent-bristle pl-grid font-serif text-display-sm">
//     {quote.text}
//   </blockquote>
//   <cite className="text-body-sm text-text-secondary">{quote.attribution}</cite>

// apps/web/src/components/blog/inline-figure.tsx (server, hand-rolled inline SVG)
export interface InlineFigureProps { figure: BlogFigure; }
export function InlineFigure(props: InlineFigureProps): JSX.Element;
//   <figure>
//     <p eyebrow mono uppercase>{figure.eyebrow}</p>
//     <svg viewBox="0 0 720 200" role="img" aria-label={figure.caption} className="w-full" preserveAspectRatio="none">
//       <g className="stroke-border-default opacity-40">... 5 horizontal grid lines ...</g>
//       <path d="M 20 170 L 80 165 L ... L 680 30" className="stroke-accent-bristle" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
//       <g className="fill-text-secondary" fontSize="11">... 4 x-axis labels ...</g>
//     </svg>
//     <figcaption className="text-body-sm text-text-secondary">{figure.caption}</figcaption>
//   </figure>

// apps/web/src/components/blog/blog-rail-toc.tsx ("use client") — THIRD STRUCTURAL MIRROR
export interface BlogRailTocProps {
  items: ReadonlyArray<BlogTocItem>;
  ariaLabel?: string;  // defaults to "Sections of the article"
}
export function BlogRailToc(props: BlogRailTocProps): JSX.Element | null;
//   "use client";
//   if (items.length === 0) return null;  // stub-body articles
//   useState<string>(items[0]?.id ?? "") for active section (flicker fix)
//   useRef<Map<string, number>>(new Map()) for visibleSections (IO tracking)
//   useRef<Map<string, HTMLAnchorElement>>(new Map()) for mobilePillRefs
//
//   useEffect (mount-only) sets up IntersectionObserver on
//     document.querySelectorAll("[data-blog-section]")
//     with rootMargin "-80px 0px -55% 0px", threshold: 0
//     topmost-intersecting → setActive; no-intersection → early return (no flicker)
//
//   useEffect ([active]) auto-scrolls mobile pill into view:
//     if (matchMedia("(min-width: 768px)").matches) return;  // desktop no-op
//     pillRef.scrollIntoView({inline: "center", block: "nearest",
//                             behavior: reduced-motion ? "auto" : "smooth"})
//
//   handleClick(e, sectionId):
//     if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;  // modifier passthrough
//     e.preventDefault();
//     target = document.getElementById(sectionId);
//     reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
//     target.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
//
//   render <nav aria-label={ariaLabel}>
//     <ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">
//       desktop sticky vertical rail; <a href="#{id}" aria-current={isActive ? "location" : undefined}>{displayTitle}</a>
//       active: border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary
//       inactive: border-l-2 border-transparent py-1 pl-snug text-text-secondary hover:text-text-primary
//     </ul>
//     <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
//       mobile horizontal pill row; each pill an <a> with ref registered to mobilePillRefs Map;
//       active pill: bg-text-primary text-surface-card rounded-pill
//       inactive: border border-border-default bg-surface-card text-text-secondary rounded-pill
//     </ul>
//   </nav>

// apps/web/src/components/blog/try-bristle-card.tsx (server, fixed content)
export function TryBristleCard(): JSX.Element;
//   <aside className="rounded-card border border-border-default p-card">
//     <p eyebrow mono uppercase className="text-accent-bristle">TRY BRISTLE</p>
//     <h3 className="font-serif text-heading-h3">See today's high-signal problems.</h3>
//     <Link href="/signup" className="...primary button...">Start free</Link>
//   </aside>

// apps/web/src/components/blog/blog-post-layout.tsx (server) — composes the post page
export interface BlogPostLayoutProps { article: BlogArticle; }
export function BlogPostLayout(props: BlogPostLayoutProps): JSX.Element;
//   const tocItems: BlogTocItem[] = article.sections.map((s) => ({
//     id: s.id,
//     displayTitle: s.railTitle ?? s.title,
//   }));
//
//   <TopNav /> (reused from slice 005)
//   <main className="mx-auto max-w-6xl px-grid">
//     <BlogPostHero article={article} />
//     <div className="grid gap-grid pb-section md:grid-cols-[1fr_18rem] md:gap-section">
//       <div className="flex flex-col gap-section">
//         <BlogPostBody article={article} />
//       </div>
//       <aside className="flex flex-col gap-grid">
//         <BlogRailToc items={tocItems} />
//         <TryBristleCard />
//       </aside>
//     </div>
//   </main>
//   <SiteFooter /> (reused from slice 005)
//
//   Note: 18rem right column (vs slice-009's 16rem left column) is sized for
//   the TryBristleCard's "See today's high-signal problems." headline at the
//   serif text-heading-h3 + comfortable wrap.
//   On stub articles, BlogRailToc returns null; the aside contains only
//   TryBristleCard. The grid template is unchanged.
```

## Route exports

### `apps/web/src/app/blog/page.tsx` (REWRITE — slice-005 ComingSoon stub → full Blog index)

```ts
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

// Card projection — drops `body` and `sections` from the client-bound payload
// (~5-8 KB savings per plan §D13).
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
// NO robots field → indexable by default (FR-029).
// Removes the slice-005 `robots: { index: false, follow: false }` from the
// prior ComingSoon stub — the new page IS indexable.
```

### `apps/web/src/app/blog/[slug]/page.tsx` (NEW)

```ts
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
// NO robots field → indexable by default (FR-029).
```

## Untouched contracts (additive-only verification)

- `apps/web/src/components/landing/top-nav.tsx` — **unchanged**. Top-nav `Blog` link already points at `/blog` (line 5); flips from soft-404 → live the moment slice 010 ships. Verified via grep at plan time.
- `apps/web/src/components/landing/site-footer.tsx` — **unchanged**. Company column `Blog` link already points at `/blog` (line 17); same flip semantics. Verified via grep at plan time.
- `apps/web/src/components/landing/pricing-teaser.tsx` — **unchanged**.
- All slice-006 pricing/FAQ files (including `apps/web/src/components/faq/scroll-spy-rail.tsx`) — **unchanged**. `BlogRailToc` is a structural mirror in a separate file, NOT a refactor of the FAQ rail.
- All slice-008 about/contact files (`about/*.tsx`, `contact/*.tsx`, `lib/resend.ts`, `app/contact/actions.ts`) — **unchanged**.
- All slice-009 legal files (`legal/*.tsx`, `legal/*-content.ts`, `legal/types.ts`, including `legal/toc-rail.tsx`) — **unchanged**. `BlogRailToc` is a structural mirror in a separate file, NOT a refactor of the Legal TocRail.
- `packages/db/`, `packages/shared/`, `packages/ui/` — **unchanged**.
- `design/` — **unchanged**.

## Out-of-scope-known-404s consumed by this slice (not slice-010 defects)

- `/signup` — referenced from every `TryBristleCard` (7 article pages). NOT built this slice. Currently a slice-005 soft-404 stub; flips to live the moment Tier-3 slice 3.1 auth ships. Documented carry-forward; same posture as the slice-005 nav `Login` / `Start free` CTAs.

No new known-out-of-scope-404 destinations are introduced by slice 010 itself — the 6 secondary article routes are **live** under this slice's `generateStaticParams` (they just render the stub-body treatment per US3 / FR-011). This is a different posture from slice 009, which introduced `/privacy/sub-processors` as a known-out-of-scope-404.

## Structural mirror discipline (permanent constraint)

`BlogRailToc` is the **third** structural mirror of the slice-006 `FaqScrollSpyRail` + slice-009 `TocRail` pattern. All three share ~80% of their code (IntersectionObserver setup, topmost-visible resolution, no-flicker preservation, modifier-key passthrough, reduced-motion fresh-read, mobile pill auto-scroll). The tracked follow-up grows from "extract `FaqScrollSpyRail` + `TocRail` into a shared `SectionScrollSpyRail`" (slice 009) to "extract `FaqScrollSpyRail` + `TocRail` + `BlogRailToc` into a shared `SectionScrollSpyRail`" (slice 010). The refactor parameterizes over:

- **Selector**: `[data-faq-item]` (slice 006) / `[data-legal-section]` (slice 009) / `[data-blog-section]` (slice 010)
- **Items source**: `FaqItem` / `TocItem` / `BlogTocItem`
- **`aria-label` string**: defaults per-call-site
- **Initial active id derivation**: `items[0]?.id ?? ""` is uniform across all three; not a parameter

The refactor is **not in scope for slice 010** but is now a clear priority for a future refactor slice (likely between Tier 2 close and Tier 3 open, or as part of slice 2.7 final wire-up). The cost is bounded: three files → one file + three thin wrappers, no behavioral change, regression risk on three shipped surfaces.
