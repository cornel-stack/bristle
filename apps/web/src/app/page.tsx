import type { Metadata } from "next";
import { getProblemBySlug, getRecentProblems } from "@bristle/db";
import { SITE_URL } from "@bristle/shared";
import { TopNav } from "@/components/landing/top-nav";
import { Hero } from "@/components/landing/hero";
import { SourceStrip } from "@/components/landing/source-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SampleReports } from "@/components/landing/sample-reports";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { SiteFooter } from "@/components/landing/site-footer";

const HERO_SLUG = "stripe-webhooks-vercel-cold-starts";
const DESCRIPTION =
  "Bristle finds real problems worth solving — evidence-backed problem reports from GitHub, Hacker News, Stack Overflow, Product Hunt, and the App Stores, ranked by frequency, momentum, and willingness-to-pay.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bristle — Find real problems worth solving",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    title: "Bristle — Find real problems worth solving",
    description: DESCRIPTION,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
};

// Read at request time, not build time — the DB queries aren't cacheable fetches,
// so mark the route dynamic (plan §D8); otherwise `next build` prerenders and
// fails connecting to the database.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [hero, recent] = await Promise.all([
    getProblemBySlug(HERO_SLUG),
    getRecentProblems({ limit: 3, excludeSlug: HERO_SLUG }),
  ]);

  return (
    <>
      <TopNav />
      <Hero problem={hero} />
      <SourceStrip />
      <HowItWorks />
      <SampleReports problems={recent} />
      <PricingTeaser />
      <SiteFooter />
    </>
  );
}
