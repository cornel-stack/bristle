// /blog index hero — eyebrow + serif headline + subhead. No props (the hero
// is identical on every render of the index). Tokens-only.

export function BlogHero() {
  return (
    <section className="pt-section pb-loose">
      <p className="text-body-sm font-medium uppercase tracking-wide text-accent-bristle">
        BRISTLE BLOG
      </p>
      <h1 className="mt-grid font-serif text-display-lg text-text-primary">
        Field Notes
      </h1>
      <p className="mt-grid max-w-2xl text-body-md text-text-secondary">
        Research, analysis, and the occasional opinion on building products against evidence.
      </p>
    </section>
  );
}
