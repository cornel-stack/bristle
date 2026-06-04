import type { WtpVM } from "@/lib/problem-detail-adapter";

// Willingness-to-pay — used by the WTP tab AND (compact) the right rail. A null
// signal is a genuine 0 (e.g. pgvector): render an explicit, dry empty state, not
// a blank or broken panel.
export function WtpPanel({
  wtp,
  compact = false,
}: {
  wtp: WtpVM | null;
  compact?: boolean;
}) {
  if (!wtp) {
    return (
      <div className={compact ? "" : "rounded-card border border-border-default bg-surface-card p-grid"}>
        {compact ? (
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
            Willingness to pay
          </p>
        ) : (
          <h2 className="font-serif text-heading-h3 text-text-primary">Willingness to pay</h2>
        )}
        <p className="mt-snug text-body-md text-text-secondary">
          No willingness-to-pay signal yet.
        </p>
      </div>
    );
  }

  const headline = `${wtp.mentionCount} mentions${wtp.priceRange ? ` · ${wtp.priceRange}` : ""}`;

  return (
    <div className={compact ? "" : "rounded-card border border-border-default bg-surface-card p-grid"}>
      {compact ? (
        <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
          Willingness to pay
        </p>
      ) : (
        <h2 className="font-serif text-heading-h3 text-text-primary">Willingness to pay</h2>
      )}
      <p
        className={
          compact
            ? "mt-snug text-heading-h4 font-medium text-text-primary"
            : "mt-snug text-heading-h3 font-serif text-text-primary"
        }
      >
        {headline}
      </p>
      {wtp.median != null ? (
        <p className="mt-snug text-body-sm text-text-secondary">
          Median stated price: ${wtp.median}/mo
        </p>
      ) : null}
      {wtp.note ? (
        <p
          className={
            compact
              ? "mt-snug text-body-sm text-text-secondary"
              : "mt-snug text-body-md text-text-secondary"
          }
        >
          {wtp.note}
        </p>
      ) : null}
    </div>
  );
}
