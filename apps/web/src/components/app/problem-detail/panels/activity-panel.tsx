import type { ProblemActivity } from "@bristle/db";

import { relativeTime } from "@/lib/relative-time";

// Activity tab — this problem's event log (newest first), via getProblemActivity.
// Genuinely empty problems render a clean empty state rather than a blank tab.
const TYPE_LABEL: Record<string, string> = {
  threshold_crossed: "Threshold",
  quotes_added: "Quotes",
  problem_added: "New",
  saved: "Saved",
};

export function ActivityPanel({ activity }: { activity: ProblemActivity[] }) {
  if (activity.length === 0) {
    return (
      <p className="text-body-md text-text-secondary">
        Nothing logged for this problem yet.
      </p>
    );
  }
  return (
    <section className="flex flex-col gap-grid">
      <h2 className="font-serif text-heading-h3 text-text-primary">Activity</h2>
      <ul className="flex flex-col gap-snug">
        {activity.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center gap-2 rounded-card border border-border-default bg-surface-card p-grid text-body-sm"
          >
            <span className="rounded-pill bg-surface-raised px-2 py-0.5 font-medium text-text-secondary">
              {TYPE_LABEL[a.type] ?? a.type}
            </span>
            <span className="text-text-primary">{a.title}</span>
            {a.deltaLabel ? (
              <span className="font-mono text-text-secondary">{a.deltaLabel}</span>
            ) : null}
            <span className="ml-auto text-text-secondary">{relativeTime(a.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
