// Single evidence quote card. blurred=true applies Tailwind blur-sm (4px)
// to the <blockquote> text only — the author/source/upvotes header row
// stays sharp ("you can see text exists but can't read it" signal per
// design intent + plan §9).
//
// A11y: blurred cards carry an <article aria-label="Locked preview — sign
// up to read"> on the wrapping element and aria-hidden=true on the blurred
// blockquote (hides the unreadable text from the SR accessibility tree).
// `select-none` on the blurred blockquote prevents copy-paste extraction
// (small defense, not security).

import type { SampleProblemEvidenceQuote, SampleProblemSourceKey } from "./types";

const SOURCE_LABEL: Record<SampleProblemSourceKey, string> = {
  github: "GitHub",
  hackernews: "Hacker News",
  stackoverflow: "Stack Overflow",
  reddit: "Reddit",
  producthunt: "Product Hunt",
  appstore: "App Store",
  playstore: "Google Play",
};

export function EvidenceQuote({ quote }: { quote: SampleProblemEvidenceQuote }) {
  const sourceLabel = SOURCE_LABEL[quote.source];
  const cardAriaLabel = quote.blurred ? "Locked preview — sign up to read" : undefined;
  return (
    <article
      className="rounded-card border border-border-default bg-surface-card p-grid"
      aria-label={cardAriaLabel}
    >
      <header className="flex flex-wrap items-center gap-snug text-body-sm text-text-secondary">
        <span className="font-medium text-text-primary">{quote.authorHandle}</span>
        <span aria-hidden="true">·</span>
        <span>{sourceLabel}</span>
        <span aria-hidden="true">·</span>
        <span>
          {quote.upvotes} upvotes &middot; {quote.commentCount} comments
        </span>
        <span className="ml-auto">{quote.timestamp}</span>
      </header>
      <blockquote
        className={
          quote.blurred
            ? "mt-grid font-serif text-body-lg italic text-text-primary blur-sm select-none"
            : "mt-grid font-serif text-body-lg italic text-text-primary"
        }
        aria-hidden={quote.blurred ? true : undefined}
      >
        {quote.text}
      </blockquote>
    </article>
  );
}
