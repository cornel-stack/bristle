import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { LegalLayout } from "@/components/legal/legal-layout";
import { TERMS_CONTENT } from "@/components/legal/terms-content";

const TITLE = "Terms of Service — Bristle";
const DESCRIPTION =
  "The terms that govern your use of Bristle, including account, billing, cancellation, and liability.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/terms",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Terms() {
  return <LegalLayout content={TERMS_CONTENT} />;
}
