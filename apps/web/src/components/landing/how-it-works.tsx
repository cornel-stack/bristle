// Inline step glyphs (currentColor, no hex) so the section adds no icon dependency.
function IngestGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClusterGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <circle cx="7" cy="8" r="2.5" /><circle cx="17" cy="8" r="2.5" /><circle cx="12" cy="17" r="2.5" />
      <path d="M8.6 9.8 11 15M15.4 9.8 13 15" strokeLinecap="round" />
    </svg>
  );
}
function SynthGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M13 3 5 14h6l-2 7 8-11h-6l2-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Ingest",
    glyph: <IngestGlyph />,
    body: "Six public sources, polled continuously. New mentions land within minutes of being posted, with no rate-limited blind spots.",
  },
  {
    n: "02",
    title: "Cluster",
    glyph: <ClusterGlyph />,
    body: "Embedding-based clustering merges variations of the same complaint across sources. One problem, every place it was raised.",
  },
  {
    n: "03",
    title: "Synthesize",
    glyph: <SynthGlyph />,
    body: "Each cluster becomes an editorial report: a two-paragraph synthesis, momentum, pull-quotes, existing solutions, and willingness-to-pay signals.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-grid py-section">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">How it works</p>
      <h2 className="mt-snug font-serif text-h2 text-text-primary">
        A research journal that doesn&rsquo;t sleep.
      </h2>
      <div className="mt-grid grid gap-grid md:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.n} className="rounded-card border border-border-default bg-surface-card p-card">
            <div className="flex items-center justify-between">
              <span className="text-h4 text-accent-bristle">{step.glyph}</span>
              <span className="font-mono text-mono-sm text-text-tertiary">{step.n}</span>
            </div>
            <h3 className="mt-grid font-serif text-h4 text-text-primary">{step.title}</h3>
            <p className="mt-snug text-body-sm text-text-secondary">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
