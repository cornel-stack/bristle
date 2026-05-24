import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { LegalLayout } from "@/components/legal/legal-layout";
import { GDPR_CONTENT } from "@/components/legal/gdpr-content";

const TITLE = "GDPR Compliance — Bristle";
const DESCRIPTION =
  "Bristle's specific commitments to EU and UK data subjects under GDPR.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/gdpr",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Gdpr() {
  return <LegalLayout content={GDPR_CONTENT} />;
}
