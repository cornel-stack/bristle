import Link from "next/link";
import { Check } from "lucide-react";

import type { BillingMode } from "./billing-toggle";
import type { Tier } from "./tier-data";

export interface TierCardProps {
  tier: Tier;
  billingMode: BillingMode;
}

export function TierCard({ tier, billingMode }: TierCardProps) {
  const displayedMonthly =
    billingMode === "annual"
      ? Math.round(tier.monthlyPriceUsd * 0.7)
      : tier.monthlyPriceUsd;

  const ctaClass =
    tier.ctaVariant === "primary"
      ? "inline-flex items-center justify-center rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      : "inline-flex items-center justify-center rounded-button border border-text-primary px-grid py-2 text-body-md font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

  return (
    <article
      className={
        tier.isMostPopular
          ? "relative flex flex-col gap-grid rounded-card border-2 border-accent-bristle bg-surface-card p-card"
          : "relative flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card"
      }
    >
      {tier.isMostPopular ? (
        <span className="absolute -top-3 right-card rounded-pill bg-accent-bristle px-snug py-1 text-body-sm font-medium text-surface-card">
          Most popular
        </span>
      ) : null}

      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        {tier.eyebrow}
      </p>

      <div>
        <div className="flex items-baseline gap-tight">
          <span className="font-serif text-display-lg text-text-primary">
            ${displayedMonthly}
          </span>
          <span className="text-body-md text-text-secondary">/month</span>
        </div>
        {billingMode === "annual" ? (
          <p className="mt-tight text-body-sm text-text-secondary">billed annually</p>
        ) : null}
      </div>

      <p className="text-body-md text-text-secondary">{tier.tagline}</p>

      <Link href={tier.ctaHref} className={ctaClass}>
        {tier.ctaLabel}
      </Link>

      <ul className="flex flex-col gap-tight">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-tight text-body-md text-text-primary"
          >
            <Check
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 stroke-[1.5] text-accent-validated"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
