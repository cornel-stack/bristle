import { Bell, Bookmark, BookmarkCheck, Download, GitCompare } from "lucide-react";

// Header action row. This slice renders the buttons per design but performs NO
// writes — the mutations ship later (Save toggle → 4.5, Compare → 4.7, Alert me
// → 4.6, Export → Tier 6). The ONLY state shown is read-only: `isSaved` flips
// Save between "Save" and "Saved" (from getSavedProblemIds over the demo user).
// Export is the bristle-accent primary. Buttons are intentionally inert (no
// onClick) until their owning slices land.

const SECONDARY =
  "inline-flex items-center gap-1.5 rounded-button border border-border-default bg-surface-card px-3 py-1.5 text-body-sm font-medium text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

export function DetailActionBar({ isSaved }: { isSaved: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={SECONDARY} aria-pressed={isSaved}>
        {isSaved ? (
          <BookmarkCheck className="size-4 text-accent-validated" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Bookmark className="size-4" strokeWidth={1.5} aria-hidden="true" />
        )}
        {isSaved ? "Saved" : "Save"}
      </button>
      <button type="button" className={SECONDARY}>
        <GitCompare className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Compare
      </button>
      <button type="button" className={SECONDARY}>
        <Bell className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Alert me
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-button bg-accent-bristle px-3 py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Export
      </button>
    </div>
  );
}
