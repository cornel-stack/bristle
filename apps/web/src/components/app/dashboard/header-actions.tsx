import { Download, SlidersHorizontal } from "lucide-react";

import { AddCategoryButton } from "@/components/app/categories/add-category-button";

// Dashboard header actions (server component). Filter + Export digest stay
// visual-only (Library 4.4 / Tier 6); "Add category" is now functional — opens the
// modal that adds an ephemeral cross-route category (slice 4.9). §4 tokens.
export function HeaderActions() {
  return (
    <div className="flex items-center gap-tight">
      <button
        type="button"
        className="flex items-center gap-tight rounded-button border border-border-default bg-surface-card px-snug py-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Filter
      </button>
      <button
        type="button"
        className="flex items-center gap-tight rounded-button border border-border-default bg-surface-card px-snug py-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
      >
        <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Export digest
      </button>
      <AddCategoryButton />
    </div>
  );
}
