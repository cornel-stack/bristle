// [PLACEHOLDER — review DNS/email setup before production launch]
//
// The addresses `support@bristle.dev` and `sales@bristle.dev` below are authored
// to the bristle.dev domain. Before production launch, the founder must:
//   1. Verify the bristle.dev domain in Resend (SPF + DKIM records).
//   2. Confirm support@ and sales@ receive mail (real MX or forwarding setup).
//   3. Confirm the addressing scheme matches the Resend-verified sender domain
//      configured in CONTACT_FORM_FROM env var.
// Slice 008 ships with these as the documented intent; founder confirms before
// the Tier-2 v0.2.0 tag.

export interface ContactPath {
  label: string;
  subtitle: string;
  iconName: "LifeBuoy" | "Mail" | "Zap";
  href: string;
}

export const CONTACT_PATHS: readonly ContactPath[] = [
  {
    label: "Help center",
    subtitle: "Read documentation and how-tos.",
    iconName: "LifeBuoy",
    href: "/faq",
  },
  {
    label: "Email support",
    subtitle: "support@bristle.dev · for paying customers.",
    iconName: "Mail",
    href: "mailto:support@bristle.dev",
  },
  {
    label: "Enterprise sales",
    subtitle: "sales@bristle.dev · custom invoicing, SSO, on-prem ingestion.",
    iconName: "Zap",
    href: "mailto:sales@bristle.dev",
  },
] as const;
