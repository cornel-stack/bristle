import type { ProblemActivity } from "@bristle/db";

import { relativeTime } from "@/lib/relative-time";

// Recent-activity rail (server component). Each entry: a typed delta chip, the
// title, and a relative time. §4 tokens.
const CHIP: Record<string, string> = {
  threshold_crossed: "bg-accent-bristle/10 text-accent-bristle",
  quotes_added: "bg-accent-bristle/10 text-accent-bristle",
  problem_added: "bg-surface-raised text-text-secondary",
  saved: "bg-accent-validated/10 text-accent-validated",
};

export function ActivityRail({ entries }: { entries: ProblemActivity[] }) {
  return (
    <section className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">
        Recent activity
      </p>
      <ul className="flex flex-col gap-grid">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-snug">
            {e.deltaLabel ? (
              <span
                className={`shrink-0 rounded-pill px-snug py-0.5 text-body-sm font-medium ${
                  CHIP[e.type] ?? "bg-surface-raised text-text-secondary"
                }`}
              >
                {e.deltaLabel}
              </span>
            ) : null}
            <div className="flex min-w-0 flex-col gap-tight">
              <p className="text-body-md text-text-primary">{e.title}</p>
              <span className="text-body-sm text-text-tertiary">
                {relativeTime(e.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
