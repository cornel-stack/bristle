import { Download, GitCompare, Plus } from "lucide-react";
import Link from "next/link";

// Saved board header. "28 of 50" is the usage_meters literal (already on the
// dashboard KPI); the collection count is real. Export all (Tier 6) renders
// visual-only; New comparison links to Compare (slice 4.7 wires this); New
// collection is the ephemeral add (wired by the board).
export function SavedHeader({
  savedUsed,
  savedQuota,
  collectionCount,
  onNewCollection,
}: {
  savedUsed: number;
  savedQuota: number | null;
  collectionCount: number;
  onNewCollection?: () => void;
}) {
  const secondary =
    "inline-flex items-center gap-1.5 rounded-button border border-border-default bg-surface-card px-3 py-1.5 text-body-sm font-medium text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-serif text-heading-h1 text-text-primary">Saved problems</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={secondary}>
            <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Export all
          </button>
          <Link href="/app/compare" className={secondary}>
            <GitCompare className="size-4" strokeWidth={1.5} aria-hidden="true" />
            New comparison
          </Link>
          <button
            type="button"
            onClick={onNewCollection}
            className="inline-flex items-center gap-1.5 rounded-button bg-accent-bristle px-3 py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            New collection
          </button>
        </div>
      </div>
      <p className="text-body-sm text-text-secondary">
        {savedUsed}
        {savedQuota != null ? ` of ${savedQuota}` : ""} saved &middot; organized into{" "}
        {collectionCount} {collectionCount === 1 ? "collection" : "collections"}
      </p>
    </header>
  );
}
