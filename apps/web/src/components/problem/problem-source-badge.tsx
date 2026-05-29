// Small circular per-source badge rendered in the ProblemHero meta row.
// Source initial visible inside the badge; aria-label carries the full
// display name so screen readers hear "GitHub" not just "G".
//
// Editorial choice: lowercase "g" for Google Play to disambiguate from
// GitHub's uppercase "G" (both share the same first letter).

import type { SampleProblemSourceKey } from "./types";

const SOURCE_INITIAL: Record<SampleProblemSourceKey, string> = {
  github: "G",
  hackernews: "H",
  stackoverflow: "S",
  reddit: "R",
  producthunt: "P",
  appstore: "A",
  playstore: "g",
};

const SOURCE_LABEL: Record<SampleProblemSourceKey, string> = {
  github: "GitHub",
  hackernews: "Hacker News",
  stackoverflow: "Stack Overflow",
  reddit: "Reddit",
  producthunt: "Product Hunt",
  appstore: "App Store",
  playstore: "Google Play",
};

export function ProblemSourceBadge({ source }: { source: SampleProblemSourceKey }) {
  return (
    <span
      role="img"
      aria-label={SOURCE_LABEL[source]}
      className="inline-flex size-6 items-center justify-center rounded-pill border border-border-default bg-surface-card text-body-sm font-medium text-text-primary"
    >
      <span aria-hidden="true">{SOURCE_INITIAL[source]}</span>
    </span>
  );
}
