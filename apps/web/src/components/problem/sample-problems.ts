// [PLACEHOLDER — sample problem content awaiting founder review before production launch]
//
// Slice-012 sample-problem data store. 5 entries: 1 full (Stripe webhooks)
// + 4 stubs (webhook-ordering-on-retries / llm-streaming-cdn-buffering /
// expo-ota-ios-18-4 / pgvector-index-degradation-2m).
//
// Slug alignment with slice-004 packages/db/src/seed.ts:
//   - stripe-webhooks-vercel-cold-starts  → seed (full problem; landing Hero
//                                            renders this via ProblemCardFull
//                                            but the card has no href; the
//                                            page is direct-URL only this slice).
//   - llm-streaming-cdn-buffering         → seed (landing SampleReports card
//                                            href; flips from soft-404 to live
//                                            stub page on slice-012 ship).
//   - expo-ota-ios-18-4                   → seed (same).
//   - pgvector-index-degradation-2m       → seed (same).
//   - webhook-ordering-on-retries         → slice-012-local (NOT in seed;
//                                            backs the topically-coherent
//                                            first item of the Stripe
//                                            RelatedProblemsCard).

import type {
  FrequencyPoint,
  SampleProblem,
  SampleProblemFull,
  SampleProblemStub,
} from "./types";

// Pure helper — builds an array of {date, count} pairs starting at startISO
// and advancing one UTC day per entry. Used only at module load.
function dailyPoints(
  startISO: string,
  counts: ReadonlyArray<number>,
): ReadonlyArray<FrequencyPoint> {
  const start = new Date(`${startISO}T00:00:00Z`);
  return counts.map((count, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), count };
  });
}

// Daily-count arrays per window. Rising trend that approximately fits
// the "+312% MoM" hero claim (prior 30d ≈ 9 mentions vs current 30d ≈ 38;
// 38/9 ≈ 4.22x growth). Sum of "all" (60 days, Mar 12 → May 10) ≈ 47 to
// match the quoteCount: 47 headline. Pre-baked placeholder values; founder
// reconciles before launch.

const COUNTS_7D = [3, 2, 4, 2, 5, 3, 4];

const COUNTS_30D = [
  0, 1, 0, 1, 0, 1, 1, 0, 1, 1,
  1, 2, 1, 1, 2, 2, 1, 2, 2, 2,
  3, 2, 3, 2, 4, 3, 4, 3, 5, 4,
];

const COUNTS_90D = [
  0, 0, 0, 0, 1, 0, 0, 0, 1, 0,
  0, 1, 0, 0, 0, 1, 0, 0, 0, 1,
  0, 0, 1, 0, 0, 0, 0, 1, 0, 0,
  0, 1, 0, 0, 1, 0, 1, 0, 0, 1,
  0, 1, 0, 0, 1, 1, 0, 1, 1, 0,
  0, 1, 0, 1, 0, 1, 1, 0, 1, 1,
  1, 2, 1, 1, 2, 2, 1, 2, 2, 2,
  3, 2, 3, 2, 4, 3, 4, 3, 5, 4,
  3, 4, 3, 5, 4, 5, 4, 6, 5, 4,
];

const COUNTS_ALL = [
  0, 0, 1, 0, 1, 0, 1, 1, 0, 1,
  1, 0, 1, 1, 0, 1, 1, 1, 2, 1,
  1, 2, 1, 2, 2, 1, 2, 2, 2, 3,
  2, 3, 2, 2, 3, 2, 3, 3, 2, 3,
  3, 2, 3, 3, 3, 4, 3, 4, 3, 4,
  3, 4, 4, 3, 4, 4, 5, 4, 5, 4,
];

