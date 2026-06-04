import Link from "next/link";

import type { RelatedVM } from "@/lib/problem-detail-adapter";

// "Related problems" rail panel — compact list sharing the related-panel link
// rule: a row with a target links to the authenticated detail; a label-only row
// renders as plain text (no dead link).
export function RelatedRail({ related }: { related: RelatedVM[] }) {
  if (related.length === 0) return null;
  return (
    <section className="rounded-card border border-border-default bg-surface-card p-grid">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        Related problems
      </p>
      <ul className="mt-grid space-y-snug">
        {related.map((r) => (
          <li key={r.id}>
            {r.href ? (
              <Link
                href={r.href}
                className="flex items-center justify-between gap-2 rounded-button p-snug text-body-sm text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
              >
                <span>{r.label}</span>
                <span aria-hidden="true" className="text-text-tertiary">
                  →
                </span>
              </Link>
            ) : (
              <span className="block p-snug text-body-sm text-text-secondary">{r.label}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
