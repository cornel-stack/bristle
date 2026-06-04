import type { PersonaVM } from "@/lib/problem-detail-adapter";

// "Who's complaining" rail panel — persona breakdown with proportion bars. Bars
// are hand-rolled SVG (a pct-width rect over a full-width track) so the dynamic
// width is geometry, not an inline style (§5: Tailwind classes only).
export function PersonasRail({ personas }: { personas: PersonaVM[] }) {
  if (personas.length === 0) return null;
  return (
    <section className="rounded-card border border-border-default bg-surface-card p-grid">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        Who&rsquo;s complaining
      </p>
      <ul className="mt-grid space-y-grid">
        {personas.map((p) => (
          <li key={p.id}>
            <div className="flex items-baseline justify-between text-body-sm">
              <span className="text-text-primary">{p.label}</span>
              <span className="font-mono text-text-secondary">{p.count}</span>
            </div>
            <svg
              viewBox="0 0 100 4"
              preserveAspectRatio="none"
              role="presentation"
              className="mt-1 h-1.5 w-full"
            >
              <rect x="0" y="0" width="100" height="4" rx="2" className="fill-surface-raised" />
              <rect x="0" y="0" width={p.pct} height="4" rx="2" className="fill-accent-bristle" />
            </svg>
          </li>
        ))}
      </ul>
    </section>
  );
}
