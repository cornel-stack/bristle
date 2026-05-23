// Policy claims needing founder sign-off (FR-012a):
// - faq-q-2: legal interpretation of Apple Developer Program License Agreement and
//   Google Play Developer Terms re: research use of public review feeds. Founder/legal
//   confirm before merge.
// - faq-q-4: three specific GDPR compliance commitments — (i) "we do not build profiles
//   on EU data subjects", (ii) "we do not sell or share user data with third parties",
//   (iii) "account-linked data deletion requests are honored through support@bristle.dev".
//   Founder/legal sign-off mandatory.
// - faq-q-5: refund window stated as "14 days" — needs founder confirm.
// - faq-q-6: ingest cadence stated as "every 4 to 6 hours" — already in internal docs
//   (CLAUDE.md §3) as the batch cadence, but flagging as a new user-facing claim.
// - faq-q-7: answer states the API returns synthesized text as if the API ships today,
//   but /api is a documented out-of-scope 404 until Tier 5. Founder confirms either
//   (a) the answer ships as-is despite no live API, or (b) reword to acknowledge
//   in-development status.
// - faq-q-8: "no free tier" stance — needs founder confirm.
// - faq-q-9: soft SLA commitment ("we prioritize new categories based on overlap across
//   requests"). Founder confirm.
//
// Exempt (already established elsewhere): six-source list (faq-q-1), 7-day Pro trial
// (faq-q-8), "Cancel any time" (faq-q-3 phrasing).
//
// Mirror the seven bullets above into the PR description under the same heading
// (`Policy claims needing founder sign-off`) before opening the PR. If the list
// above changes during review, update both this header AND the PR section.

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
      "We use Apple's and Google's official review feeds, which permit research use under their developer terms. We ingest only public review text, ratings, and timestamps, never user-identifying account fields.",
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
      "All ingested content is public. We do not build profiles on EU data subjects and we do not sell or share user data with third parties. Account-linked data deletion requests are honored through support@bristle.dev.",
  },
  {
    id: "faq-q-5",
    section: "pricing",
    question: "Do you offer a refund?",
    answer:
      "Yes. Full refund within 14 days of any paid subscription start, no questions asked. Reach out to support@bristle.dev and we process it manually.",
  },
  {
    id: "faq-q-6",
    section: "data-sources",
    question: "How fresh is the data?",
    answer:
      "Our ingestion pipeline runs every 4 to 6 hours. New mentions surface in the next batch, and clusters with momentum update as new evidence arrives across sources.",
  },
  {
    id: "faq-q-7",
    section: "api",
    question: "Does the API include synthesis text?",
    answer:
      "Yes. The API returns the full problem report including the synthesized narrative, evidence quotes, source links, and momentum metrics. The same payload powers the web app.",
  },
  {
    id: "faq-q-8",
    section: "pricing",
    question: "Is there a free tier?",
    answer:
      "Not currently. Starter at $29 per month is the entry plan. The 7-day Pro trial gives you full access if you want to evaluate before paying.",
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
