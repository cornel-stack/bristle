import { CATEGORY_LABELS, SOURCE_BADGES, type CategoryKey } from "@bristle/shared";

import type { FacetCounts } from "@/lib/library-filter";
import {
  MOMENTUM_LABELS,
  MOMENTUM_VALUES,
  SIGNAL_LABELS,
  SIGNAL_VALUES,
  type LibraryQuery,
} from "@/lib/library-params";

import { FacetGroup, type FacetValue } from "./facet-group";

// The facet rail — Category (8, incl. Email / Comms) · Momentum (4 buckets) ·
// Source (5 live badges via the registry — no PH/Google Play; Forums present) ·
// Signals (3). Counts come from the engine's DRILL-DOWN facetCounts (a value's
// count is computed against the OTHER active groups + search). Server-rendered;
// each group is a thin client island.
export function FacetRail({
  query,
  facetCounts,
}: {
  query: LibraryQuery;
  facetCounts: FacetCounts;
}) {
  const categoryValues: FacetValue[] = (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map(
    (key) => ({
      value: key,
      label: CATEGORY_LABELS[key],
      count: facetCounts.category[key] ?? 0,
    }),
  );
  const momentumValues: FacetValue[] = MOMENTUM_VALUES.map((m) => ({
    value: m,
    label: MOMENTUM_LABELS[m],
    count: facetCounts.momentum[m] ?? 0,
  }));
  const sourceValues: FacetValue[] = SOURCE_BADGES.map((b) => ({
    value: b.badgeKey,
    label: b.label,
    count: facetCounts.source[b.badgeKey] ?? 0,
  }));
  const signalValues: FacetValue[] = SIGNAL_VALUES.map((s) => ({
    value: s,
    label: SIGNAL_LABELS[s],
    count: facetCounts.signal[s] ?? 0,
  }));

  return (
    <div className="flex flex-col gap-section">
      <FacetGroup param="category" title="Category" values={categoryValues} selected={query.categories} />
      <FacetGroup param="momentum" title="Momentum" values={momentumValues} selected={query.momentum} />
      <FacetGroup param="source" title="Source" values={sourceValues} selected={query.sources} />
      <FacetGroup param="signal" title="Signals" values={signalValues} selected={query.signals} />
    </div>
  );
}
