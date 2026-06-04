import { SourcesCard } from "@/components/problem/sources-card";
import type { DetailViewModel } from "@/lib/problem-detail-adapter";

import { WtpPanel } from "../panels/wtp-panel";
import { PersonasRail } from "./personas-rail";
import { RelatedRail } from "./related-rail";

// Persistent right rail — rendered by the composer OUTSIDE the tab island, so it
// stays visible across every panel switch. Reuses the public SourcesCard (→
// DonutChart) via the adapter's donut rows (5 live sources; slices sum to the
// quote total — no Product Hunt / Google Play) and the WTP panel in compact mode;
// the personas + related panels are in-app.
export function DetailRail({ vm }: { vm: DetailViewModel }) {
  return (
    <>
      <SourcesCard rows={vm.donutRows} total={vm.quoteTotal} />
      <section className="rounded-card border border-border-default bg-surface-card p-grid">
        <WtpPanel wtp={vm.wtp} compact />
      </section>
      <PersonasRail personas={vm.personas} />
      <RelatedRail related={vm.related} />
    </>
  );
}
