// [PLACEHOLDER — changelog entries awaiting founder review before production launch]
//
// 13 entries across 5 months, in reverse-chronological source order
// (most-recent first). The "Current" pill on the rendered page lands on
// whichever month contains max(entry.date) — May 2026 in the current data
// (May 8 is the most-recent entry).
//
// NOTE: the spec brief framed this as "11 entries" but the verbatim
// enumeration sums to 13 (3+3+3+2+2). Shipping the 13 entries as
// enumerated; the count statement in spec FR-019 / SC-029 + tasks T002
// should be updated to 13. Flagged in the STOP-1 implementation report
// for founder review.

import type { ChangelogEntry } from "./types";

export const CHANGELOG_ENTRIES: ReadonlyArray<ChangelogEntry> = [
  // ─────────────────────────────────────────────────────────────────────────
  // MAY 2026 (3 entries) — May 8 is max(date) → "Current" pill lands here
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "compare-view-supports-four-problems",
    date: "2026-05-08",
    displayDay: "MAY 8",
    monthKey: "may-2026",
    monthLabel: "May 2026",
    title: "Compare view now supports up to four problems",
    type: "feature",
    body: "You asked. We over-engineered. The comparison grid now aligns six rows of metrics across four columns with a sticky header. Available on Pro and Team.",
    figure: { caption: "compare view" },
  },
  {
    slug: "slack-delivery-for-alerts",
    date: "2026-05-03",
    displayDay: "MAY 3",
    monthKey: "may-2026",
    monthLabel: "May 2026",
    title: "Slack delivery for alerts",
    type: "feature",
    body: "Connect Slack from Settings → Integrations and your alerts can post into any channel with full report links and momentum.",
  },
  {
    slug: "smaller-faster-dashboard",
    date: "2026-05-01",
    displayDay: "MAY 1",
    monthKey: "may-2026",
    monthLabel: "May 2026",
    title: "Smaller, faster dashboard",
    type: "improvement",
    body: "Initial JS bundle dropped from 264KB to 178KB gzipped. Dashboard LCP is now 1.4s on mid-range mobile over 4G.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // APRIL 2026 (3 entries)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "daily-digest-yesterday-comparison",
    date: "2026-04-22",
    displayDay: "APR 22",
    monthKey: "april-2026",
    monthLabel: "April 2026",
    title: 'Daily digest now includes a "yesterday" comparison',
    type: "feature",
    body: "Every digest leads with what changed since the last one. The same problems lower in the list get the rest of the column.",
  },
  {
    slug: "fix-command-palette-firefox-138",
    date: "2026-04-14",
    displayDay: "APR 14",
    monthKey: "april-2026",
    monthLabel: "April 2026",
    title: "Fixed: command palette failing on Firefox 138",
    type: "fix",
    body: "A focus-trap regression hid the results panel for Firefox users on the new Compositor pipeline. Sorry. We use Firefox here too.",
  },
  {
    slug: "source-apple-app-store-reviews",
    date: "2026-04-07",
    displayDay: "APR 7",
    monthKey: "april-2026",
    monthLabel: "April 2026",
    title: "Source: Apple App Store reviews",
    type: "feature",
    body: "Sixth source live. Backfill running for the trailing 12 months. Expect synthesis updates on mobile-product problems within a week.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MARCH 2026 (3 entries)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "improved-similarity-clustering",
    date: "2026-03-25",
    displayDay: "MAR 25",
    monthKey: "march-2026",
    monthLabel: "March 2026",
    title: "Improved similarity clustering",
    type: "improvement",
    body: "Clustering now uses semantic embeddings alongside lexical overlap. Fewer duplicate clusters; same precision.",
  },
  {
    slug: "fix-missing-momentum-backfilled-problems",
    date: "2026-03-12",
    displayDay: "MAR 12",
    monthKey: "march-2026",
    monthLabel: "March 2026",
    title: "Fixed: missing momentum on backfilled problems",
    type: "fix",
    body: "Problems imported from the backfill pipeline were missing the 30-day momentum chart. All historical entries now have full momentum data.",
  },
  {
    slug: "export-to-csv",
    date: "2026-03-04",
    displayDay: "MAR 4",
    monthKey: "march-2026",
    monthLabel: "March 2026",
    title: "Export to CSV",
    type: "feature",
    body: "Pro and Team users can export any problem report as CSV from Settings → Export. Includes evidence quotes with source attribution.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FEBRUARY 2026 (2 entries)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "source-product-hunt",
    date: "2026-02-20",
    displayDay: "FEB 20",
    monthKey: "february-2026",
    monthLabel: "February 2026",
    title: "Source: Product Hunt",
    type: "feature",
    body: "Fifth source live. Comments and ship-update threads ingested back to 2023.",
  },
  {
    slug: "faster-ingest",
    date: "2026-02-09",
    displayDay: "FEB 9",
    monthKey: "february-2026",
    monthLabel: "February 2026",
    title: "Faster ingest",
    type: "improvement",
    body: "End-to-end ingest latency dropped meaningfully across all sources. Reports now reflect overnight discussions by the time you read the morning digest.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // JANUARY 2026 (2 entries)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "public-launch",
    date: "2026-01-28",
    displayDay: "JAN 28",
    monthKey: "january-2026",
    monthLabel: "January 2026",
    title: "Public launch",
    type: "feature",
    body: "Bristle is now publicly available. The first 90 days are about pattern coverage, not feature breadth. Reach us at hello@bristle.dev.",
  },
  {
    slug: "initial-sources-live",
    date: "2026-01-14",
    displayDay: "JAN 14",
    monthKey: "january-2026",
    monthLabel: "January 2026",
    title: "Initial sources live",
    type: "feature",
    body: "Bristle launches with four sources: GitHub Issues, Hacker News, Stack Overflow, and Google Play. Two more sources (Product Hunt, Apple App Store) ship in the following quarter.",
  },
];
