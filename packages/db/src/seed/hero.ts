import { genFrequency, type ProblemFixture } from "./types";

// The hero fixture (Stripe webhooks) — fully populates the page-2 problem-detail
// screen (FR-025/SC-009). 47-quote source breakdown over the 5 live sources (no
// PH/Play). Only a representative handful of the 47 quotes are authored; the
// donut/counts come from `sources`.
export const HERO: ProblemFixture = {
  slug: "stripe-webhooks-vercel-cold-starts",
  sources: [
    { sourceKey: "gh", quoteCount: 20 },
    { sourceKey: "hn", quoteCount: 13 },
    { sourceKey: "so", quoteCount: 9 },
    { sourceKey: "appstore", quoteCount: 3 },
    { sourceKey: "forum", quoteCount: 2 },
  ], // = 47
  quotes: [
    {
      authorHandle: "sandhya / stripe-node",
      sourceKey: "gh",
      engagementValue: 47,
      engagementLabel: "reactions",
      quoteText:
        "Lost $4,200 in failed retries before catching it. Webhook signature passed, handler ran, but Vercel killed the function at 9.8s. Stripe retried six times, eventually gave up, and we missed the event entirely. The dashboard reconciliation caught it three days later.",
      sourceUrl: "https://github.com/stripe/stripe-node/issues/24420",
      postedAt: new Date("2026-05-06T00:00:00Z"),
      isWtpSignal: true,
      statedPriceUsd: 60,
    },
    {
      authorHandle: "indie_founder",
      sourceKey: "hn",
      engagementValue: 314,
      engagementLabel: "points",
      quoteText:
        "Two months chasing this. Stripe support says 'your infra'; Vercel support says 'Stripe is async.' It is, and they kill it. The docs on either side do not warn you.",
      sourceUrl: "https://news.ycombinator.com/item?id=40000001",
      postedAt: new Date("2026-05-07T00:00:00Z"),
      isWtpSignal: false,
    },
    {
      authorHandle: " post-2843192",
      sourceKey: "so",
      engagementValue: 32000,
      engagementLabel: "rep",
      quoteText:
        "Tagged stripe-webhooks-vercel · 47 answers in 14 days. The top answer is from 2022 and is wrong post-Edge runtime changes. I would actually pay for a service that is correct as of this week.",
      sourceUrl: "https://stackoverflow.com/q/79000001",
      postedAt: new Date("2026-05-08T00:00:00Z"),
      isWtpSignal: true,
      statedPriceUsd: 40,
    },
    {
      authorHandle: "jotleuxoto / next-stripe-starter",
      sourceKey: "gh",
      engagementValue: 41,
      engagementLabel: "reactions",
      quoteText:
        "Workaround: queue the event in Upstash within 100ms, ack immediately, process out-of-band. Works perfectly. Should be in the Stripe + Vercel quickstart, not a Discord pin.",
      sourceUrl: "https://github.com/example/next-stripe-starter/issues/88",
      postedAt: new Date("2026-05-09T00:00:00Z"),
      isWtpSignal: false,
    },
    {
      authorHandle: "build_lat_eric",
      sourceKey: "hn",
      engagementValue: 218,
      engagementLabel: "points",
      quoteText:
        "I would actually pay $40/mo for a service that just guarantees webhook delivery in serverless. Stripe should do this. They will not. So somebody else will.",
      sourceUrl: "https://news.ycombinator.com/item?id=40000002",
      postedAt: new Date("2026-05-10T00:00:00Z"),
      isWtpSignal: true,
      statedPriceUsd: 40,
    },
    {
      authorHandle: "mobcap_dev",
      sourceKey: "appstore",
      rating: 2,
      quoteText:
        "Our billing app drops Stripe events on cold start and customers get double-charged on retry. Two stars until this is fixed.",
      postedAt: new Date("2026-05-04T00:00:00Z"),
      isWtpSignal: false,
    },
  ],
  solutions: [
    {
      name: "Hookdeck",
      priceRange: "$25–$499/mo",
      matchType: "direct",
      description:
        "General webhook gateway. Strong tooling. Mentioned as 'overkill for just Stripe' by 4 commenters.",
      mentionCount: 4,
    },
    {
      name: "Inngest",
      priceRange: "Free–$300/mo",
      matchType: "adjacent",
      description:
        "Serverless durable workflows. Mentioned by 7 commenters as 'the right shape but priced for bigger problems.'",
      mentionCount: 7,
    },
    {
      name: "Stripe official quickstart",
      priceRange: "Free",
      matchType: "partial",
      description:
        "Stripe + Vercel guide. Does not warn about timeouts. Mentioned by 3 commenters as a documentation failure.",
      mentionCount: 3,
    },
    {
      name: "Roll your own (Upstash queue)",
      priceRange: "~$50/mo",
      matchType: "partial",
      description:
        "Open-source pattern. Works. Burden on the team to maintain. Most-recommended path in Q1 2026.",
      mentionCount: 9,
    },
    {
      name: "Svix",
      priceRange: "Free–$490/mo",
      matchType: "adjacent",
      description:
        "Webhook-sending platform; aimed at producers, not the consumer-side delivery gap.",
      mentionCount: 2,
    },
    {
      name: "QStash",
      priceRange: "Free–$180/mo",
      matchType: "partial",
      description:
        "Upstash's hosted queue; covers the ack-fast pattern but no Stripe-specific guarantees.",
      mentionCount: 3,
    },
  ],
  wtp: {
    mentionCount: 11,
    priceMinUsd: 20,
    priceMaxUsd: 99,
    medianUsd: 60,
    note: "Median stated price: $60/mo. Three commenters say they'd pay annually. Two would consider an open-source tool with paid support.",
  },
  personas: [
    { label: "Indie founders", count: 22, percentage: 47 },
    { label: "Engineers at 10–50 person co.", count: 16, percentage: 34 },
    { label: "Agency / contractors", count: 6, percentage: 13 },
    { label: "Other", count: 3, percentage: 6 },
  ],
  related: [
    { label: "Webhook ordering on retries" },
    { label: "Idempotency keys vs cron jobs" },
    { label: "Edge runtime + crypto verification" },
    { label: "Background jobs in serverless" },
  ],
  frequency: genFrequency({
    endDate: "2026-05-12",
    days: 90,
    from: 1,
    to: 6,
    thresholdDate: "2026-04-16",
  }),
  compareCard: {
    validatedDemand: { value: "Validated", tone: "positive" },
    hasDirectSolution: { value: "Hookdeck — overkill", tone: "caution" },
    personaFit: { value: "High", tone: "positive" },
    buildEffort: { value: "Medium · 2-4 wks", tone: "caution" },
    defensibility: { value: "Narrow slice", tone: "caution" },
    bristlesRead: {
      verdict: "strongest",
      prose:
        "Direct competitor priced above target. Six WTP mentions cluster at $40. Narrow, defensible product.",
    },
  },
};
