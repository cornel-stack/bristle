import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { AboutBody } from "@/components/about/body";
import { FounderCard } from "@/components/about/founder-card";
import { AboutHero } from "@/components/about/hero";
import { NewsletterStub } from "@/components/about/newsletter-stub";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

const TITLE = "About — Bristle";
const DESCRIPTION =
  "Bristle is multi-source problem discovery for builders. Made with evidence, not vibes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/about",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function About() {
  return (
    <>
      <TopNav />
      <main>
        <AboutHero />
        <AboutBody />
        <FounderCard />
        <NewsletterStub />
      </main>
      <SiteFooter />
    </>
  );
}
