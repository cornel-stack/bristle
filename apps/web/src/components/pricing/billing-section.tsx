"use client";

import { useState } from "react";

import { PricingBillingToggle, type BillingMode } from "./billing-toggle";
import { TierCard } from "./tier-card";
import { TIERS } from "./tier-data";

export function PricingBillingSection() {
  const [mode, setMode] = useState<BillingMode>("monthly");
  return (
    <section className="mx-auto max-w-6xl px-grid pb-section">
      <div className="flex justify-center">
        <PricingBillingToggle value={mode} onChange={setMode} />
      </div>
      <div className="mt-loose grid gap-grid md:grid-cols-3 md:gap-card">
        {TIERS.map((tier) => (
          <TierCard key={tier.name} tier={tier} billingMode={mode} />
        ))}
      </div>
    </section>
  );
}
