import type { Problem } from "@bristle/db";

import type { FacetCounts } from "@/lib/library-filter";
import type { LibraryQuery } from "@/lib/library-params";

import { LibraryHeader } from "./library-header";
import { LibrarySearch } from "./library-search";
import { LibrarySort } from "./library-sort";
import { ResultsTable } from "./results-table";

// Library composer — header (search + sort) over a 2-column body (facet rail |
// results). The facet rail is a placeholder this batch (Batch B); the card-grid
// toggle + mobile drawer + empty state arrive in Batch C. The table scrolls
// horizontally on narrow viewports.
export function LibraryView({
  query,
  results,
  total,
}: {
  query: LibraryQuery;
  results: Problem[];
  facetCounts: FacetCounts;
  total: number;
}) {
  return (
    <div className="mx-auto max-w-7xl px-grid py-section">
      <LibraryHeader
        total={total}
        sort={query.sort}
        searchSlot={<LibrarySearch initial={query.q} />}
        sortSlot={<LibrarySort value={query.sort} />}
      />
      <div className="mt-section grid gap-section lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <div className="rounded-card border border-border-default bg-surface-card p-grid text-body-sm text-text-secondary">
            Filters
          </div>
        </aside>
        <div className="min-w-0 overflow-x-auto">
          <ResultsTable results={results} />
        </div>
      </div>
    </div>
  );
}
