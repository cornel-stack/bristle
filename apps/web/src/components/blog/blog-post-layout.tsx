// BlogPostLayout — composes the chrome for /blog/[slug] (both featured +
// stub articles). Server Component. TopNav and SiteFooter sit OUTSIDE the
// <main> landmark (matches slice-009 LegalLayout posture).
//
// Grid template: md:grid-cols-[1fr_18rem] — rail on the RIGHT at 18rem
// (per plan §D12b). NOTE: differs from slice-009 LegalLayout which uses
// [16rem_1fr] with rail on the LEFT. Right-rail at 18rem accommodates
// TryBristleCard's serif headline at text-h3 with comfortable wrap.
//
// Empty-rail discipline (plan §D12): when article.stubBody === true, the
// rail is omitted at THIS call site (not via early-return inside
// BlogRailToc — avoids the React rules-of-hooks edge case). TryBristleCard
// still renders, so the right column doesn't collapse visually.

import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

import { BlogPostBody } from "./blog-post-body";
import { BlogPostHero } from "./blog-post-hero";
import { BlogRailToc } from "./blog-rail-toc";
import { TryBristleCard } from "./try-bristle-card";
import type { BlogArticle, BlogTocItem } from "./types";

export function BlogPostLayout({ article }: { article: BlogArticle }) {
  // Project sections → BlogTocItem[] (displayTitle = railTitle ?? title)
  // before passing into the client rail. Keeps paragraph prose out of the
  // client hydration payload and lets the founder edit short titles via
  // the explicit railTitle override on each section (plan §D4).
  const tocItems: BlogTocItem[] = article.sections.map((s) => ({
    id: s.id,
    displayTitle: s.railTitle ?? s.title,
  }));

  return (
    <>
      <TopNav />
      <main>
        <div className="mx-auto max-w-5xl px-grid pb-section">
          <BlogPostHero article={article} />
          <div className="mt-section md:grid md:grid-cols-[1fr_18rem] md:gap-section">
            <div className="flex flex-col gap-section">
              <BlogPostBody article={article} />
            </div>
            <aside className="mt-section flex flex-col gap-loose md:mt-0">
              {!article.stubBody && <BlogRailToc items={tocItems} />}
              <TryBristleCard />
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
