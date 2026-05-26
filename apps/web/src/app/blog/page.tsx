// /blog — Field Notes index. REPLACES the slice-005 ComingSoon stub
// (which set `robots: { index: false, follow: false }` for the
// known-out-of-scope-404 destination); the new page is launched and
// indexable, so no robots field appears in the new metadata.
//
// Card projection per plan §D13: the Server Component drops `body` and
// `sections` field-by-field from each article before passing the array
// into the BlogArticleGrid client component. Saves ~5-8 KB of client
// hydration JSON vs shipping the full BlogArticle objects (each featured
// article carries 5+ paragraphs + figure data + section bodies). The
// `BlogArticleCard` Pick'd type at types.ts statically guarantees the
// projection drops the right fields — the runtime expression below
// enforces it field-by-field so a future BlogArticle field addition
// can't silently leak through.

import type { Metadata } from "next";

import { SITE_URL } from "@bristle/shared";

import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

import { BLOG_ARTICLES } from "@/components/blog/blog-articles";
import { BlogArticleGrid } from "@/components/blog/blog-article-grid";
import { BlogHero } from "@/components/blog/blog-hero";
import type { BlogArticleCard } from "@/components/blog/types";

const TITLE = "Field Notes — Bristle";
const DESCRIPTION =
  "Research, analysis, and the occasional opinion on building products against evidence.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/blog`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
};

// Field-by-field projection: drops `body` and `sections` from the
// client-bound payload. The Pick'd type provides the static guarantee;
// this explicit destructuring is the runtime enforcement.
const CARDS: ReadonlyArray<BlogArticleCard> = BLOG_ARTICLES.map(
  ({
    slug,
    category,
    date,
    displayDate,
    title,
    summary,
    authorName,
    authorInitials,
    readTimeMinutes,
    featured,
    stubBody,
    pullQuote,
  }) => ({
    slug,
    category,
    date,
    displayDate,
    title,
    summary,
    authorName,
    authorInitials,
    readTimeMinutes,
    featured,
    stubBody,
    pullQuote,
  }),
);

export default async function BlogIndex() {
  return (
    <>
      <TopNav />
      <main>
        <div className="mx-auto max-w-5xl px-grid pb-section">
          <BlogHero />
          <BlogArticleGrid articles={CARDS} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
