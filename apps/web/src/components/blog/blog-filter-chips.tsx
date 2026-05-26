"use client";

// BlogFilterChips — presentational client component. Owns no state; renders
// 5 pill-shaped chips (All + 4 categories) and bubbles selection up via
// onSelectCategory(value). The parent (BlogArticleGrid) owns the useState.
//
// Pattern A ARIA per plan §D7 — role="group" with aria-label, each chip is
// a <button> carrying aria-pressed={isSelected}. NOT a radiogroup ("All" is
// a meta-state, not a sibling category — would violate radiogroup's
// exactly-one-of-N invariant).

import type { BlogCategory } from "./types";

type Selection = BlogCategory | "all";

const CHIPS: ReadonlyArray<{ value: Selection; label: string }> = [
  { value: "all", label: "All" },
  { value: "data-analysis", label: "Data analysis" },
  { value: "product-strategy", label: "Product strategy" },
  { value: "indie-hacker", label: "Indie hacker" },
  { value: "devtools", label: "Devtools" },
];

interface BlogFilterChipsProps {
  selectedCategory: Selection;
  onSelectCategory: (next: Selection) => void;
}

export function BlogFilterChips({
  selectedCategory,
  onSelectCategory,
}: BlogFilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter articles by category"
      className="flex flex-wrap gap-tight"
    >
      {CHIPS.map((chip) => {
        const isSelected = selectedCategory === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectCategory(chip.value)}
            className={
              isSelected
                ? "rounded-pill bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                : "rounded-pill border border-border-default bg-surface-card px-snug py-1 text-body-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            }
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
