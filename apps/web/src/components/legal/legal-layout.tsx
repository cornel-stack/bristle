import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

import { LegalHero } from "./legal-hero";
import { LegalSection } from "./legal-section";
import { TocRail } from "./toc-rail";
import type { LegalContent, TocItem } from "./types";

export function LegalLayout({ content }: { content: LegalContent }) {
  // Project the full LegalSectionContent[] down to the minimal TocItem shape
  // before handing it to the client TocRail. Keeps paragraph prose + reviewNote
  // strings out of the client hydration payload (FR-018 reinforcement at the
  // boundary, plus a small bundle win).
  const tocItems: TocItem[] = content.sections.map((s) => ({
    id: s.id,
    number: s.number,
    title: s.title,
  }));

  return (
    <>
      <TopNav />
      <main>
        <LegalHero hero={content.hero} />
        <div className="mx-auto max-w-5xl px-grid pb-section">
          <div className="md:grid md:grid-cols-[16rem_1fr] md:gap-section">
            <TocRail items={tocItems} />
            <article className="space-y-section">
              {content.sections.map((section) => (
                <LegalSection key={section.id} section={section} />
              ))}
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
