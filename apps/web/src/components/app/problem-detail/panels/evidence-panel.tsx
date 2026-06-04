"use client";

// Evidence tab — WRAP (not the public EvidenceList). Filter chips show the
// DETECTED aggregate volume per source (All 47 / GH 20 / HN 13 / SO 9 / Other 5,
// from problem_sources) — but the list is the deliberately small 4.1 sample of
// representative quotes. So the list is framed honestly: "Showing N of M" for the
// active filter, and NO "show K more" that would promise rows the sample doesn't
// contain. Filtering narrows to the real rows that exist for that source.

import { useState } from "react";

import type {
  EvidenceFilterVM,
  EvidenceGroup,
  EvidenceVM,
} from "@/lib/problem-detail-adapter";

import { EvidenceQuoteRow } from "./evidence-quote-row";

type FilterKey = "all" | EvidenceGroup;

export function EvidencePanel({
  quotes,
  filters,
}: {
  quotes: EvidenceVM[];
  filters: EvidenceFilterVM[];
}) {
  const [active, setActive] = useState<FilterKey>("all");
  const visible = active === "all" ? quotes : quotes.filter((q) => q.group === active);
  const activeFilter = filters.find((f) => f.key === active);
  const total = filters.find((f) => f.key === "all")?.count ?? quotes.length;

  return (
    <section className="flex flex-col gap-grid">
      <div className="flex flex-wrap items-center justify-between gap-grid">
        <h2 className="font-serif text-heading-h3 text-text-primary">
          Evidence &middot; {total} quotes
        </h2>
        <div role="group" aria-label="Filter by source" className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const isActive = f.key === active;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(f.key)}
                className={
                  isActive
                    ? "rounded-pill bg-text-primary px-3 py-1 text-body-sm font-medium text-surface-card"
                    : "rounded-pill border border-border-default px-3 py-1 text-body-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                }
              >
                {f.label} ({f.count})
              </button>
            );
          })}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="flex flex-col gap-grid">
          {visible.map((q) => (
            <EvidenceQuoteRow key={q.id} quote={q} />
          ))}
        </div>
      ) : (
        <p className="text-body-md text-text-secondary">
          No quotes loaded for this source.
        </p>
      )}

      <p className="text-body-sm text-text-secondary">
        Showing {visible.length} of {activeFilter?.count ?? visible.length}{" "}
        {active === "all" ? "quotes" : `${activeFilter?.label ?? ""} quotes`} detected.
      </p>
    </section>
  );
}
