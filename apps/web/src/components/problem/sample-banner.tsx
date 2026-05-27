// Orange "you're viewing a free sample" strip rendered ABOVE TopNav at the
// route's JSX root. This component is intentionally stand-alone — it knows
// nothing about TopNav or the page shell; the composition discipline (sit
// above TopNav, not inside or below it) lives in ProblemLayout. See
// quickstart.md for the architectural precedent.
//
// Tokens-only: bg-accent-bristle + text-surface-card mirrors the slice-009
// TocRail mobile-pill active-state recipe (no `text-on-accent` token in
// globals.css — slice-011 finding).

import Link from "next/link";

export function SampleBanner() {
  return (
    <aside aria-label="Free sample notice" className="bg-accent-bristle text-surface-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-grid px-grid py-snug">
        <p className="text-body-sm">
          You&rsquo;re viewing a free sample &mdash; see the full library of 142k+ problems.
        </p>
        <Link
          href="/signup"
          className="rounded-button bg-surface-card px-snug py-1 text-body-sm font-medium text-accent-bristle"
        >
          Start free &rarr;
        </Link>
      </div>
    </aside>
  );
}
