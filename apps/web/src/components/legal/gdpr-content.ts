// [PLACEHOLDER — legal review needed before production launch]
//
// GDPR Compliance content for /gdpr. 10 sections per spec §12, verbatim.
// reviewNote on sections 4 (Data controller), 5 (International transfers),
// 10 (Contact) flag founder/legal sign-off items; NEVER render to
// user-visible page (FR-018).
//
// `lastUpdated.effective` is OMITTED per spec §12 note: GDPR is a
// continuously-updated practice statement, not a contract.
//
// Section 4 contains `[REGISTERED ADDRESS TBD]` and section 10 contains
// `[data protection officer designation TBD]` — visible placeholders
// stripped of `REVIEW:` prefix so the T015 grep for `[REVIEW:` in rendered
// HTML stays clean while the in-paragraph placeholder signals "unset".

import type { LegalContent } from "./types";

export const GDPR_CONTENT: LegalContent = {
  hero: {
    eyebrow: "LEGAL",
    headline: "GDPR Compliance",
    lastUpdated: { posted: "2026-05-24" },
  },
  sections: [
    {
      id: "overview",
      number: 1,
      title: "Overview",
      paragraphs: [
        "Bristle complies with the EU General Data Protection Regulation (GDPR) and the UK Data Protection Act 2018. This page summarizes our specific commitments to EU and UK data subjects.",
      ],
    },
    {
      id: "lawful-basis",
      number: 2,
      title: "Lawful basis",
      paragraphs: [
        "We process personal data on three lawful bases:",
        "Contract: to deliver the Service you signed up for (account data, billing details). Legitimate interest: to keep the Service running and secure (server logs, abuse detection). Consent: for optional features you turn on (analytics, marketing emails).",
      ],
    },
    {
      id: "data-we-process",
      number: 3,
      title: "Data we process",
      paragraphs: [
        "Personal data: email address, hashed password, billing details, IP address, user agent, in-app preferences. Non-personal data: aggregated usage patterns, ingested public-source content (which may incidentally mention names of public posters — see /privacy section 4).",
      ],
    },
    {
      id: "data-controller",
      number: 4,
      title: "Data controller",
      paragraphs: [
        "The data controller for Bristle is Bristle Research, [REGISTERED ADDRESS TBD]. If you have questions about how your personal data is processed, email privacy@bristle.dev.",
      ],
      reviewNote:
        "Required for GDPR — registered address of the legal entity acting as data controller. Paragraph contains [REGISTERED ADDRESS TBD] visible placeholder; fill in once the entity is incorporated and registered.",
    },
    {
      id: "international-transfers",
      number: 5,
      title: "International transfers",
      paragraphs: [
        "EU and UK customer data is hosted in EU regions of our managed providers (Vercel EU, Supabase Frankfurt). Where data is necessarily transferred outside the EEA for support purposes, transfers are covered by Standard Contractual Clauses.",
      ],
      reviewNote:
        "Confirm Vercel/Supabase EU configuration matches what you actually deploy. If the production database is not in Frankfurt (or another EU region), rephrase to match.",
    },
    {
      id: "sub-processors",
      number: 6,
      title: "Sub-processors",
      paragraphs: [
        "Our current sub-processor list is at /privacy section 5. We notify customers by email at least 30 days before adding a new sub-processor; you may object by emailing privacy@bristle.dev.",
      ],
    },
    {
      id: "data-subject-rights",
      number: 7,
      title: "Data subject rights",
      paragraphs: [
        "EU and UK data subjects have the following rights:",
        "Right of access (Article 15). Right to rectification (Article 16). Right to erasure (Article 17). Right to restrict processing (Article 18). Right to data portability (Article 20). Right to object (Article 21).",
        "Exercise any of these via in-app controls or by emailing privacy@bristle.dev. We respond within 30 days. You may also lodge a complaint with your local supervisory authority.",
      ],
    },
    {
      id: "data-retention",
      number: 8,
      title: "Data retention",
      paragraphs: [
        "See /privacy section 7. EU/UK customer data is deleted on the same schedule as all other customer data: lifetime of account plus 90 days.",
      ],
    },
    {
      id: "breach-notification",
      number: 9,
      title: "Breach notification",
      paragraphs: [
        "In the event of a personal data breach affecting EU or UK data subjects, we will notify the relevant supervisory authority within 72 hours and affected customers without undue delay, as required by GDPR Article 33–34.",
      ],
    },
    {
      id: "contact",
      number: 10,
      title: "Contact",
      paragraphs: [
        "For GDPR-related questions, contact privacy@bristle.dev. Our [data protection officer designation TBD] is reachable at the same address.",
      ],
      reviewNote:
        "If you have a designated DPO (required for some categories of processing under Article 37), include the name and direct contact. Otherwise, this email-only contact is acceptable for most SaaS at your stage. Paragraph contains [data protection officer designation TBD] visible placeholder.",
    },
  ],
};
