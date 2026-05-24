import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { ContactForm } from "@/components/contact/contact-form";
import { ContactHero } from "@/components/contact/hero";
import { ContactPaths } from "@/components/contact/paths";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

const TITLE = "Contact — Bristle";
const DESCRIPTION =
  "Email, enterprise sales, or send us a message. One inbox, one business day.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/contact",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Contact() {
  return (
    <>
      <TopNav />
      <main className="mx-auto grid max-w-6xl gap-section px-grid py-section md:grid-cols-2">
        <div>
          <ContactHero />
          <ContactPaths />
        </div>
        <ContactForm />
      </main>
      <SiteFooter />
    </>
  );
}
