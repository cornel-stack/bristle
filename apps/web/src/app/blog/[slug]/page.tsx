// /blog/[slug] — dynamic article route, prerendered for all 7 slugs at
// build time via generateStaticParams (plan §D9). Unknown slugs render
// the Next.js default 404 via notFound() (plan §D11; custom Bristle-voiced
// 404 is Tier-7 polish, out of scope this slice).
//
// generateMetadata constructs per-article OG with og:type="article"
// (plan §D10 — canonical Open Graph type for blog posts vs the
// "website" used by product/marketing/legal pages). When the slug
// lookup fails (a build-time impossibility given generateStaticParams,
// but defensive at request time for the catch-all dynamicParams case),
// metadata falls back to a minimal title; notFound() in the default
// export handles the 404 page render.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SITE_URL } from "@bristle/shared";

import { BlogPostLayout } from "@/components/blog/blog-post-layout";
import { BLOG_ARTICLES } from "@/components/blog/blog-articles";

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Array<Params>> {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) {
    return { title: "Not found — Bristle" };
  }
  const title = `${article.title} — Bristle`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: article.summary,
    openGraph: {
      title,
      description: article.summary,
      type: "article",
      url: `${SITE_URL}/blog/${article.slug}`,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();
  return <BlogPostLayout article={article} />;
}
