// [PLACEHOLDER — legal review needed before production launch]
//
// Terms of Service content for /terms. 10 sections per spec §9, verbatim.
// reviewNote fields on sections 1, 3, 6, 9 surface founder/legal sign-off
// items in the PR description's pre-launch checklist; they NEVER render to
// the user-visible page (FR-018 — LegalSection reads only `paragraphs`).
//
// In-paragraph placeholders use `[VALUE TBD]` (not `[REVIEW: VALUE TBD]`) so
// the T015 grep for `[REVIEW:` in rendered HTML stays clean while the
// visible placeholder still signals "value unset" to a reader of the live
// page. Section 6 is refund-policy-aligned with FAQ q-5 per FR-015.

import type { LegalContent } from "./types";

export const TERMS_CONTENT: LegalContent = {
  hero: {
    eyebrow: "LEGAL",
    headline: "Terms of Service",
    lastUpdated: { posted: "2026-05-24", effective: "2026-05-24" },
  },
  sections: [
    {
      id: "overview",
      number: 1,
      title: "Overview",
      paragraphs: [
        "These terms govern your use of Bristle ('the Service'), operated by Bristle Research ('we', 'us'). By creating an account or using any part of the Service, you agree to these terms. If you are using the Service on behalf of an organization, you accept these terms on that organization's behalf.",
      ],
      reviewNote:
        "Legal entity name. Currently 'Bristle Research' — change to the registered legal entity (e.g. 'Bristle Research, Inc.' or 'Bristle Research Ltd.') once incorporated.",
    },
    {
      id: "account-terms",
      number: 2,
      title: "Account terms",
      paragraphs: [
        "You must be 16 years or older to create an account. You are responsible for keeping your credentials secret and for all activity on your account. You may not share your account credentials with anyone outside your team.",
      ],
    },
    {
      id: "subscriptions-billing",
      number: 3,
      title: "Subscriptions & billing",
      paragraphs: [
        "Paid plans are billed monthly or annually in advance via our payment processor. Annual subscriptions are non-refundable except as required by law. Monthly subscriptions can be cancelled at any time; cancellations take effect at the end of the current billing cycle.",
        "We may change prices on notice of at least 30 days. Continued use of the Service after a price change constitutes acceptance.",
      ],
      reviewNote:
        "Payment processor — currently unnamed in paragraph 1. Add 'Stripe' or 'Lemon Squeezy' once chosen.",
    },
    {
      id: "data-sources-licensing",
      number: 4,
      title: "Data sources & licensing",
      paragraphs: [
        "Bristle ingests content from publicly accessible APIs and endpoints operated by third parties including GitHub, Y Combinator (Hacker News), Stack Exchange, Product Hunt, Apple Inc., and Google LLC. We attribute and link to original sources for every quote we surface. Bristle does not claim ownership of source content; the synthesized analysis is licensed to you under your subscription.",
        "You may not redistribute the synthesized reports as a stand-alone product. You may quote individual reports in your own work with attribution.",
      ],
    },
    {
      id: "acceptable-use",
      number: 5,
      title: "Acceptable use",
      paragraphs: [
        "You may not use the Service to scrape, mirror, or otherwise systematically copy our content; to attempt to access another customer's account or data; to upload malicious code via our integrations endpoints; or to circumvent rate limits on the API. Violation may result in immediate suspension.",
      ],
    },
    {
      id: "cancellation-refunds",
      number: 6,
      title: "Cancellation & refunds",
      paragraphs: [
        "You may cancel at any time from Settings → Billing. Cancellation stops future billing; access continues through the end of the current billing period.",
        "Refunds are handled case-by-case. Email support@bristle.dev with the details and we will review your request individually.",
      ],
      reviewNote:
        "Refund policy rewritten from the PDF's '14-day refund window' to match the shipped FAQ q-5 ('No automatic refund policy — case-by-case'). If you prefer a stated refund window, change BOTH this section AND apps/web/src/components/faq/faq-data.ts q-5 together — they must stay aligned (FR-015 permanent cross-slice constraint).",
    },
    {
      id: "termination",
      number: 7,
      title: "Termination",
      paragraphs: [
        "We may terminate or suspend access for breach of these terms, fraud, or abusive behavior toward our team. We will provide at least 14 days' notice except where the breach is material or fraudulent.",
      ],
    },
    {
      id: "limitation-of-liability",
      number: 8,
      title: "Limitation of liability",
      paragraphs: [
        "The Service is provided 'as is' and we make no warranty regarding the accuracy, completeness, or fitness-for-purpose of synthesized reports. Our aggregate liability is limited to the fees paid in the trailing 12 months. Nothing here limits liability that cannot be limited by law.",
      ],
    },
    {
      id: "governing-law",
      number: 9,
      title: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of [JURISDICTION TBD], without regard to conflict-of-laws rules. Disputes will be resolved in the state and federal courts located in [VENUE TBD].",
      ],
      reviewNote:
        "Jurisdiction and venue. Paragraph contains [JURISDICTION TBD] and [VENUE TBD] visible placeholders. Default to your country/state of incorporation once the entity is formed.",
    },
    {
      id: "changes",
      number: 10,
      title: "Changes to these terms",
      paragraphs: [
        "We may update these terms occasionally. We will email you and post a banner in the app at least 14 days before material changes take effect. Your continued use after the effective date constitutes acceptance.",
      ],
    },
  ],
};
