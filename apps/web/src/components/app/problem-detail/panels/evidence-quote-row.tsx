import { SourceIcon } from "@bristle/ui";

import type { EvidenceVM } from "@/lib/problem-detail-adapter";

// One evidence quote — WRAP (not the public EvidenceQuote, which has no `forum`
// source, no WTP chip, and hardwires upvotes/comments). Renders the DB shape:
// handle · source icon · engagement (value+label) OR app-store rating · a WTP
// chip when flagged · relative time · the quote.
function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, rating));
  return (
    <span aria-label={`${clamped} out of 5 stars`}>
      <span aria-hidden="true">{"★".repeat(clamped)}{"☆".repeat(5 - clamped)}</span>
    </span>
  );
}

export function EvidenceQuoteRow({ quote }: { quote: EvidenceVM }) {
  return (
    <article className="rounded-card border border-border-default bg-surface-card p-grid">
      <header className="flex flex-wrap items-center gap-2 text-body-sm text-text-secondary">
        <SourceIcon source={quote.icon} className="size-4 text-text-secondary" />
        <span className="font-mono text-text-primary">{quote.handle}</span>
        <span aria-hidden="true">·</span>
        {quote.rating != null ? (
          <Stars rating={quote.rating} />
        ) : quote.engagement ? (
          <span>{quote.engagement}</span>
        ) : null}
        {quote.isWtp ? (
          <span className="rounded-pill bg-surface-raised px-2 py-0.5 text-body-sm font-medium text-accent-validated">
            {quote.statedPrice != null ? `$${quote.statedPrice}/mo signal` : "WTP signal"}
          </span>
        ) : null}
        <span className="ml-auto">{quote.relativeTime}</span>
      </header>
      <blockquote className="mt-grid font-serif text-body-lg italic text-text-primary">
        {quote.text}
      </blockquote>
    </article>
  );
}
