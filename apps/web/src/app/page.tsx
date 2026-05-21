import { getFirstProblem } from "@bristle/db";
import { CATEGORY_LABELS, type CategoryKey } from "@bristle/shared";
import {
  ProblemCardFull,
  type CategoryColor,
  type SourceKey,
} from "@bristle/ui";

// Server Component: reads the seeded problem from the database at request time
// and renders it through the canonical ProblemCardFull. getFirstProblem throws
// if no row exists (a missing seed is a deployment defect, not an empty state).
export default async function Home() {
  const problem = await getFirstProblem();
  const categoryKey = problem.category as CategoryKey;

  return (
    <main className="mx-auto max-w-3xl px-grid py-section">
      <ProblemCardFull
        title={problem.title}
        category={CATEGORY_LABELS[categoryKey]}
        categoryColor={problem.category as CategoryColor}
        momentum={problem.momentumPct}
        sparkline={problem.sparkline}
        topQuote={problem.topQuote}
        quoteSource={problem.quoteSource as SourceKey}
        sources={problem.sources as SourceKey[]}
        lastSeenIso={problem.lastSeenAt.toISOString()}
      />
    </main>
  );
}
