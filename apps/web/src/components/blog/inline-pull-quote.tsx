// Inline pull-quote rendered inside an article section's prose. Serif
// <blockquote> with a left accent bar; attribution renders as <cite> below,
// suppressed when the attribution string is empty. Tokens-only.

import type { BlogPullQuote } from "./types";

export function InlinePullQuote({ quote }: { quote: BlogPullQuote }) {
  return (
    <figure className="my-loose">
      <blockquote className="border-l-2 border-accent-bristle pl-grid font-serif italic text-h3 text-text-primary">
        {quote.text}
      </blockquote>
      {quote.attribution && (
        <cite className="mt-snug block pl-grid text-body-sm not-italic text-text-secondary">
          {quote.attribution}
        </cite>
      )}
    </figure>
  );
}
