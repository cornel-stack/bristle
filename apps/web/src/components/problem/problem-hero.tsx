// Page-level hero: serif h1 + 2 meta rows (momentum + source badges + first-
// seen + counts; Save/Share buttons). Takes `SampleProblem` (not the Full
// variant specifically) because all displayed fields live on SampleProblemBase
// — stub pages render the same hero shape as full pages.
//
// Save / Share buttons are PRESENTATIONAL `<button type="button">` with no
// onClick, no client state, no persistence (FR-008 — preserves the single-
// client-island discipline; FrequencyChart is the only client component
// under apps/web/src/components/problem/). Real Save/Share behavior is
// owned by the app/onboarding tier.

import type { SampleProblem } from "./types";
import { ProblemMomentumChip } from "./problem-momentum-chip";
import { ProblemSourceBadge } from "./problem-source-badge";

export function ProblemHero({ problem }: { problem: SampleProblem }) {
  return (
    <header className="py-section">
      <h1 className="font-serif text-h1 text-text-primary">{problem.title}</h1>

      <div className="mt-grid flex flex-wrap items-center gap-grid text-body-sm text-text-secondary">
        <ProblemMomentumChip momentum={problem.momentum} />
        <div className="flex items-center">
          {problem.sourceBadges.map((source) => (
            <span key={source} className="-ml-1 first:ml-0">
              <ProblemSourceBadge source={source} />
            </span>
          ))}
        </div>
        <span>First seen {problem.firstSeenDisplay}</span>
        <span aria-hidden="true">·</span>
        <span>{problem.quoteCount} quotes</span>
        <span aria-hidden="true">·</span>
        <span>{problem.sourceCount} sources</span>
      </div>

      <div className="mt-snug flex items-center justify-end gap-snug">
        <button
          type="button"
          className="rounded-button border border-border-default px-snug py-1 text-body-sm font-medium text-text-secondary"
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-button border border-border-default px-snug py-1 text-body-sm font-medium text-text-secondary"
        >
          Share
        </button>
      </div>
    </header>
  );
}
