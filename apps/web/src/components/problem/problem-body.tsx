// THE DISCRIMINATED-UNION NARROWING IN PRACTICE.
//
// Branches on `if (problem.stubBody) { ... } else { ... }`. TypeScript
// narrows `problem` to `SampleProblemStub` on the true branch (no
// pullQuote / body / sourcesBreakdown / frequencyData / evidenceQuotes /
// relatedProblems fields accessible) and to `SampleProblemFull` on the
// false branch (all full-report fields readable WITHOUT non-null
// assertions). Zero `problem.body!` or `problem.pullQuote!`-style
// assertions anywhere in this file — the discriminator is the safety rail.

import type { SampleProblem } from "./types";
import { ProblemPullQuote } from "./problem-pull-quote";

export function ProblemBody({ problem }: { problem: SampleProblem }) {
  if (problem.stubBody) {
    return (
      <div className="space-y-grid py-section">
        <p className="font-serif text-body-lg text-text-primary">{problem.lead}</p>
        <p className="italic text-body-md text-text-secondary">Full problem report forthcoming.</p>
      </div>
    );
  }

  // TypeScript narrows `problem` to `SampleProblemFull` here.
  return (
    <article className="space-y-grid py-section">
      <p className="font-serif text-body-lg text-text-primary">{problem.lead}</p>
      <ProblemPullQuote quote={problem.pullQuote} />
      <p className="text-body-md text-text-primary">{problem.body}</p>
    </article>
  );
}
