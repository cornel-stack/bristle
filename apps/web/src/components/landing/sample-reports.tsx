import Link from "next/link";
import { ProblemCardCompact, type CategoryColor, type SourceKey } from "@bristle/ui";
import { CATEGORY_LABELS, type CategoryKey } from "@bristle/shared";
import type { Problem } from "@bristle/db";

export function SampleReports({ problems }: { problems: Problem[] }) {
  return (
    <section id="sample" className="mx-auto max-w-6xl px-grid py-section">
      <div className="flex items-end justify-between gap-grid">
        <div>
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
            Sample reports · Public
          </p>
          <h2 className="mt-snug font-serif text-h2 text-text-primary">
            Today&rsquo;s high-signal problems
          </h2>
        </div>
        <Link href="/library" className="shrink-0 text-body-sm font-medium text-accent-bristle">
          Browse the library →
        </Link>
      </div>
      <div className="mt-grid grid gap-grid sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem) => {
          const key = problem.category as CategoryKey;
          return (
            <ProblemCardCompact
              key={problem.slug}
              href={`/problems/${problem.slug}`}
              title={problem.title}
              category={CATEGORY_LABELS[key]}
              categoryColor={problem.category as CategoryColor}
              momentum={problem.momentumPct}
              sparkline={problem.sparkline}
              topQuote={problem.topQuote}
              quoteSource={problem.quoteSource as SourceKey}
              sources={problem.sources as SourceKey[]}
              lastSeenIso={problem.lastSeenAt.toISOString()}
            />
          );
        })}
      </div>
    </section>
  );
}
