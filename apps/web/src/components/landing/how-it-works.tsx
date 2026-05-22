import { Download, Network, Sparkles, type LucideIcon } from "lucide-react";

const STEPS: { n: string; title: string; Icon: LucideIcon; body: string }[] = [
  {
    n: "01",
    title: "Ingest",
    Icon: Download,
    body: "Six public sources, polled continuously. New mentions land within minutes of being posted, with no rate-limited blind spots.",
  },
  {
    n: "02",
    title: "Cluster",
    Icon: Network,
    body: "Embedding-based clustering merges variations of the same complaint across sources. One problem, every place it was raised.",
  },
  {
    n: "03",
    title: "Synthesize",
    Icon: Sparkles,
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
        {STEPS.map(({ n, title, Icon, body }) => (
          <article key={n} className="rounded-card border border-border-default bg-surface-card p-card">
            <div className="flex items-center justify-between">
              <Icon className="size-5 text-accent-bristle" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-mono text-mono-sm text-text-tertiary">{n}</span>
            </div>
            <h3 className="mt-grid font-serif text-h4 text-text-primary">{title}</h3>
            <p className="mt-snug text-body-sm text-text-secondary">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
