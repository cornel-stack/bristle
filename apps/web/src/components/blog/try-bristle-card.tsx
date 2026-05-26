// Fixed conversion CTA card. Renders in the right column of every
// /blog/[slug] route. Content is module-scoped constants — same across all
// 7 article pages (FR-017). The `/signup` destination is a known-out-of-scope
// soft-404 until Tier 3 slice 3.1 auth ships (documented carry-forward).

import Link from "next/link";

const EYEBROW = "TRY BRISTLE";
const HEADLINE = "See today's high-signal problems.";
const CTA_LABEL = "Start free";
const CTA_HREF = "/signup";

export function TryBristleCard() {
  return (
    <aside className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card">
      <p className="font-mono text-body-sm uppercase tracking-wide text-accent-bristle">
        {EYEBROW}
      </p>
      <h3 className="font-serif text-h3 text-text-primary">{HEADLINE}</h3>
      <Link
        href={CTA_HREF}
        className="inline-flex items-center justify-center rounded-button bg-text-primary px-card py-snug text-body-md font-medium text-surface-card transition-colors hover:bg-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        {CTA_LABEL}
      </Link>
    </aside>
  );
}
