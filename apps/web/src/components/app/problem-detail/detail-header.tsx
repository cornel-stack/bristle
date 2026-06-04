import { SourceIcon } from "@bristle/ui";

import { ProblemMomentumChip } from "@/components/problem/problem-momentum-chip";
import type { DetailViewModel } from "@/lib/problem-detail-adapter";

import { DetailActionBar } from "./detail-action-bar";

// Detail header — breadcrumb + action bar, then chips + provenance, then the
// title, momentum, source badges, and the "N quotes · N sources · N WTP" summary.
// All derived values + the badge→icon mapping come from the boundary adapter
// (the reused ProblemMomentumChip + SourceIcon take adapter output unmodified).
export function DetailHeader({ vm }: { vm: DetailViewModel }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border-default pb-section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <nav aria-label="Breadcrumb" className="min-w-0 text-body-sm text-text-secondary">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>Library</li>
            <li aria-hidden="true">/</li>
            <li>{vm.categoryLabel}</li>
            <li aria-hidden="true">/</li>
            <li className="truncate font-medium text-text-primary">{vm.title}</li>
          </ol>
        </nav>
        <DetailActionBar isSaved={vm.isSaved} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-body-sm text-text-secondary">
        <span className="rounded-pill bg-surface-raised px-2 py-0.5 font-medium text-text-primary">
          {vm.categoryLabel}
        </span>
        {vm.demand ? (
          <span
            className={
              vm.demand.validated
                ? "rounded-pill bg-surface-raised px-2 py-0.5 font-medium text-accent-validated"
                : "rounded-pill bg-surface-raised px-2 py-0.5 font-medium text-text-secondary"
            }
          >
            {vm.demand.label}
          </span>
        ) : null}
        {vm.firstSeenLabel ? <span>First seen {vm.firstSeenLabel}</span> : null}
        {vm.updatedLabel ? (
          <>
            <span aria-hidden="true">·</span>
            <span>Updated {vm.updatedLabel}</span>
          </>
        ) : null}
      </div>

      <h1 className="font-serif text-heading-h1 text-text-primary">{vm.title}</h1>

      <div className="flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
        <ProblemMomentumChip momentum={vm.momentum} />
        {vm.sourceIcons.length > 0 ? (
          <span className="flex items-center gap-1.5">
            {vm.sourceIcons.map((key) => (
              <SourceIcon key={key} source={key} className="size-4 text-text-secondary" />
            ))}
          </span>
        ) : null}
        <span>
          {vm.summary.quotes} quotes &middot; {vm.summary.sources} sources &middot;{" "}
          {vm.summary.wtpMentions} willingness-to-pay mentions
        </span>
      </div>
    </header>
  );
}
