import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { FaqBottomCta } from "@/components/faq/bottom-cta";
import { FaqBody } from "@/components/faq/faq-body";
import { FaqHero } from "@/components/faq/hero";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

const TITLE = "FAQ — Bristle";
const DESCRIPTION =
  "Answers to the most common questions about Bristle's data sources, pricing, privacy, and API.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/faq",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Faq() {
  return (
    <>
      <TopNav />
      <main>
        <FaqHero />
        <FaqBody />
        <FaqBottomCta />
      </main>
      <SiteFooter />
    </>
  );
}
