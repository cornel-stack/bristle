import type { ChangelogType } from "./types";

const LABEL: Record<ChangelogType, string> = {
  feature: "Feature",
  improvement: "Improvement",
  fix: "Fix",
};

// Per plan §D8. Feature uses text-surface-card on bg-accent-bristle because
// the text-on-accent token does NOT exist in globals.css; this matches the
// slice-009 TocRail mobile-pill active-state recipe.
const CLASSES: Record<ChangelogType, string> = {
  feature: "bg-accent-bristle text-surface-card",
  improvement: "bg-surface-raised text-text-primary",
  fix: "text-text-secondary border border-border-default",
};

interface ChangelogBadgeProps {
  type: ChangelogType;
}

export function ChangelogBadge({ type }: ChangelogBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-body-sm font-medium ${CLASSES[type]}`}
    >
      {LABEL[type]}
    </span>
  );
}
