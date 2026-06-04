import type { SolutionVM } from "@/lib/problem-detail-adapter";

// Solutions tab — existing-solution cards with a direct/adjacent/partial match
// chip. Direct uses the validated accent; adjacent/partial stay neutral.
const MATCH_LABEL: Record<string, string> = {
  direct: "Direct match",
  adjacent: "Adjacent",
  partial: "Partial",
};

function matchClass(matchType: string): string {
  const base = "rounded-pill px-2 py-0.5 text-body-sm font-medium";
  return matchType === "direct"
    ? `${base} bg-surface-raised text-accent-validated`
    : `${base} bg-surface-raised text-text-secondary`;
}

export function SolutionsPanel({ solutions }: { solutions: SolutionVM[] }) {
  if (solutions.length === 0) {
    return <p className="text-body-md text-text-secondary">No existing solutions noted.</p>;
  }
  return (
    <section className="flex flex-col gap-grid">
      <h2 className="font-serif text-heading-h3 text-text-primary">
        Existing solutions &middot; {solutions.length}
      </h2>
      <div className="grid gap-grid sm:grid-cols-2">
        {solutions.map((s) => (
          <article
            key={s.id}
            className="flex flex-col gap-snug rounded-card border border-border-default bg-surface-card p-grid"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-heading-h4 font-medium text-text-primary">{s.name}</h3>
              <span className={matchClass(s.matchType)}>
                {MATCH_LABEL[s.matchType] ?? s.matchType}
              </span>
            </div>
            {s.priceRange ? (
              <p className="font-mono text-body-sm text-text-secondary">{s.priceRange}</p>
            ) : null}
            {s.description ? (
              <p className="text-body-md text-text-secondary">{s.description}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
