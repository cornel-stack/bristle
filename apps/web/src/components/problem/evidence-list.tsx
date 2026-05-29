// Evidence section composed under the full Stripe report. Wraps the h2
// section heading + 7 EvidenceQuote cards (data-store order; 5 unblurred
// first then 2 blurred — authored that way in sample-problems.ts) + 1
// EvidenceCTA card = 8 card-like elements total (SC-008).
//
// quoteCount is a prop (not hardcoded "47") so a future slice generalizing
// EvidenceList across multiple full problems can pass the per-problem count.
// Today only the Stripe full record renders this — quoteCount === 47.

import type { SampleProblemEvidenceQuote } from "./types";
import { EvidenceQuote } from "./evidence-quote";
import { EvidenceCTA } from "./evidence-cta";

interface EvidenceListProps {
  quotes: ReadonlyArray<SampleProblemEvidenceQuote>;
  quoteCount: number;
}

export function EvidenceList({ quotes, quoteCount }: EvidenceListProps) {
  return (
    <section className="space-y-grid">
      <h2 className="font-serif text-h2 text-text-primary">Evidence ({quoteCount} quotes)</h2>
      <ul className="space-y-grid">
        {quotes.map((quote, i) => (
          <li key={`${quote.authorHandle}-${i}`}>
            <EvidenceQuote quote={quote} />
          </li>
        ))}
      </ul>
      <EvidenceCTA />
    </section>
  );
}
