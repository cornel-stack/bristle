export type TierName = "Starter" | "Pro" | "Team";
export type TierCtaVariant = "primary" | "outline";

export interface Tier {
  name: TierName;
  eyebrow: string;
  monthlyPriceUsd: number;
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: TierCtaVariant;
  isMostPopular: boolean;
  features: readonly string[];
}

export const TIERS: readonly Tier[] = [
  {
    name: "Starter",
    eyebrow: "STARTER",
    monthlyPriceUsd: 29,
    tagline: "For solo builders just starting to track.",
    ctaLabel: "Choose Starter",
    ctaHref: "/signup",
    ctaVariant: "outline",
    isMostPopular: false,
    features: [
      "5 tracked categories",
      "50 saved problems",
      "Daily email alerts",
      "Community support",
    ],
  },
  {
    name: "Pro",
    eyebrow: "PRO",
    monthlyPriceUsd: 79,
    tagline: "For builders shipping against real evidence.",
    ctaLabel: "Start Pro trial",
    ctaHref: "/signup",
    ctaVariant: "primary",
    isMostPopular: true,
    features: [
      "Unlimited tracked categories",
      "Unlimited saved problems",
      "Email, in-app, and API alerts",
      "Comparison view up to 4",
      "50k API requests per month",
      "Priority email support",
    ],
  },
  {
    name: "Team",
    eyebrow: "TEAM",
    monthlyPriceUsd: 199,
    tagline: "For agencies and innovation teams.",
    ctaLabel: "Choose Team",
    ctaHref: "/signup",
    ctaVariant: "outline",
    isMostPopular: false,
    features: [
      "Everything in Pro",
      "5 team seats included",
      "Shared collections",
      "SSO",
      "200k API requests per month",
      "Dedicated CSM",
    ],
  },
] as const;
