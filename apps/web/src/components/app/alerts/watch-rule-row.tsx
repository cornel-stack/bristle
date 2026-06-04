import type { AlertRule } from "@bristle/db";

// One watch rule in the rail — name (category · condition) + fired-count subline
// ("New" when never fired) + an accessible on/off switch. Toggle is ephemeral.
export function WatchRuleRow({
  rule,
  onToggle,
}: {
  rule: AlertRule;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-grid">
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-text-primary">{rule.name}</p>
        <p className="mt-0.5 text-body-sm text-text-tertiary">
          {rule.firedCount === 0 ? "New" : `${rule.firedCount} fired`}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={rule.enabled}
        aria-label={`${rule.name} — ${rule.enabled ? "on" : "off"}`}
        onClick={() => onToggle(rule.id)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-pill transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle ${
          rule.enabled ? "bg-accent-bristle" : "bg-border-strong"
        }`}
      >
        <span
          className={`inline-block size-4 rounded-pill bg-surface-card transition-transform ${
            rule.enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
