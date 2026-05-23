import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";
import { PricingBillingSection } from "@/components/pricing/billing-section";
import { CompareTable } from "@/components/pricing/compare-table";
import { EnterpriseCard } from "@/components/pricing/enterprise-card";
import { PricingHero } from "@/components/pricing/hero";

const TITLE = "Pricing — Bristle";
const DESCRIPTION =
  "Three plans for finding real problems worth solving. Cancel any time, annual saves 30%.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/pricing",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Pricing() {
  return (
    <>
      <TopNav />
      <main>
        <PricingHero />
        <PricingBillingSection />
        <CompareTable />
        <EnterpriseCard />
      </main>
      <SiteFooter />
    </>
  );
}
