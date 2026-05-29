// Page-local near-duplicate of slice-010 InlinePullQuote (per plan §5 +
// Assumption #5). Same JSX shape, same tokens, same prop signature shape —
// the only difference is the imported type name (SampleProblemPullQuote
// vs BlogPullQuote). The duplication is intentional to preserve the
// slice-integrity discipline (zero packages/ touches this slice; no
// cross-page imports under apps/web/src/components/).
//
// Tracked follow-up (plan §13): when a third consumer appears, batch the
// extraction to packages/ui/.

import type { SampleProblemPullQuote } from "./types";

export function ProblemPullQuote({ quote }: { quote: SampleProblemPullQuote }) {
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
