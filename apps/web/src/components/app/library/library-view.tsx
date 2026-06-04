import type { Problem } from "@bristle/db";
import { CATEGORY_LABELS, SOURCE_BADGES, type CategoryKey } from "@bristle/shared";

import type { FacetCounts } from "@/lib/library-filter";
import {
  MOMENTUM_LABELS,
  SIGNAL_LABELS,
  type LibraryQuery,
} from "@/lib/library-params";

import { ActiveFilters, type ActiveChip } from "./active-filters";
import { FacetRail } from "./facet-rail";
import { LibraryHeader } from "./library-header";
import { LibrarySearch } from "./library-search";
import { LibrarySort } from "./library-sort";
import { ResultsTable } from "./results-table";

const SOURCE_LABEL = new Map(SOURCE_BADGES.map((b) => [b.badgeKey, b.label]));

// Build the active-filter chip list from the query, with display labels (the
// label maps live server-side; the chip island only handles removal).
function buildChips(query: LibraryQuery): ActiveChip[] {
  return [
    ...query.categories.map((value) => ({
      param: "category",
      value,
      label: CATEGORY_LABELS[value as CategoryKey] ?? value,
    })),
    ...query.sources.map((value) => ({
      param: "source",
      value,
      label: SOURCE_LABEL.get(value) ?? value,
    })),
    ...query.momentum.map((value) => ({
      param: "momentum",
      value,
      label: MOMENTUM_LABELS[value],
    })),
    ...query.signals.map((value) => ({
      param: "signal",
      value,
      label: SIGNAL_LABELS[value],
    })),
  ];
}

// Library composer — header (search + sort) + active-filter chips, over a
// 2-column body (facet rail | results). The card-grid toggle + mobile drawer +
// empty state arrive in Batch C. The table scrolls horizontally on narrow
// viewports.
export function LibraryView({
  query,
  results,
  facetCounts,
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
      <div className="mt-grid">
        <ActiveFilters chips={buildChips(query)} />
      </div>
      <div className="mt-section grid gap-section lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <FacetRail query={query} facetCounts={facetCounts} />
        </aside>
        <div className="min-w-0 overflow-x-auto">
          <ResultsTable results={results} />
        </div>
      </div>
    </div>
  );
}
