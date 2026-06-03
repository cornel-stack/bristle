// Alerts (Image 5): 4 watch rules (one disabled) + the 7-item notifications feed
// (3 unread). Rule names mirror the design's "<category> · <condition>" labels.
export interface RuleSeed {
  name: string;
  categoryKey: string;
  ruleType: string; // momentum | new | threshold | wtp
  threshold: number | null;
  channels: string[];
  enabled: boolean;
  firedCount: number;
  position: number;
}

export const ALERT_RULES: RuleSeed[] = [
  { name: "Payments · momentum > +200%", categoryKey: "payments", ruleType: "momentum", threshold: 200, channels: ["email", "slack", "in-app"], enabled: true, firedCount: 5, position: 0 },
  { name: "Auth & SSO · any new problem", categoryKey: "auth-sso", ruleType: "new", threshold: null, channels: ["email", "in-app"], enabled: true, firedCount: 3, position: 1 },
  { name: "Devtools · weekly count > 100", categoryKey: "devtools", ruleType: "threshold", threshold: 100, channels: ["slack", "in-app"], enabled: true, firedCount: 1, position: 2 },
  { name: "AI / ML · WTP mentions > 5", categoryKey: "ai-ml", ruleType: "wtp", threshold: 5, channels: ["email"], enabled: false, firedCount: 0, position: 3 },
];

export interface NotifSeed {
  type: string; // momentum | new | wtp | digest | threshold | weekly
  title: string;
  body: string;
  isRead: boolean;
  slug?: string; // links to a seeded problem where applicable
  createdAt: string;
}

export const ALERT_NOTIFICATIONS: NotifSeed[] = [
  { type: "momentum", title: "Stripe webhooks crossed +300% momentum", body: "14-day momentum reached 312%, crossing the threshold of your Payments watch rule. 8 new mentions in the last 24 hours.", isRead: false, slug: "stripe-webhooks-vercel-cold-starts", createdAt: "2026-05-12T09:14:00Z" },
  { type: "new", title: "New problem in Auth & SSO", body: "OAuth refresh token rotation breaks Google SSO — first surfaced on Stack Overflow with 12 quotes already.", isRead: false, slug: "oauth-refresh-google-sso", createdAt: "2026-05-12T08:02:00Z" },
  { type: "wtp", title: "Willingness-to-pay signal · LLM streaming", body: "A new HN comment quotes $40–$80/mo for 'a streaming proxy I never have to think about.' The problem now has 9 WTP mentions.", isRead: false, slug: "llm-streaming-cdn-buffering", createdAt: "2026-05-11T18:32:00Z" },
  { type: "digest", title: "Daily digest delivered", body: "Sent to elena@bristle.dev with 6 problems above your momentum threshold.", isRead: true, createdAt: "2026-05-11T19:14:00Z" },
  { type: "weekly", title: "Weekly digest delivered", body: "7-day summary across Devtools, Payments, AI / ML, Auth & SSO, Deployment.", isRead: true, createdAt: "2026-05-10T18:00:00Z" },
  { type: "new", title: "New problem in Mobile", body: "Expo OTA updates silently fail on iOS 18.4 — surfaced on App Store reviews and confirmed on GitHub.", isRead: true, slug: "expo-ota-ios-18-4", createdAt: "2026-05-10T09:43:00Z" },
  { type: "threshold", title: "Devtools weekly count crossed 100", body: "Your 'Devtools' watch rule fired. 102 new problems indexed this week, vs 84 the prior week.", isRead: true, createdAt: "2026-05-10T07:21:00Z" },
];
