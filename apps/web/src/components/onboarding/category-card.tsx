// One selectable category in the Step 2 grid (server component, design 3_2). A
// <label> wraps a visually-hidden checkbox for native multi-select form
// semantics. Subline is a flat "Coming soon" — the design's "N active problems ·
// updated 12m ago" count (C-f) and the sparkline (C-g) are intentionally dropped
// this slice. `disabled` covers the max-reached-and-unselected state. Selected →
// accent border + tinted card + filled accent checkbox. Token-driven, no hex.

import { Check } from "lucide-react";

interface CategoryCardProps {
  slug: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export function CategoryCard({
  slug,
  label,
  selected = false,
  disabled = false,
}: CategoryCardProps) {
  return (
    <label
      className={`flex items-center gap-snug rounded-modal border p-card transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-bristle ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${
        selected
          ? "border-accent-bristle bg-accent-bristle/10"
          : "border-border-default bg-surface-card hover:border-border-strong"
      }`}
    >
      <input
        type="checkbox"
        name="categories"
        value={slug}
        defaultChecked={selected}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-button border ${
          selected
            ? "border-accent-bristle bg-accent-bristle text-surface-card"
            : "border-border-strong bg-surface-card"
        }`}
      >
        {selected ? (
          <Check className="size-3" strokeWidth={1.5} aria-hidden="true" />
        ) : null}
      </span>
      <span className="flex flex-col">
        <span className="text-body-md font-medium text-text-primary">
          {label}
        </span>
        <span className="text-body-sm text-text-secondary">Coming soon</span>
      </span>
    </label>
  );
}
