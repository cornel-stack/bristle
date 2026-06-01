// Dark editorial panel for the split-screen auth layout (server component).
// Renderable with ZERO props — every field has a default so a page can drop in
// <EditorialPanel /> and get the canonical content (spec FR-007).
//
// ALWAYS-DARK technique: the panel scopes `data-theme="dark"` on its own
// subtree so the existing Editorial-Dark token values (globals.css
// `[data-theme="dark"]`) resolve here regardless of the ambient page theme.
// This keeps the panel warm-near-black in light mode WITHOUT introducing any
// new token (tokens are not extended this slice) and WITHOUT hardcoded hex.

import type { ReactNode } from "react";

import { BrandFooterStats } from "./brand-footer-stats";

interface Testimonial {
  quote: string;
  authorInitials: string;
  authorName: string;
  authorMeta: string;
}

const DEFAULT_HEADLINE = "Real problems, ranked by evidence — not vibes.";
const DEFAULT_BODY =
  "Six sources, 142,000 problems indexed, and an editorial synthesis that reads like a research journal.";
const DEFAULT_TESTIMONIAL: Testimonial = {
  quote:
    "Bristle replaced our weekly idea brainstorm with something we can actually defend in a roadmap meeting.",
  authorInitials: "JM",
  authorName: "Jules Marin",
  authorMeta: "Founder · Lattice Studio",
};

interface EditorialPanelProps {
  showLogo?: boolean;
  overlineText?: string;
  headlineText?: string;
  bodyText?: string;
  testimonial?: Testimonial | null;
  showStats?: boolean;
}

export function EditorialPanel({
  showLogo = true,
  overlineText = "TODAY ON BRISTLE",
  headlineText = DEFAULT_HEADLINE,
  bodyText = DEFAULT_BODY,
  testimonial = DEFAULT_TESTIMONIAL,
  showStats = true,
}: EditorialPanelProps): ReactNode {
  return (
    <div
      data-theme="dark"
      className="flex h-full flex-col justify-between gap-loose bg-surface-canvas p-loose text-text-primary"
    >
      {/* Brand lockup — rotated-square diamond + serif wordmark (matches top-nav). */}
      {showLogo ? (
        <div className="flex items-center gap-snug">
          <span
            className="size-3 rotate-45 bg-accent-bristle"
            aria-hidden="true"
          />
          <span className="font-serif text-h4 font-semibold text-text-primary">
            Bristle
          </span>
        </div>
      ) : (
        <span aria-hidden="true" />
      )}

      <div className="flex flex-col gap-grid">
        <p className="font-sans text-body-sm font-semibold uppercase tracking-wide text-accent-bristle">
          {overlineText}
        </p>
        <h2 className="font-serif text-display-lg font-semibold text-text-primary">
          {headlineText}
        </h2>
        <p className="text-body-lg text-text-secondary">{bodyText}</p>

        {testimonial ? (
          <figure className="flex flex-col gap-snug border-t border-border-default pt-grid">
            <blockquote className="font-serif text-body-lg italic text-text-primary">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-snug">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-pill bg-accent-bristle font-sans text-body-sm font-semibold text-text-primary"
              >
                {testimonial.authorInitials}
              </span>
              <span className="flex flex-col">
                <span className="text-body-sm font-medium text-text-primary">
                  {testimonial.authorName}
                </span>
                <span className="text-body-sm text-text-secondary">
                  {testimonial.authorMeta}
                </span>
              </span>
            </figcaption>
          </figure>
        ) : null}
      </div>

      {showStats ? <BrandFooterStats /> : <span aria-hidden="true" />}
    </div>
  );
}
