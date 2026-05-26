// Shared BlogArticle + section + card + TOC shapes for slice-010 Field Notes.
//
// BlogArticle describes one whole article (1 featured with full body + 4
// sections; 6 stub-body articles with only a lead paragraph). The data store
// at blog-articles.ts exports BLOG_ARTICLES: ReadonlyArray<BlogArticle>.
//
// BlogArticleCard is a Pick'd subtype the /blog Server Component projects
// into the BlogArticleGrid client component — drops `body` and `sections`
// from the client-bound hydration payload (per plan §D13).
//
// BlogTocItem is the minimal projection BlogPostLayout passes into
// BlogRailToc so the rail's prop surface stays tight (no paragraph prose
// serialized into client hydration).
//
// BlogFigure.placeholderText is a developer-facing field that NEVER renders
// to the user-visible page (parallels slice-009's reviewNote? discipline at
// LegalSectionContent.reviewNote); InlineFigure reads only `eyebrow` and
// `caption`.

export type BlogCategory =
  | "data-analysis"
  | "product-strategy"
  | "indie-hacker"
  | "devtools";

export interface BlogPullQuote {
  /** Quote body, rendered serif inside a <blockquote>. */
  text: string;
  /** Attribution line below the quote, e.g. "— from the analysis". */
  attribution: string;
}

export interface BlogFigure {
  /** Small-caps mono eyebrow above the figure, e.g. "FIGURE 1 · WONTFIX CLOSURES BY CATEGORY". */
  eyebrow: string;
  /** Visible <figcaption> below the figure. */
  caption: string;
  /**
   * Optional developer-facing hint describing what the placeholder visual
   * represents (e.g. "Chart placeholder — line chart, 24-month rising trend").
   * NEVER rendered to the user-visible page. Parallels slice-009's
   * LegalSectionContent.reviewNote discipline — InlineFigure reads only
   * `eyebrow` and `caption`; this field surfaces only via source review
   * and the founder's pre-publish content pass.
   */
  placeholderText?: string;
}

export interface BlogArticleSection {
  /**
   * kebab-case; serves as both the <section id> anchor target AND the
   * [data-blog-section] marker the BlogRailToc IntersectionObserver queries.
   */
  id: string;
  /**
   * Full section title rendered as <h2> in the article body, e.g.
   * "One: most refusals are about scope, not capability."
   */
  title: string;
  /**
   * Optional shortened form for BlogRailToc display, e.g. "Scope refusals".
   * BlogPostLayout derives BlogTocItem.displayTitle as `railTitle ?? title`.
   * Explicit override beats projection-time heuristic (per plan §D4).
   */
  railTitle?: string;
  /** Verbatim paragraphs; rendered as a <p> per entry, in source order. */
  paragraphs: ReadonlyArray<string>;
  /**
   * Optional inline pull-quote rendered BETWEEN paragraph index 0 and 1
   * of the section (after the first paragraph). Separate from the
   * article-level pullQuote (which drives the index featured callout).
   */
  pullQuote?: BlogPullQuote;
  /**
   * Optional inline figure rendered AFTER all paragraphs in the section.
   */
  figure?: BlogFigure;
}

export interface BlogArticle {
  /** kebab-case slug; matches /blog/{slug} route. */
  slug: string;
  category: BlogCategory;
  /** ISO yyyy-mm-dd; used for sorting / comparison. */
  date: string;
  /**
   * Pre-formatted display string, e.g. "MAY 8 2026" / "MAR 27 2026".
   * Stored as a fixed string per clarification (g) to avoid runtime
   * Intl.DateTimeFormat (no locale drift between SSR and hydration).
   */
  displayDate: string;
  title: string;
  /** 2-line card preview AND <meta description> on the article route. */
  summary: string;
  authorName: string;
  authorInitials: string;
  readTimeMinutes: number;
  /** Exactly one true across BLOG_ARTICLES this slice. */
  featured: boolean;
  /**
   * 6 true (stub treatment), 1 false (full featured body) this slice.
   * Independent of `featured` for future flexibility — the type permits
   * combinations the v1 data set does not use.
   */
  stubBody: boolean;
  /**
   * ONLY set on the featured article — drives the IN THIS ISSUE callout
   * on the index featured card. Separate from any section-level pullQuote
   * (the two may quote the same line, but they're independent fields).
   */
  pullQuote?: BlogPullQuote;
  body: {
    /**
     * Lead paragraphs rendered before any <section>. 2 paragraphs on the
     * featured article; ignored when stubBody is true.
     */
    lead: ReadonlyArray<string>;
    /**
     * Single paragraph rendered on stub-body articles. Ignored when
     * stubBody is false.
     */
    stubLead?: string;
  };
  /**
   * 4 entries on the featured article; empty array on the 6 stubs.
   */
  sections: ReadonlyArray<BlogArticleSection>;
}

/**
 * Pick'd subtype passed from /blog/page.tsx (Server) into
 * BlogArticleGrid (Client). Drops `body` and `sections` from the
 * client-bound hydration payload — saves ~5-8 KB per plan §D13.
 */
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

/**
 * Minimal projection consumed by BlogRailToc. BlogPostLayout maps
 * article.sections to BlogTocItem[] (displayTitle = railTitle ?? title)
 * before passing into the rail — keeps the rail's prop surface tight
 * and avoids paragraph prose ever being serialized for client hydration.
 */
export interface BlogTocItem {
  id: string;
  displayTitle: string;
}
