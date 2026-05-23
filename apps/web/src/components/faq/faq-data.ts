// Policy claims resolved (FR-012a — founder sign-off 2026-05-23):
// - faq-q-2: App Store / Google Play review-feed legal interpretation — RESOLVED via
//   founder edit (replaced specific developer-terms reference with "publicly available
//   review feeds from each store").
// - faq-q-4: GDPR compliance commitments — RESOLVED via founder edit (deferred specifics
//   to the /privacy page; current copy is "Full GDPR details are on our Privacy page").
// - faq-q-5: refund policy — RESOLVED via founder edit (no automatic refund window;
//   case-by-case via support email).
// - faq-q-6: ingest cadence — RESOLVED via founder edit ("regularly throughout the day"
//   replaces the previous "every 4 to 6 hours" specific claim).
// - faq-q-7: API synthesis claim — RESOLVED via founder edit (acknowledges roadmap:
//   "the API endpoint launches in our next release").
// - faq-q-8: "no free tier" stance — RESOLVED ship-as-stated (slice 007 will swap
//   "$29" → "$19" in the answer at the price recalibration).
// - faq-q-9: soft SLA on category requests — RESOLVED ship-as-stated.
//
// Exempt (already established elsewhere): six-source list (faq-q-1), 7-day Pro trial
// (faq-q-8), "Cancel any time" (faq-q-3 phrasing).
//
// Resolved = "founder has approved the current wording" — the underlying answers still
// touch policy and any future copy edit must re-trigger this gate. Audit trail mirrored
// in the PR #5 description under "Policy claims — resolved".

export type FaqSection =
  | "pricing"
  | "data-sources"
  | "privacy"
  | "cancellation"
  | "api";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  section: FaqSection;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "faq-q-1",
    section: "data-sources",
    question: "Where does Bristle get its data?",
    answer:
      "We ingest from six public sources via official APIs and approved scrapers: GitHub Issues, Hacker News, Stack Overflow, Product Hunt, Apple App Store, and Google Play. We never use private channels or content behind authentication walls.",
  },
  {
    id: "faq-q-2",
    section: "data-sources",
    question: "Is reading App Store reviews legal?",
    answer:
      "We use the publicly available review feeds from each store. We ingest only public review text, ratings, and timestamps, never user-identifying account fields.",
  },
  {
    id: "faq-q-3",
    section: "cancellation",
    question: "Can I cancel any time?",
    answer:
      "Yes. You can cancel from the billing page at any time. Access continues through the end of your current billing period and no further charges are made.",
  },
  {
    id: "faq-q-4",
    section: "privacy",
    question: "What about GDPR?",
    answer:
      "We process only public content and the email you sign up with. Full GDPR details are on our Privacy page.",
  },
  {
    id: "faq-q-5",
    section: "pricing",
    question: "Do you offer a refund?",
    answer:
      "No automatic refund policy — case-by-case. Email support@bristle.dev with the details and we'll look at it.",
  },
  {
    id: "faq-q-6",
    section: "data-sources",
    question: "How fresh is the data?",
    answer:
      "We re-ingest from each source regularly throughout the day. New mentions surface in the next pass; clusters with momentum update as new evidence arrives across sources.",
  },
  {
    id: "faq-q-7",
    section: "api",
    question: "Does the API include synthesis text?",
    answer:
      "Yes — and the API endpoint launches in our next release. The API will return the full problem report including the synthesized narrative, evidence quotes, source links, and momentum metrics.",
  },
  {
    id: "faq-q-8",
    section: "pricing",
    question: "Is there a free tier?",
    answer:
      "Not currently. Starter at $19 per month is the entry plan. The 7-day Pro trial gives you full access if you want to evaluate before paying.",
  },
  {
    id: "faq-q-9",
    section: "api",
    question: "Can I request a new category?",
    answer:
      "Yes. Send a request to support@bristle.dev with the category name and a few example problems you would expect to see in it. We prioritize new categories based on overlap across requests.",
  },
  {
    id: "faq-q-10",
    section: "data-sources",
    question: "How do you cluster duplicates?",
    answer:
      "Each mention is embedded into a vector space and joined to existing clusters via semantic nearest-neighbor matching on top of a relevance filter. Two mentions that describe the same underlying problem in different words end up in the same cluster.",
  },
  {
    id: "faq-q-11",
    section: "privacy",
    question: "Will I see clusters from my own GitHub issues?",
    answer:
      "Possibly. Bristle ingests public GitHub Issues across the ecosystem; if your repository's issues are public and overlap with an existing problem cluster, they appear there alongside mentions from other sources.",
  },
  {
    id: "faq-q-12",
    section: "api",
    question: "Can I export data?",
    answer:
      "Yes. Starter plans include CSV export of problem reports. Pro and Team plans add JSON exports via the API. Additional formats are tracked on our roadmap.",
  },
] as const;
