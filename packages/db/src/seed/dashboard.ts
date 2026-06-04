import type { WeeklyMomentum } from "@bristle/shared";
import { daysAgo, hoursAgo, minsAgo } from "./types";

// Dashboard fixtures: the recent-activity rail (Image 1), the KPI/usage meters,
// the weekly-momentum chart payload, and the alert-delivery panel (Image 5).

// Recent activity (Image 1). `global` = a team/global event (user_id null);
// otherwise the demo user's own.
export interface ActivitySeed {
  type: string; // threshold_crossed | quotes_added | problem_added | saved
  title: string;
  deltaLabel?: string; // "+312%" | "NEW" | "SAVED"
  slug?: string;
  global?: boolean;
  createdAt: string;
}

export const ACTIVITY: ActivitySeed[] = [
  { type: "threshold_crossed", title: "Stripe webhooks crossed Pro threshold", deltaLabel: "+312%", slug: "stripe-webhooks-vercel-cold-starts", createdAt: minsAgo(12).toISOString() },
  { type: "quotes_added", title: "LLM streaming added 8 new quotes", deltaLabel: "+184%", slug: "llm-streaming-cdn-buffering", createdAt: minsAgo(56).toISOString() },
  { type: "problem_added", title: "3 problems added in Auth & SSO", deltaLabel: "NEW", global: true, createdAt: hoursAgo(2).toISOString() },
  { type: "threshold_crossed", title: "iOS 18.4 OTA mentions doubled overnight", deltaLabel: "+96%", slug: "expo-ota-ios-18-4", createdAt: hoursAgo(3).toISOString() },
  { type: "saved", title: "Marlon saved pgvector indexes", deltaLabel: "SAVED", slug: "pgvector-index-degradation-2m", global: true, createdAt: hoursAgo(5).toISOString() },

  // Hero-activity top-up (slice 4.3, STOP-3): the Stripe hero's problem-scoped
  // timeline so its Activity tab reads as a real timeline (the design doesn't
  // depict the tab; this matches the dashboard rail's richness). Timestamps are
  // OLDER than the 5 rail entries above (12m–5h), so the dashboard's newest-5
  // rail is unchanged; getProblemActivity(stripe) returns all of these (~5).
  // Now-relative per TF-023; existing activity types only; no schema change.
  { type: "quotes_added", title: "Stripe webhooks added 12 new quotes", deltaLabel: "+12 quotes", slug: "stripe-webhooks-vercel-cold-starts", createdAt: daysAgo(1).toISOString() },
  { type: "saved", title: "Stripe webhooks saved to Payments", deltaLabel: "SAVED", slug: "stripe-webhooks-vercel-cold-starts", createdAt: daysAgo(2).toISOString() },
  { type: "threshold_crossed", title: "Stripe webhooks crossed Hobby threshold", deltaLabel: "+180%", slug: "stripe-webhooks-vercel-cold-starts", createdAt: daysAgo(4).toISOString() },
  { type: "problem_added", title: "Stripe webhooks first detected", deltaLabel: "NEW", slug: "stripe-webhooks-vercel-cold-starts", createdAt: daysAgo(8).toISOString() },
];

// KPI tiles (Image 1) + tier displays. saved_problems 28/50 is the headline literal
// (independent of the 9 actually-seeded saved cards — the 15-fixture ceiling).
export interface MeterSeed {
  metric: string;
  used: number;
  quota?: number;
  deltaPct?: number;
  secondaryLabel?: string;
}

export const USAGE_METERS: MeterSeed[] = [
  { metric: "new_mentions_24h", used: 14, deltaPct: 27 },
  { metric: "momentum_crossed_24h", used: 3 },
  { metric: "saved_problems", used: 28, quota: 50 },
  { metric: "alert_queue", used: 7, secondaryLabel: "3 unread" },
  { metric: "categories", used: 7 },
  { metric: "alerts", used: 4 },
  { metric: "api_calls", used: 1240, quota: 5000 },
];

// Weekly-momentum chart (Image 1): the 3 legend category lines + the dashed
// projection + caption. Validated against WeeklyMomentumSchema at seed time.
export const WEEKLY_MOMENTUM: WeeklyMomentum = {
  series: [
    { categoryKey: "devtools", points: [88, 92, 95, 99, 104, 108, 113, 119, 126, 132, 138, 142] },
    { categoryKey: "ai-ml", points: [71, 76, 80, 86, 92, 98, 103, 109, 114, 118, 121, 124] },
    { categoryKey: "mobile", points: [41, 43, 45, 47, 48, 50, 51, 53, 54, 55, 57, 58] },
  ],
  projection: { label: "Projected", points: [58, 61, 64, 67, 71, 75, 79, 83, 88, 93, 98, 104] },
  caption: "Devtools still leads. AI / ML pulling away on velocity.",
};

// Alert-delivery panel (Image 5). Fixture-only payload (no dedicated Zod contract
// this slice — simple list; 4.5 can formalize it).
export const DELIVERY = {
  channels: [
    { type: "email", target: "elena@bristle.dev", enabled: true },
    { type: "slack", target: "#bristle-feed in Workspace", enabled: true },
    { type: "webhook", target: "https://hooks.studio.io/bristle", enabled: false },
    { type: "in-app", target: "always on", enabled: true },
  ],
};
