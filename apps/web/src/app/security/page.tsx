import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

import { LegalLayout } from "@/components/legal/legal-layout";
import { SECURITY_CONTENT } from "@/components/legal/security-content";

const TITLE = "Security — Bristle";
const DESCRIPTION =
  "How Bristle protects customer data and how to report security issues.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/security",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Security() {
  return <LegalLayout content={SECURITY_CONTENT} />;
}
