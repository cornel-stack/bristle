import type { LegalHeroContent } from "./types";

export function LegalHero({ hero }: { hero: LegalHeroContent }) {
  const { eyebrow, headline, lastUpdated } = hero;
  const caption = lastUpdated.effective
    ? `Last updated · ${lastUpdated.posted} · Effective ${lastUpdated.effective}`
    : `Last updated · ${lastUpdated.posted}`;

  return (
    <section className="mx-auto max-w-3xl px-grid pt-section pb-loose">
      <p className="text-body-sm font-medium uppercase tracking-wide text-accent-bristle">
        {eyebrow}
      </p>
      <h1 className="mt-grid font-serif text-display-lg text-text-primary">
        {headline}
      </h1>
      <p className="mt-grid text-body-sm text-text-secondary">{caption}</p>
    </section>
  );
}
