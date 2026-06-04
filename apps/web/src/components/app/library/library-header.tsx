import type { ReactNode } from "react";

import type { SortKey } from "@/lib/dashboard-sort";
import { SORT_LABELS } from "@/lib/library-params";

// Library header — title + controls row (search / sort / view-toggle slots) +
// the result-count line. The count is the REAL matching total (FR-004) — no
// scale literal ("142,318 indexed / 87 active" intentionally dropped, A2).
export function LibraryHeader({
  total,
  sort,
  searchSlot,
  sortSlot,
  viewToggleSlot,
}: {
  total: number;
  sort: SortKey;
  searchSlot: ReactNode;
  sortSlot: ReactNode;
  viewToggleSlot?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-heading-h1 text-text-primary">Library</h1>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {searchSlot}
          {sortSlot}
          {viewToggleSlot}
        </div>
      </div>
      <p className="text-body-sm text-text-secondary">
        {total} {total === 1 ? "result" : "results"} &middot; sorted by {SORT_LABELS[sort]}
      </p>
    </header>
  );
}
