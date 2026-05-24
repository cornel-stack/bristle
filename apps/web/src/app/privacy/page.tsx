import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { LegalLayout } from "@/components/legal/legal-layout";
import { PRIVACY_CONTENT } from "@/components/legal/privacy-content";

const TITLE = "Privacy Policy — Bristle";
const DESCRIPTION =
  "What data Bristle collects, why we collect it, and the rights you have over it.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/privacy",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Privacy() {
  return <LegalLayout content={PRIVACY_CONTENT} />;
}
