import { Download, Plus, SlidersHorizontal } from "lucide-react";

// Dashboard header actions (server component). VISUAL-ONLY this slice — Filter is
// wired with the Library (4.4), Add category opens its modal (4.9), Export digest
// is Tier 6. Rendered per design; no behavior yet. §4 tokens.
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
      <button
        type="button"
        className="flex items-center gap-tight rounded-button bg-accent-bristle px-snug py-1.5 text-body-sm font-medium text-surface-card"
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Add category
      </button>
    </div>
  );
}
