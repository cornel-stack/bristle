// /blog/[slug] article hero — BRISTLE BLOG eyebrow + serif <h1> + meta row
// (displayDate · category · author · read-time) + initials avatar. Tokens-only.

import type { BlogArticle, BlogCategory } from "./types";

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  "data-analysis": "Data analysis",
  "product-strategy": "Product strategy",
  "indie-hacker": "Indie hacker",
  devtools: "Devtools",
};

export function BlogPostHero({ article }: { article: BlogArticle }) {
  return (
    <header className="pt-section pb-loose">
      <p className="text-body-sm font-medium uppercase tracking-wide text-accent-bristle">
        BRISTLE BLOG
      </p>
      <h1 className="mt-grid font-serif text-display-lg text-text-primary">
        {article.title}
      </h1>
      <div className="mt-grid flex items-center gap-snug">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-raised text-body-sm font-medium text-text-primary"
        >
          {article.authorInitials}
        </span>
        <p className="text-body-sm text-text-secondary">
          {article.displayDate} · {CATEGORY_LABEL[article.category]} · {article.authorName} · {article.readTimeMinutes} min read
        </p>
      </div>
    </header>
  );
}
