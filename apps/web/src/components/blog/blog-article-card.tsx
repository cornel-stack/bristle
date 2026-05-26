// /blog index secondary card — one of 6 in the 3×2 grid. Date · category
// eyebrow, serif title (clickable), summary, byline. Hover state = border
// color shift, 150ms via Tailwind's default transition-colors duration
// (CLAUDE.md §4.5 spec is 120ms; 30ms divergence is sub-perceptual).

import Link from "next/link";

import type { BlogArticleCard, BlogCategory } from "./types";

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  "data-analysis": "Data analysis",
  "product-strategy": "Product strategy",
  "indie-hacker": "Indie hacker",
  devtools: "Devtools",
};

export function BlogArticleCard({ article }: { article: BlogArticleCard }) {
  return (
    <article className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card transition-colors hover:border-border-strong">
      <p className="text-body-sm uppercase tracking-wide text-text-secondary">
        {article.displayDate} · {CATEGORY_LABEL[article.category]}
      </p>
      <h2 className="font-serif text-h3 text-text-primary">
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
    </article>
  );
}
