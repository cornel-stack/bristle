import Link from "next/link";

import type { RelatedVM } from "@/lib/problem-detail-adapter";

// Related tab — WRAP (not the public RelatedProblemsCard, which hardcodes the
// public /problems/[slug] link and can't represent a label-only row). A row with
// a target links to the AUTHENTICATED detail; a label-only row (no seeded target)
// renders as plain text — no dead link.
export function RelatedPanel({ related }: { related: RelatedVM[] }) {
  if (related.length === 0) {
    return <p className="text-body-md text-text-secondary">No related problems yet.</p>;
  }
  return (
    <section className="flex flex-col gap-grid">
      <h2 className="font-serif text-heading-h3 text-text-primary">Related problems</h2>
      <ul className="flex flex-col gap-snug">
        {related.map((r) =>
          r.href ? (
            <li key={r.id}>
              <Link
                href={r.href}
                className="flex items-center justify-between rounded-button border border-border-default bg-surface-card p-grid text-body-md text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
              >
                <span>{r.label}</span>
                <span aria-hidden="true" className="text-text-tertiary">
                  →
                </span>
              </Link>
            </li>
          ) : (
            <li
              key={r.id}
              className="rounded-button border border-border-default bg-surface-card p-grid text-body-md text-text-secondary"
            >
              {r.label}
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
