import type { ProblemActivity, ProblemDetail } from "@bristle/db";
import type { ReactNode } from "react";

import { DetailHeader } from "./detail-header";
import { DetailTabs, type DetailTab, type DetailTabKey } from "./detail-tabs";

// Layout composer for /app/problems/[slug]. Renders the header (with the action
// bar) + the tab island, and the persistent right rail OUTSIDE the island so it
// survives tab switches. The seven panels + the rail regions are placeholders
// this batch (Batch B fills the panels, Batch C the rail); the tab strip, counts,
// deep-linking, and keyboard nav are live now.

function Placeholder({ label }: { label: string }) {
  return <p className="text-body-md text-text-secondary">{label}</p>;
}

export function ProblemDetail({
  detail,
  activity,
  isSaved,
}: {
  detail: ProblemDetail;
  activity: ProblemActivity[];
  isSaved: boolean;
}) {
  const tabs: DetailTab[] = [
    { key: "synthesis", label: "Synthesis" },
    { key: "frequency", label: "Frequency" },
    { key: "evidence", label: "Evidence", count: detail.quotes.length },
    { key: "solutions", label: "Solutions", count: detail.solutions.length },
    { key: "wtp", label: "WTP", count: detail.wtp?.mentionCount ?? 0 },
    { key: "related", label: "Related" },
    { key: "activity", label: "Activity" },
  ];

  const panels: Record<DetailTabKey, ReactNode> = {
    synthesis: <Placeholder label="Synthesis" />,
    frequency: <Placeholder label="Frequency" />,
    evidence: <Placeholder label="Evidence" />,
    solutions: <Placeholder label="Solutions" />,
    wtp: <Placeholder label="Willingness to pay" />,
    related: <Placeholder label="Related" />,
    activity: <Placeholder label={`Activity (${activity.length} events)`} />,
  };

  return (
    <div className="mx-auto max-w-6xl px-grid py-section">
      <DetailHeader detail={detail} isSaved={isSaved} />
      <div className="grid gap-grid pt-section lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <DetailTabs tabs={tabs} panels={panels} />
        </div>
        <aside className="flex flex-col gap-grid lg:sticky lg:top-grid lg:self-start">
          <div className="rounded-card border border-border-default bg-surface-card p-grid text-body-sm text-text-secondary">
            Right rail
          </div>
        </aside>
      </div>
    </div>
  );
}
