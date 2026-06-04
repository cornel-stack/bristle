// Feed type-filter tabs. Client view-state (the screen is a stateful island — not
// URL-param like the read-only Library; A4). Threshold-reached groups
// threshold + weekly; New problems = new; Unread = !isRead.
export type AlertFilter = "all" | "unread" | "momentum" | "new" | "threshold";

export const ALERT_FILTERS: { key: AlertFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "momentum", label: "Momentum" },
  { key: "new", label: "New problems" },
  { key: "threshold", label: "Threshold reached" },
];

export function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active: AlertFilter;
  counts: Record<AlertFilter, number>;
  onChange: (f: AlertFilter) => void;
}) {
  return (
    <div role="tablist" aria-label="Filter notifications" className="flex flex-wrap gap-1 border-b border-border-default">
      {ALERT_FILTERS.map((f) => {
        const selected = f.key === active;
        return (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(f.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-body-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle ${
              selected
                ? "border-accent-bristle font-medium text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {f.label}
            <span className="ml-1 font-mono text-text-tertiary">{counts[f.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