const STRIPE: SampleProblemFull = {
  slug: "stripe-webhooks-vercel-cold-starts",
  breadcrumb: ["Library", "Devtools", "Payments"],
  title: "Stripe webhooks fail silently on Vercel cold starts",
  momentum: { delta: "+312%", windowDays: 14 },
  firstSeenDate: "2026-02-08",
  firstSeenDisplay: "Feb 8",
  quoteCount: 47,
  sourceCount: 6,
  sourceBadges: ["github", "hackernews", "stackoverflow", "reddit", "producthunt"],
  lead:
    "Across 47 mentions in the last 60 days, builders describe the same failure mode: a Stripe webhook arrives, the handler runs, the function is killed at the Vercel timeout (9.8s on hobby, 60s on Pro), and Stripe's retry policy compounds the problem into a cascading set of duplicate retries — or, more dangerously, a silent missed event when retries exhaust.",
  pullQuote: {
    text:
      "The handler ran fine in local. In production we lost $4,200 in failed retries before the dashboard reconciliation caught it.",
    attribution: "",
  },
  body:
    "The problem is structural: serverless runtimes treat webhook handlers as ordinary HTTP requests, but Stripe's retry policy assumes a stateful long-lived endpoint. Three workarounds dominate the discussion — queue the event immediately and ack within 200ms (recommended by Stripe), use a stateful runtime (Workers, Fly), or move to a dedicated server. None are obvious for a beginner; all three require infrastructure decisions made before the first real customer.",
  sourcesBreakdown: [
    { name: "GitHub", count: 26 },
    { name: "Hacker News", count: 13 },
    { name: "Stack Overflow", count: 3 },
    { name: "Other", count: 5 },
  ],
  frequencyData: {
    "7d": dailyPoints("2026-05-04", COUNTS_7D),
    "30d": dailyPoints("2026-04-11", COUNTS_30D),
    "90d": dailyPoints("2026-02-09", COUNTS_90D),
    "all": dailyPoints("2026-03-12", COUNTS_ALL),
  },
  evidenceQuotes: [
    {
      authorHandle: "stripe-builder",
      source: "github",
      upvotes: 142,
      commentCount: 38,
      timestamp: "May 9",
      text:
        "Lost $4,200 in failed retries before the dashboard reconciliation caught it. The handler ran fine in local — production cold-started past the timeout.",
      blurred: false,
    },
    {
      authorHandle: "kgreene",
      source: "hackernews",
      upvotes: 217,
      commentCount: 84,
      timestamp: "May 6",
      text:
        "Spent two days reading the Vercel function logs before realizing Stripe was retrying the same event four times because our handler never ack'd before being killed.",
      blurred: false,
    },
    {
      authorHandle: "indie-saas",
      source: "stackoverflow",
      upvotes: 89,
      commentCount: 22,
      timestamp: "Apr 28",
      text:
        "Moved the handler off Vercel to a Fly machine after the third silent missed event. The cold-start tail on serverless is incompatible with Stripe's retry SLA.",
      blurred: false,
    },
    {
      authorHandle: "j-fonts",
      source: "github",
      upvotes: 67,
      commentCount: 14,
      timestamp: "Apr 21",
      text:
        "If you queue the event into Inngest within the first 200ms and ack to Stripe immediately, the cold-start becomes a non-issue. Took us a week to land on this pattern.",
      blurred: false,
    },
    {
      authorHandle: "webhook-watcher",
      source: "reddit",
      upvotes: 54,
      commentCount: 19,
      timestamp: "Apr 14",
      text:
        "Stripe support confirmed the retry policy compounds on 5xx responses but they can't help if your runtime kills the process before you respond.",
      blurred: false,
    },
    {
      authorHandle: "ops-engineer",
      source: "github",
      upvotes: 91,
      commentCount: 27,
      timestamp: "Apr 7",
      text:
        "We migrated 14 services off Vercel for Stripe webhook handling alone. The 9.8s hobby timeout was the breaking point — Pro at 60s helped but didn't eliminate the cold-start tail.",
      blurred: true,
    },
    {
      authorHandle: "dev-platform",
      source: "hackernews",
      upvotes: 73,
      commentCount: 31,
      timestamp: "Mar 30",
      text:
        "The fix that actually worked: a separate Cloudflare Worker doing nothing but accepting the webhook, queueing into a durable backend, and returning 200 in under 50ms. Stripe stopped retrying.",
      blurred: true,
    },
  ],
  relatedProblems: [
    { slug: "webhook-ordering-on-retries", title: "Webhook ordering on retries", leadSnippet: "Two webhooks fire in close succession, the retry queue interleaves them, and the second races the first." },
    { slug: "llm-streaming-cdn-buffering", title: "LLM streaming chokes through CDN buffering", leadSnippet: "Cloudflare buffers Server-Sent Events despite the explicit headers." },
    { slug: "expo-ota-ios-18-4", title: "Expo OTA updates silently fail on iOS 18.4", leadSnippet: "Users on iOS 18.4 sit on the last shipped build. No error, no telemetry." },
    { slug: "pgvector-index-degradation-2m", title: "pgvector indexes degrade past 2M rows", leadSnippet: "Hybrid-search query latency jumps from 80ms to 4.2s once embedding count crosses 2M." },
  ],
  stubBody: false,
};

