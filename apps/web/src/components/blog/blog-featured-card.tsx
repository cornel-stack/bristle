// /blog index featured card — left = card content (date · category eyebrow,
// serif title, summary, byline); right = IN THIS ISSUE callout consuming
// article.pullQuote (the article-level pullQuote, separate from any
// section-level pullQuote). The callout suppresses when article.pullQuote
// is undefined. Card title is the link; whole card is NOT wrapped in a
// single outer <a> (cards-as-links is an a11y anti-pattern).

import Link from "next/link";

import type { BlogArticleCard, BlogCategory } from "./types";

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  "data-analysis": "Data analysis",
  "product-strategy": "Product strategy",
  "indie-hacker": "Indie hacker",
  devtools: "Devtools",
};

export function BlogFeaturedCard({ article }: { article: BlogArticleCard }) {
  return (
    <article className="grid gap-card rounded-card border border-border-default bg-surface-card p-card md:grid-cols-[1fr_20rem] md:gap-loose">
      <div className="flex flex-col gap-grid">
        <p className="text-body-sm uppercase tracking-wide text-text-secondary">
          {article.displayDate} · {CATEGORY_LABEL[article.category]}
        </p>
        <h2 className="font-serif text-h2 text-text-primary">
          <Link
            href={`/blog/${article.slug}`}
            className="transition-colors hover:text-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            {article.title}
          </Link>
        </h2>
        <p className="text-body-md text-text-secondary">{article.summary}</p>
        <p className="mt-auto text-body-sm text-text-tertiary">
          {article.authorName} · {article.readTimeMinutes} min read
        </p>
      </div>
      {article.pullQuote && (
        <aside
          aria-label="In this issue"
          className="flex flex-col gap-snug rounded-card bg-surface-raised p-card"
        >
          <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
            IN THIS ISSUE
          </p>
          <blockquote className="font-serif text-body-lg text-text-primary">
            {article.pullQuote.text}
          </blockquote>
          <cite className="text-body-sm not-italic text-text-secondary">
            {article.pullQuote.attribution}
          </cite>
        </aside>
      )}
    </article>
  );
}
