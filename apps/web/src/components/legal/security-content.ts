// [PLACEHOLDER — legal review needed before production launch]
//
// Security page content for /security. 10 sections per spec §11, verbatim.
// reviewNote on sections 8 (Vulnerability disclosure) and 9 (Compliance)
// flag founder/operational decisions; NEVER render to user-visible page
// (FR-018).
//
// `lastUpdated.effective` is OMITTED per spec §11 note: security is a
// continuously-updated practice statement, not a contract — no effective
// date semantically applies. LegalHero conditionally renders the caption
// as "Last updated · {posted}" when `effective` is undefined.

import type { LegalContent } from "./types";

export const SECURITY_CONTENT: LegalContent = {
  hero: {
    eyebrow: "LEGAL",
    headline: "Security",
    lastUpdated: { posted: "2026-05-24" },
  },
  sections: [
    {
      id: "overview",
      number: 1,
      title: "Overview",
      paragraphs: [
        "Bristle is built on managed cloud infrastructure with security defaults that we have not loosened. This page describes the controls in place today and how to report problems.",
      ],
    },
    {
      id: "infrastructure",
      number: 2,
      title: "Infrastructure",
      paragraphs: [
        "Bristle runs on Vercel (application) and Supabase (database). Both are SOC 2 Type II audited providers. Production secrets are stored in Vercel's encrypted environment variables, scoped per environment.",
      ],
    },
    {
      id: "access-controls",
      number: 3,
      title: "Access controls",
      paragraphs: [
        "Production access is limited to the founding team. All admin access requires SSO with a hardware security key. We do not maintain shared admin credentials and we do not share customer data with anyone outside the founding team without your explicit consent.",
      ],
    },
    {
      id: "data-encryption",
      number: 4,
      title: "Data encryption",
      paragraphs: [
        "All traffic to and from Bristle is encrypted in transit via TLS 1.2+. Data at rest is encrypted by our database provider using AES-256. Passwords are hashed with bcrypt; we never store plaintext passwords.",
      ],
    },
    {
      id: "backups-dr",
      number: 5,
      title: "Backups & disaster recovery",
      paragraphs: [
        "Database backups run continuously via point-in-time recovery on our managed database, with a recovery point objective of under 5 minutes. We test backup restoration quarterly.",
      ],
    },
    {
      id: "incident-response",
      number: 6,
      title: "Incident response",
      paragraphs: [
        "If we detect a security incident affecting customer data, we will notify affected customers by email within 72 hours of confirmation. Status updates during ongoing incidents are posted at /status.",
      ],
    },
    {
      id: "vendor-security",
      number: 7,
      title: "Vendor security",
      paragraphs: [
        "Every third-party service we use is reviewed before integration. Current sub-processors are listed on our Privacy page. We require all vendors to maintain encryption-at-rest, access logging, and breach notification commitments equivalent to ours.",
      ],
    },
    {
      id: "vulnerability-disclosure",
      number: 8,
      title: "Vulnerability disclosure",
      paragraphs: [
        "If you believe you have found a security vulnerability in Bristle, email security@bristle.dev with details. We respond within 48 hours. We do not pursue legal action against researchers who report issues in good faith and follow responsible disclosure.",
      ],
      reviewNote:
        "Confirm security@bristle.dev is monitored or change to whichever inbox catches security reports.",
    },
    {
      id: "compliance",
      number: 9,
      title: "Compliance",
      paragraphs: [
        "Bristle is not currently certified to any formal security standard. We follow the principles of SOC 2 in our operational practices and intend to pursue formal certification before serving regulated industries at scale.",
      ],
      reviewNote: "Adjust as your compliance posture matures.",
    },
    {
      id: "contact",
      number: 10,
      title: "Contact",
      paragraphs: [
        "For security questions, contact security@bristle.dev. For general questions, see our Contact page.",
      ],
    },
  ],
};