const WEBHOOK_ORDERING: SampleProblemStub = {
  slug: "webhook-ordering-on-retries",
  breadcrumb: ["Library", "Devtools", "Payments"],
  title: "Webhook ordering on retries",
  momentum: { delta: "+128%", windowDays: 14 },
  firstSeenDate: "2026-03-04",
  firstSeenDisplay: "Mar 4",
  quoteCount: 21,
  sourceCount: 3,
  sourceBadges: ["github", "hackernews", "stackoverflow"],
  lead:
    "Two webhooks fire in close succession, the retry queue interleaves them, and the second one races the first. We've seen this break idempotency in two distinct ways.",
  stubBody: true,
};

const LLM_STREAMING: SampleProblemStub = {
  slug: "llm-streaming-cdn-buffering",
  breadcrumb: ["Library", "AI/ML", "Streaming"],
  title: "LLM streaming chokes through CDN buffering",
  momentum: { delta: "+184%", windowDays: 14 },
  firstSeenDate: "2026-02-15",
  firstSeenDisplay: "Feb 15",
  quoteCount: 34,
  sourceCount: 3,
  sourceBadges: ["hackernews", "stackoverflow", "github"],
  lead:
    "Cloudflare buffers Server-Sent Events despite the explicit headers. Builders spend weeks diagnosing what looks like a backend stall but is actually edge-layer buffering.",
  stubBody: true,
};

const EXPO_OTA: SampleProblemStub = {
  slug: "expo-ota-ios-18-4",
  breadcrumb: ["Library", "Mobile", "iOS"],
  title: "Expo OTA updates silently fail on iOS 18.4",
  momentum: { delta: "+96%", windowDays: 14 },
  firstSeenDate: "2026-04-02",
  firstSeenDisplay: "Apr 2",
  quoteCount: 19,
  sourceCount: 3,
  sourceBadges: ["github", "appstore", "stackoverflow"],
  lead:
    "Users on iOS 18.4 sit on the last shipped build. No error, no telemetry, no acknowledgement — and no fix in the Expo changelog yet.",
  stubBody: true,
};

const PGVECTOR: SampleProblemStub = {
  slug: "pgvector-index-degradation-2m",
  breadcrumb: ["Library", "Devtools", "Databases"],
  title: "pgvector indexes degrade past 2M rows",
  momentum: { delta: "+72%", windowDays: 14 },
  firstSeenDate: "2026-03-21",
  firstSeenDisplay: "Mar 21",
  quoteCount: 15,
  sourceCount: 3,
  sourceBadges: ["github", "hackernews", "stackoverflow"],
  lead:
    "Hybrid-search query latency jumps from 80ms to 4.2s once embedding count crosses 2M. The HNSW index recall degrades and the standard fix recipes don't apply.",
  stubBody: true,
};

export const SAMPLE_PROBLEMS: ReadonlyArray<SampleProblem> = [
  STRIPE,
  WEBHOOK_ORDERING,
  LLM_STREAMING,
  EXPO_OTA,
  PGVECTOR,
];
