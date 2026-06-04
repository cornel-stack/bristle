import { KpiSparkline, type KpiVariant } from "./kpi-sparkline";

// One KPI tile (server component). value + optional delta% / quota / secondary
// label, with a decorative sparkline. §4 tokens.
export function KpiCard({
  label,
  value,
  variant,
  delta,
  quota,
  secondary,
}: {
  label: string;
  value: number | string;
  variant: KpiVariant;
  delta?: number | null;
  quota?: number | null;
  secondary?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-grid rounded-card border border-border-default bg-surface-card p-card">
      <div className="flex flex-col gap-tight">
        <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </p>
        <div className="flex items-baseline gap-tight">
          <span className="font-serif text-h2 font-semibold text-text-primary">
            {value}
          </span>
          {delta != null ? (
            <span className="text-body-sm font-medium text-accent-validated">
              +{delta}%
            </span>
          ) : null}
          {quota != null ? (
            <span className="text-body-sm text-text-tertiary">of {quota}</span>
          ) : null}
          {secondary ? (
            <span className="text-body-sm text-text-secondary">{secondary}</span>
          ) : null}
        </div>
      </div>
      <KpiSparkline variant={variant} />
    </div>
  );
}
