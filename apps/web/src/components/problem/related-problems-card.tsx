// Sticky-rail card rendered alongside SourcesCard on the full Stripe page.
// Lists 4 related problems, each linking to /problems/{slug}. Tokens-only.
// The 4 destinations are the 4 stub slugs that ship in this slice's data
// store — the link-flip contract (3 of 4 also flip slice-005 landing
// SampleReports cards from soft-404 to live).

import Link from "next/link";
import type { SampleProblemRelatedItem } from "./types";

export function RelatedProblemsCard({ items }: { items: ReadonlyArray<SampleProblemRelatedItem> }) {
  return (
    <aside className="rounded-card border border-border-default bg-surface-card p-grid">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        Related problems
      </p>
      <ul className="mt-grid space-y-grid">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/problems/${item.slug}`}
              className="block rounded-button p-snug hover:bg-surface-raised"
            >
              <p className="text-body-md font-medium text-text-primary">{item.title}</p>
              <p className="mt-snug text-body-sm text-text-secondary">{item.leadSnippet}</p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
