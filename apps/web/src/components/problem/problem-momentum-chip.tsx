// Momentum pill rendered in the ProblemHero meta row. Tokens-only —
// bg-accent-bristle + text-surface-card matches the slice-011 ChangelogBadge
// "feature" recipe. The ▲ character is the visible affordance (no extra
// aria-label needed — screen readers read the visible text verbatim).

import type { SampleProblemMomentum } from "./types";

export function ProblemMomentumChip({ momentum }: { momentum: SampleProblemMomentum }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-accent-bristle px-2 py-0.5 text-body-sm font-medium text-surface-card">
      <span aria-hidden="true">▲</span>
      <span>
        {momentum.delta} / {momentum.windowDays}d
      </span>
    </span>
  );
}
