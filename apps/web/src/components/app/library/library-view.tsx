import type { Problem } from "@bristle/db";
import { CATEGORY_LABELS, SOURCE_BADGES, type CategoryKey } from "@bristle/shared";
import Link from "next/link";

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
import { LibraryViewToggle } from "./library-view-toggle";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { ResultsGrid } from "./results-grid";
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
    ...query.momentum.map((value) => ({ param: "momentum", value, label: MOMENTUM_LABELS[value] })),
    ...query.signals.map((value) => ({ param: "signal", value, label: SIGNAL_LABELS[value] })),
  ];
}

function EmptyState() {
  return (
    <div className="rounded-card border border-border-default bg-surface-card py-section text-center">
      <p className="text-body-md text-text-secondary">No problems match these filters.</p>
      <Link
        href="/app/library"
        className="mt-grid inline-block rounded-button px-3 py-1.5 text-body-sm font-medium text-accent-bristle transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        Clear filters
      </Link>
    </div>
  );
}

// Library composer — header (search / sort / view toggle) + active-filter chips,
// over a 2-column body (facet rail | results). The rail collapses to a mobile
// drawer below lg. The result area renders the list/table or the card grid by
// ?view=, or the empty state when nothing matches.
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
  const chips = buildChips(query);

  return (
    <div className="mx-auto max-w-7xl px-grid py-section">
      <LibraryHeader
        total={total}
        sort={query.sort}
        searchSlot={<LibrarySearch initial={query.q} />}
        sortSlot={<LibrarySort value={query.sort} />}
        viewToggleSlot={<LibraryViewToggle value={query.view} />}
      />

      <div className="mt-grid flex flex-wrap items-center gap-grid">
        <MobileFilterDrawer activeCount={chips.length}>
          <FacetRail query={query} facetCounts={facetCounts} />
        </MobileFilterDrawer>
        <ActiveFilters chips={chips} />
      </div>

      <div className="mt-section grid gap-section lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <FacetRail query={query} facetCounts={facetCounts} />
        </aside>
        <div className="min-w-0">
          {total === 0 ? (
            <EmptyState />
          ) : query.view === "grid" ? (
            <ResultsGrid results={results} />
          ) : (
            <div className="overflow-x-auto">
              <ResultsTable results={results} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
