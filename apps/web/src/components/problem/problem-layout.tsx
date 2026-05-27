// Composes the entire /problems/[slug] route surface. Two architectural
// firsts for this project live here:
//
// 1. <SampleBanner /> sits as the FIRST sibling under the route's JSX root,
//    ABOVE <TopNav />. Every prior slice (005-011) rooted with <TopNav /> as
//    the first sibling; slice 012 is the first to render chrome above the
//    persistent nav. The pattern is purely additive — no edits to
//    top-nav.tsx, no portals, no shared-chrome modifications.
//    See specs/012-sample-report/quickstart.md "Architectural precedent".
//
// 2. The body branches on the SampleProblem discriminated union via
//    `problem.stubBody ? ... : ...`. TypeScript narrows to SampleProblemStub
//    on the truthy branch (only base fields readable) and to
//    SampleProblemFull on the falsy branch (full-report fields readable
//    WITHOUT non-null assertions). The narrowing is the safety rail —
//    grep this file for `problem.X!`-style assertions: zero hits.
//
// Layout shape on the FULL branch (per design/Public_pages.pdf page 7):
//   <ProblemBreadcrumb> + <ProblemHero>
//   ↓ 2-column grid (article LEFT, sticky rail RIGHT — md:grid-cols-[1fr_18rem])
//     left:  <ProblemBody>
//     right: <SourcesCard> + <RelatedProblemsCard>  (md:sticky md:top-grid)
//   ↓ full-width <FrequencyChart>
//   ↓ full-width <EvidenceList>
//
// Layout shape on the STUB branch:
//   <ProblemBreadcrumb> + <ProblemHero> + <ProblemBody>
//   (ProblemBody renders the "Full problem report forthcoming." caption
//    in its stub branch — same component handles both treatments.)

import { TopNav } from "@/components/landing/top-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { SampleBanner } from "./sample-banner";
import { ProblemBreadcrumb } from "./problem-breadcrumb";
import { ProblemHero } from "./problem-hero";
import { ProblemBody } from "./problem-body";
import { SourcesCard } from "./sources-card";
import { RelatedProblemsCard } from "./related-problems-card";
import { FrequencyChart } from "./frequency-chart";
import { EvidenceList } from "./evidence-list";
import type { SampleProblem } from "./types";

export function ProblemLayout({ problem }: { problem: SampleProblem }) {
  return (
    <>
      <SampleBanner />
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid">
        <ProblemBreadcrumb breadcrumb={problem.breadcrumb} />
        <ProblemHero problem={problem} />

        {problem.stubBody ? (
          <ProblemBody problem={problem} />
        ) : (
          <>
            <section className="grid gap-grid py-section md:grid-cols-[1fr_18rem]">
              <ProblemBody problem={problem} />
              <div className="flex flex-col gap-grid md:sticky md:top-grid md:self-start">
                <SourcesCard rows={problem.sourcesBreakdown} total={problem.quoteCount} />
                <RelatedProblemsCard items={problem.relatedProblems} />
              </div>
            </section>
            <section className="py-section">
              <FrequencyChart data={problem.frequencyData} />
            </section>
            <section className="py-section">
              <EvidenceList quotes={problem.evidenceQuotes} quoteCount={problem.quoteCount} />
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
