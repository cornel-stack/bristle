import type { Metadata } from "next";

import { SITE_URL } from "@bristle/shared";

import { CHANGELOG_ENTRIES } from "@/components/changelog/changelog-entries";
import { ChangelogLayout } from "@/components/changelog/changelog-layout";

const TITLE = "Changelog — Bristle";
const DESCRIPTION =
  "Public, dated, attributable changelog for Bristle. The shape of our pace.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/changelog`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  alternates: {
    types: {
      "application/atom+xml": [
        { url: `${SITE_URL}/changelog.atom`, title: "Bristle changelog feed" },
      ],
    },
  },
};

export default async function ChangelogIndex() {
  return <ChangelogLayout entries={CHANGELOG_ENTRIES} />;
}
