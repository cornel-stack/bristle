import { ABOUT_CONTENT } from "./about-content";

export function AboutHero() {
  const { publishedDate, author, readTime } = ABOUT_CONTENT.byline;
  return (
    <section className="mx-auto max-w-3xl px-grid pt-section pb-loose">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        ABOUT BRISTLE
      </p>
      <h1 className="mt-grid font-serif text-display-lg text-text-primary">
        We build research tools for builders who hate guessing.
      </h1>
      <p className="mt-grid text-body-sm text-text-secondary">
        {publishedDate} · {author} · {readTime}
      </p>
    </section>
  );
}
