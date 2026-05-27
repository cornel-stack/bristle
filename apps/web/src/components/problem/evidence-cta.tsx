// Gated sign-up callout appended after the 7 evidence cards. Accent-bristle
// border signals the "gated" affordance; the CTA links to /signup (slice-005
// known soft-404 — replaced by the auth-tier slice).
//
// Voice §6: no exclamations, no hype. The "47" is the load-bearing fact;
// the interpunct-separated subline matches the slice-005 hero subline cadence.
// If a future slice generalizes this card across problems, swap to a
// quoteCount prop.

import Link from "next/link";

export function EvidenceCTA() {
  return (
    <aside className="rounded-card border border-accent-bristle bg-surface-raised p-grid text-center">
      <p className="font-serif text-h3 text-text-primary">Sign up to see all 47 quotes</p>
      <p className="mt-snug text-body-sm text-text-secondary">
        Free, no credit card &middot; See 6 existing solutions and 4 willingness-to-pay mentions
      </p>
      <Link
        href="/signup"
        className="mt-grid inline-block rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card"
      >
        Create free account &rarr;
      </Link>
    </aside>
  );
}
