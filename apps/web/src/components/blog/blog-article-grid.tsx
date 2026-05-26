"use client";

// BlogArticleGrid — owns the filter state for /blog. Receives the Pick'd
// BlogArticleCard[] from the Server Component (NOT the full BlogArticle —
// the projection at the route-level drops `body` and `sections` from the
// client-bound hydration payload per plan §D13, saving ~5-8 KB).
//
// State ownership pattern transposes slice-008 ContactForm/useActionState:
// the wrapper component owns the hook; BlogFilterChips is presentational.
//
// Featured handling (plan §D5):
//   - selectedCategory === "all"  → BlogFeaturedCard slot above the 6-card
//                                   grid (the featured article shows its
//                                   IN THIS ISSUE pullquote callout).
//   - selectedCategory !== "all"  → all matching articles (including the
//                                   featured one, if its category matches)
//                                   render inline in the grid as regular
//                                   BlogArticleCard. No callout treatment
//                                   under filters.

import { useState } from "react";

import { BlogArticleCard as BlogArticleCardComponent } from "./blog-article-card";
import { BlogFeaturedCard } from "./blog-featured-card";
import { BlogFilterChips } from "./blog-filter-chips";
import type { BlogArticleCard, BlogCategory } from "./types";

type Selection = BlogCategory | "all";

interface BlogArticleGridProps {
  articles: ReadonlyArray<BlogArticleCard>;
}

export function BlogArticleGrid({ articles }: BlogArticleGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<Selection>("all");

  const featured = articles.find((a) => a.featured);
  const showFeaturedSlot = selectedCategory === "all" && featured !== undefined;

  // When "all" is active: featured renders in its own slot above; the 6
  // secondaries render in the grid. When a category filter is active:
  // ALL matching articles (including featured if it matches) render inline
  // in the grid as regular BlogArticleCard (no featured-slot under filters).
  const gridArticles =
    selectedCategory === "all"
      ? articles.filter((a) => !a.featured)
      : articles.filter((a) => a.category === selectedCategory);

  return (
    <div className="mt-section flex flex-col gap-section">
      <BlogFilterChips
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      {showFeaturedSlot && featured && (
        <BlogFeaturedCard article={featured} />
      )}
      <div className="grid gap-grid sm:grid-cols-2 md:grid-cols-3">
        {gridArticles.map((article) => (
          <BlogArticleCardComponent key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
