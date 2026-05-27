import { SITE_URL } from "@bristle/shared";

import { buildAtomFeed } from "@/components/changelog/atom-xml";
import { CHANGELOG_ENTRIES } from "@/components/changelog/changelog-entries";

// Force build-time static prerender. The feed is purely compile-time data —
// no DB, no per-request state. If Next.js's Route Handler classifier falls
// back to ƒ Dynamic despite this directive, the Cache-Control header below
// ensures edge caching covers freshness (1-hour s-maxage).
export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const body = buildAtomFeed(CHANGELOG_ENTRIES, SITE_URL);
  return new Response(body, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
