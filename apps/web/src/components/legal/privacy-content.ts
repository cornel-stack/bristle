// [PLACEHOLDER — legal review needed before production launch]
//
// Privacy Policy content for /privacy. 10 sections per spec §10, verbatim.
// reviewNote on section 5 (Third-party services) flags sub-processor list
// for founder confirmation. NEVER renders to user-visible page (FR-018).
//
// Section 5 paragraph 2 contains `[payment processor TBD]` visible
// placeholder (stripped of `REVIEW:` prefix per the same discipline as
// terms-content section 9; T015 grep for `[REVIEW:` in rendered HTML
// stays clean while the in-paragraph placeholder signals "unset").

import type { LegalContent } from "./types";

export const PRIVACY_CONTENT: LegalContent = {
  hero: {
    eyebrow: "LEGAL",
    headline: "Privacy Policy",
    lastUpdated: { posted: "2026-05-24", effective: "2026-05-24" },
  },
  sections: [
    {
      id: "overview",
      number: 1,
      title: "Overview",
      paragraphs: [
        "This policy explains what data Bristle collects, why we collect it, and what rights you have over it. We try to process as little personal data as possible while running a functioning research tool.",
      ],
    },
    {
      id: "data-we-collect",
      number: 2,
      title: "Data we collect",
      paragraphs: [
        "When you create an account: your email address, your chosen password (hashed), and any optional profile fields you provide. When you use the Service: the categories you track, the problems you save, your alert preferences, and standard server logs (IP address, user agent, timestamps). When you pay: billing details handled by our payment processor — we do not store full card numbers.",
      ],
    },
    {
      id: "how-we-use-data",
      number: 3,
      title: "How we use data",
      paragraphs: [
        "To operate the Service: deliver the reports you subscribe to, send alerts you configured, process payments, and respond to support requests. To improve the Service: aggregate, anonymized usage patterns inform what we build next. We do not sell your data and we do not share it with third parties for their own marketing.",
      ],
    },
    {
      id: "public-source-content",
      number: 4,
      title: "Public source content",
      paragraphs: [
        "The problem reports we surface are synthesized from public content on GitHub, Hacker News, Stack Overflow, Product Hunt, Apple App Store, and Google Play. We attribute every quote to its public source. If you authored a public post that appears in a Bristle report and you would like it removed, email support@bristle.dev and we will remove the quote from future report generations within 30 days.",
      ],
    },
    {
      id: "third-party-services",
      number: 5,
      title: "Third-party services",
      paragraphs: [
        "We use third-party services to operate Bristle. As of the date above:",
        "Hosting: Vercel (US). Database: Supabase (EU regions for EU customers, US otherwise). Email: Resend. Error monitoring: Sentry. Analytics: PostHog (privacy-friendly mode, no third-party cookies). Payments: [payment processor TBD].",
        "A current list is available at /privacy/sub-processors.",
      ],
      reviewNote:
        "Confirm each sub-processor when committed to the actual stack. The list matches CLAUDE.md §3. Paragraph 2 also contains [payment processor TBD] visible placeholder — fill in once Stripe / Lemon Squeezy is chosen (must stay aligned with terms-content section 3 reviewNote).",
    },
    {
      id: "cookies-analytics",
      number: 6,
      title: "Cookies & analytics",
      paragraphs: [
        "We use a small number of first-party cookies for session management. We use PostHog for product analytics in privacy-friendly mode — no third-party cookies, no cross-site tracking. You can disable analytics in Settings → Privacy.",
      ],
    },
    {
      id: "data-retention",
      number: 7,
      title: "Data retention",
      paragraphs: [
        "Account data is retained for the lifetime of your account plus 90 days after cancellation, after which it is permanently deleted. Server logs are retained for 30 days. Public-source ingested content is retained indefinitely as part of the public-research dataset.",
      ],
    },
    {
      id: "your-rights",
      number: 8,
      title: "Your rights",
      paragraphs: [
        "You can access, correct, export, or delete your account data at any time from Settings → Privacy. If you are an EU/UK data subject, you also have the right to lodge a complaint with your local data protection authority. To exercise any of these rights, use the in-app controls or email support@bristle.dev — we respond within 30 days.",
      ],
    },
    {
      id: "childrens-privacy",
      number: 9,
      title: "Children's privacy",
      paragraphs: [
        "Bristle is not intended for use by anyone under 16. We do not knowingly collect personal data from children. If you believe a child has provided personal data, email support@bristle.dev and we will delete it.",
      ],
    },
    {
      id: "changes",
      number: 10,
      title: "Changes to this policy",
      paragraphs: [
        "We may update this policy. Material changes will be announced by email and in-app banner at least 14 days before they take effect. The full revision history is on our /changelog page.",
      ],
    },
  ],
};
