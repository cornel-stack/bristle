// Static mono stats ticker for the editorial auth panel (server component).
// "6 SOURCES · 142,318 PROBLEMS · UPDATED 14 SEC AGO" — values hardcoded for
// v1 (spec C-b); wiring to live data is a tracked follow-up (TF-004). The
// precise "142,318" matches the design footer verbatim; the editorial body
// prose uses the rounded "142,000" — both are intentionally kept as drawn.
// Interpunct separators use the brand accent token (not a hardcoded orange).

const STATS = ["6 SOURCES", "142,318 PROBLEMS", "UPDATED 14 SEC AGO"] as const;

export function BrandFooterStats() {
  return (
    <p className="flex flex-wrap items-center gap-tight font-mono text-mono-sm uppercase tracking-wide text-text-tertiary">
      {STATS.map((stat, i) => (
        <span key={stat} className="flex items-center gap-tight">
          {i > 0 ? (
            <span aria-hidden="true" className="text-accent-bristle">
              ·
            </span>
          ) : null}
          {stat}
        </span>
      ))}
    </p>
  );
}
