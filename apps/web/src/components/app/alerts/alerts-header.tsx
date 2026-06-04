import { Check, Plus, SlidersHorizontal } from "lucide-react";

// Alerts header — real counts from the board state (unread / total / rule count);
// Mark all read + New rule are wired by the island; Watch rules is visual-only.
export function AlertsHeader({
  unread,
  total,
  ruleCount,
  onMarkAll,
  onNewRule,
}: {
  unread: number;
  total: number;
  ruleCount: number;
  onMarkAll: () => void;
  onNewRule: () => void;
}) {
  const secondary =
    "inline-flex items-center gap-1.5 rounded-button border border-border-default bg-surface-card px-3 py-1.5 text-body-sm font-medium text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-serif text-heading-h1 text-text-primary">Alerts</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onMarkAll} className={secondary} disabled={unread === 0}>
            <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Mark all read
          </button>
          <button type="button" className={secondary}>
            <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Watch rules
          </button>
          <button
            type="button"
            onClick={onNewRule}
            className="inline-flex items-center gap-1.5 rounded-button bg-accent-bristle px-3 py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            New rule
          </button>
        </div>
      </div>
      <p className="text-body-sm text-text-secondary">
        {unread} unread &middot; {total} in the last 7 days &middot; {ruleCount} watch{" "}
        {ruleCount === 1 ? "rule" : "rules"}
      </p>
    </header>
  );
}
