import type { ProblemActivity } from "@bristle/db";
import type { ReactNode } from "react";

import type { DetailViewModel } from "@/lib/problem-detail-adapter";

import { DetailHeader } from "./detail-header";
import { DetailTabs, type DetailTab, type DetailTabKey } from "./detail-tabs";
import { DetailRail } from "./rail/detail-rail";
import { ActivityPanel } from "./panels/activity-panel";
import { EvidencePanel } from "./panels/evidence-panel";
import { FrequencyPanel } from "./panels/frequency-panel";
import { RelatedPanel } from "./panels/related-panel";
import { SolutionsPanel } from "./panels/solutions-panel";
import { SynthesisPanel } from "./panels/synthesis-panel";
import { WtpPanel } from "./panels/wtp-panel";

// Layout composer for /app/problems/[slug]. Renders the header (with the action
// bar) + the tab island, and the persistent right rail OUTSIDE the island so it
// survives tab switches. Everything reads the boundary-adapter view model. The
// right rail is a placeholder this batch (Batch C fills it).
export function ProblemDetail({
  vm,
  activity,
}: {
  vm: DetailViewModel;
  activity: ProblemActivity[];
}) {
  const tabs: DetailTab[] = [
    { key: "synthesis", label: "Synthesis" },
    { key: "frequency", label: "Frequency" },
    { key: "evidence", label: "Evidence", count: vm.quoteTotal },
    { key: "solutions", label: "Solutions", count: vm.solutions.length },
    { key: "wtp", label: "WTP", count: vm.wtp?.mentionCount ?? 0 },
    { key: "related", label: "Related" },
    { key: "activity", label: "Activity" },
  ];

  const panels: Record<DetailTabKey, ReactNode> = {
    synthesis: <SynthesisPanel synthesis={vm.synthesis} />,
    frequency: <FrequencyPanel frequency={vm.frequency} />,
    evidence: <EvidencePanel quotes={vm.evidence} filters={vm.evidenceFilters} />,
    solutions: <SolutionsPanel solutions={vm.solutions} />,
    wtp: <WtpPanel wtp={vm.wtp} />,
    related: <RelatedPanel related={vm.related} />,
    activity: <ActivityPanel activity={activity} />,
  };

  return (
    <div className="mx-auto max-w-6xl px-grid py-section">
      <DetailHeader vm={vm} />
      <div className="grid gap-grid pt-section lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <DetailTabs tabs={tabs} panels={panels} />
        </div>
        <aside className="flex flex-col gap-grid lg:sticky lg:top-grid lg:self-start">
          <DetailRail vm={vm} />
        </aside>
      </div>
    </div>
  );
}
