// Founder card per spec FR-004. Avatar is a NON-rotated filled accent-bristle
// square per clarification (g) — NOT the slice-005 rotated brand-diamond
// (which is size-3 rotate-45). White "CO" initials on size-12 (~48px) square
// with a soft 8px corner radius (rounded-card token).

import { ABOUT_CONTENT } from "./about-content";

export function FounderCard() {
  const { initials, name, bio } = ABOUT_CONTENT.founder;

  return (
    <section className="mx-auto max-w-3xl px-grid pb-loose">
      <div className="flex items-start gap-card rounded-card border border-border-default bg-surface-card p-card">
        <div
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-card bg-accent-bristle font-serif text-h4 font-medium text-surface-card"
        >
          {initials}
        </div>
        <div>
          <p className="font-serif text-h3 text-text-primary">{name}</p>
          <p className="mt-tight text-body-md text-text-secondary">{bio}</p>
        </div>
      </div>
    </section>
  );
}
