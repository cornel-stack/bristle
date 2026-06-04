import { genFrequency, todayISO, type ProblemFixture } from "./types";

// The 14 non-hero fixtures — compact-but-complete: every page-2 section non-empty
// (≥4 quotes, ≥1 solution, ≥2 personas, ≥2 related, a frequency series), plus a
// compare_card on each (Compare is drag-any-problem). `wtp` is null where the
// design shows genuine 0 (pgvector). 5-live-source keys only. LLM/pgvector/Expo
// compare_cards match Core_app.pdf page 6 verbatim.
const freq = (from: number, to: number) =>
  genFrequency({ endDate: todayISO(), days: 30, from, to });

export const OTHER_FIXTURES: ProblemFixture[] = [
  {
    slug: "llm-streaming-cdn-buffering",
    sources: [
      { sourceKey: "hn", quoteCount: 18 },
      { sourceKey: "so", quoteCount: 12 },
      { sourceKey: "gh", quoteCount: 8 },
    ],
    quotes: [
      { authorHandle: "streamhead", sourceKey: "hn", engagementValue: 210, engagementLabel: "points", quoteText: "Cloudflare buffers SSE despite explicit headers. Three weeks to find this.", isWtpSignal: true, statedPriceUsd: 25 },
      { authorHandle: "edge_dev", sourceKey: "so", engagementValue: 12400, engagementLabel: "rep", quoteText: "Setting Cache-Control and X-Accel-Buffering does nothing on the default plan. Had to bypass the CDN for /stream.", isWtpSignal: false },
      { authorHandle: "acme/chat-ui", sourceKey: "gh", engagementValue: 33, engagementLabel: "reactions", quoteText: "Tokens arrive in one burst at the end. Users think it hung. Lost trial conversions over it.", isWtpSignal: true, statedPriceUsd: 30 },
      { authorHandle: "ml_builder", sourceKey: "hn", engagementValue: 96, engagementLabel: "points", quoteText: "Would pay for a streaming proxy I never have to think about.", isWtpSignal: true, statedPriceUsd: 25 },
    ],
    solutions: [
      { name: "Cloudflare Workers proxy", priceRange: "Free–$5/mo", matchType: "partial", description: "Bypass buffering by streaming through a Worker. DIY.", mentionCount: 5 },
      { name: "Fly.io passthrough", priceRange: "~$10/mo", matchType: "partial", description: "Run the stream route on a non-buffering host.", mentionCount: 3 },
      { name: "Vercel Edge (no buffering)", priceRange: "Free–$20/mo", matchType: "adjacent", description: "Edge functions stream without CDN buffering; lock-in trade-off.", mentionCount: 4 },
    ], // 3 solutions, 0 direct (page 6)
    wtp: { mentionCount: 7, priceMinUsd: 15, priceMaxUsd: 60, medianUsd: 25, note: "Median $25/mo. Mostly indie hackers shipping chat UIs." },
    personas: [
      { label: "Indie founders", count: 14, percentage: 38 },
      { label: "Engineers at 10–50 person co.", count: 12, percentage: 32 },
      { label: "Other", count: 11, percentage: 30 },
    ],
    related: [
      { label: "Edge runtime + crypto verification" },
      { label: "Cursor agent loses context", targetSlug: "cursor-agent-multifile-context" },
    ],
    frequency: freq(2, 5),
    compareCard: {
      validatedDemand: { value: "Validated", tone: "positive" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "Low · 1-2 wks", tone: "positive" },
      defensibility: { value: "CDN-dependent", tone: "caution" },
      bristlesRead: { verdict: "build-able", prose: "No direct solution. Buildable in 2 weeks with Workers proxy. Defensibility is thin." },
    },
  },
  {
    slug: "expo-ota-ios-18-4",
    sources: [
      { sourceKey: "appstore", quoteCount: 14 },
      { sourceKey: "gh", quoteCount: 11 },
      { sourceKey: "forum", quoteCount: 6 },
    ],
    quotes: [
      { authorHandle: "rn_shipper", sourceKey: "appstore", rating: 1, quoteText: "Users on 18.4 stuck on last build. No error, no telemetry, no acknowledgment.", isWtpSignal: false },
      { authorHandle: "expo/expo", sourceKey: "gh", engagementValue: 52, engagementLabel: "reactions", quoteText: "Reproduced on 18.4 only. Update manifest fetched, never applied. Filed upstream.", isWtpSignal: false },
      { authorHandle: "mobile_lead", sourceKey: "forum", engagementValue: 8, engagementLabel: "replies", quoteText: "Rolled back to a store build to be safe. OTA is our whole release flow.", isWtpSignal: true, statedPriceUsd: 20 },
      { authorHandle: "appdev_kim", sourceKey: "appstore", rating: 2, quoteText: "Three releases stuck. Had to ship a full review just to push a one-line fix.", isWtpSignal: false },
    ],
    solutions: [], // genuine 0 — page 6 shows "—" ("Expo will fix"); no real existing solution
    wtp: { mentionCount: 1, priceMinUsd: 20, priceMaxUsd: 20, medianUsd: 20, note: "One mention; mostly an upstream wait." },
    personas: [
      { label: "Mobile dev", count: 24, percentage: 78 },
      { label: "Agency / contractors", count: 7, percentage: 22 },
    ],
    related: [
      { label: "App Store Connect re-verification", targetSlug: "appstore-connect-phone-reverify" },
      { label: "OTA rollback strategies" },
    ],
    frequency: freq(1, 5),
    compareCard: {
      validatedDemand: { value: "Validated", tone: "positive" },
      hasDirectSolution: { value: "Expo will fix", tone: "neutral" },
      personaFit: { value: "High", tone: "positive" },
      buildEffort: { value: "—", tone: "neutral" },
      defensibility: { value: "None", tone: "negative" },
      bristlesRead: { verdict: "skip", prose: "Apple/Expo problem. Will resolve without you." },
    },
  },
  {
    slug: "pgvector-index-degradation-2m",
    sources: [
      { sourceKey: "gh", quoteCount: 13 },
      { sourceKey: "hn", quoteCount: 9 },
      { sourceKey: "so", quoteCount: 7 },
    ],
    quotes: [
      { authorHandle: "pgvector/pgvector", sourceKey: "gh", engagementValue: 61, engagementLabel: "reactions", quoteText: "Hybrid search query went from 80ms to 4.2s once we crossed 2M embeddings.", isWtpSignal: false },
      { authorHandle: "db_owl", sourceKey: "hn", engagementValue: 188, engagementLabel: "points", quoteText: "HNSW build memory blows past work_mem and it silently falls back to a scan.", isWtpSignal: false },
      { authorHandle: "vec_eng", sourceKey: "so", engagementValue: 21000, engagementLabel: "rep", quoteText: "Partitioning helped but it's real DB tuning work. Not a weekend fix.", isWtpSignal: false },
      { authorHandle: "rag_team", sourceKey: "gh", engagementValue: 27, engagementLabel: "reactions", quoteText: "Evaluated LanceDB as an escape hatch. Adjacent, not a drop-in.", isWtpSignal: false },
    ],
    solutions: [
      { name: "LanceDB", priceRange: "Free / OSS", matchType: "adjacent", description: "Embedded vector store; adjacent migration path.", mentionCount: 5 },
      { name: "Qdrant", priceRange: "Free–$Custom", matchType: "adjacent", description: "Dedicated vector DB; adjacent.", mentionCount: 4 },
      { name: "pgvector tuning guide", priceRange: "Free", matchType: "partial", description: "Index/partition tuning. Works, but expert-level.", mentionCount: 6 },
      { name: "Timescale pgvectorscale", priceRange: "Free / OSS", matchType: "partial", description: "Extension improving recall/latency at scale.", mentionCount: 3 },
    ],
    wtp: null,
    personas: [
      { label: "Engineers at 10–50 person co.", count: 17, percentage: 60 },
      { label: "Indie founders", count: 8, percentage: 28 },
      { label: "Other", count: 4, percentage: 12 },
    ],
    related: [
      { label: "Hybrid search relevance tuning" },
      { label: "Supabase Realtime drops on Safari 18", targetSlug: "supabase-realtime-safari-18" },
    ],
    frequency: freq(2, 4),
    compareCard: {
      validatedDemand: { value: "Trending", tone: "caution" },
      hasDirectSolution: { value: "LanceDB — adjacent", tone: "caution" },
      personaFit: { value: "Low", tone: "negative" },
      buildEffort: { value: "High · DB tuning", tone: "negative" },
      defensibility: { value: "Strong", tone: "positive" },
      bristlesRead: { verdict: "watch", prose: "Real but technical. Likely fixed upstream within 2 quarters." },
    },
  },
  {
    slug: "oauth-refresh-google-sso",
    sources: [
      { sourceKey: "so", quoteCount: 14 },
      { sourceKey: "gh", quoteCount: 10 },
    ],
    quotes: [
      { authorHandle: "auth_dev", sourceKey: "so", engagementValue: 9800, engagementLabel: "rep", quoteText: "Token rotation on the 7th day silently logs out half the team. No useful logs.", isWtpSignal: false },
      { authorHandle: "nextauth/next-auth", sourceKey: "gh", engagementValue: 44, engagementLabel: "reactions", quoteText: "If you don't persist the rotated refresh token you're dead on day 7. Docs bury this.", isWtpSignal: true, statedPriceUsd: 30 },
      { authorHandle: "sso_lead", sourceKey: "so", engagementValue: 3100, engagementLabel: "rep", quoteText: "Repro: revoke happens server-side, client never learns. Forced re-login.", isWtpSignal: false },
      { authorHandle: "platform_kel", sourceKey: "gh", engagementValue: 19, engagementLabel: "reactions", quoteText: "We wrapped the refresh flow ourselves. Would rather buy a battle-tested adapter.", isWtpSignal: true, statedPriceUsd: 50 },
    ],
    solutions: [
      { name: "Auth.js Google provider", priceRange: "Free / OSS", matchType: "partial", description: "Handles most of it; rotation edge case bites.", mentionCount: 5 },
      { name: "WorkOS", priceRange: "Free–$Custom", matchType: "adjacent", description: "Managed SSO; adjacent and pricier.", mentionCount: 3 },
    ],
    wtp: { mentionCount: 3, priceMinUsd: 30, priceMaxUsd: 50, medianUsd: 35, note: "Three mentions; teams that already hand-rolled it." },
    personas: [
      { label: "Engineers at 10–50 person co.", count: 13, percentage: 54 },
      { label: "Indie founders", count: 7, percentage: 29 },
      { label: "Other", count: 4, percentage: 17 },
    ],
    related: [
      { label: "Session invalidation on password reset" },
      { label: "Refresh-token storage patterns" },
    ],
    frequency: freq(1, 4),
    compareCard: {
      validatedDemand: { value: "Trending", tone: "caution" },
      hasDirectSolution: { value: "Auth.js — partial", tone: "caution" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "Low · 1-2 wks", tone: "positive" },
      defensibility: { value: "Thin", tone: "caution" },
      bristlesRead: { verdict: "build-able", prose: "Fixable adapter. Small market but painful enough to pay for." },
    },
  },
  {
    slug: "flyio-wake-from-zero-p95",
    sources: [
      { sourceKey: "hn", quoteCount: 13 },
      { sourceKey: "forum", quoteCount: 9 },
    ],
    quotes: [
      { authorHandle: "ops_raj", sourceKey: "hn", engagementValue: 142, engagementLabel: "points", quoteText: "Cold-starts crept up after the November platform update. Users notice.", isWtpSignal: false },
      { authorHandle: "fly_community", sourceKey: "forum", engagementValue: 21, engagementLabel: "replies", quoteText: "3.2s p95 from zero. Keep-warm machine fixes it but costs money.", isWtpSignal: false },
      { authorHandle: "latency_nerd", sourceKey: "hn", engagementValue: 73, engagementLabel: "points", quoteText: "It's platform-side. Nothing to build, just want it fixed.", isWtpSignal: false },
      { authorHandle: "smol_saas", sourceKey: "forum", engagementValue: 6, engagementLabel: "replies", quoteText: "Switched a few apps off auto-stop to dodge it.", isWtpSignal: false },
    ],
    solutions: [
      { name: "Fly keep-warm machine", priceRange: "~$2–$10/mo", matchType: "partial", description: "Prevents wake-from-zero; ongoing cost.", mentionCount: 7 },
    ],
    wtp: null,
    personas: [
      { label: "Indie founders", count: 12, percentage: 55 },
      { label: "Engineers at 10–50 person co.", count: 10, percentage: 45 },
    ],
    related: [
      { label: "Serverless cold-start mitigation" },
      { label: "Background jobs in serverless" },
    ],
    frequency: freq(1, 3),
    compareCard: {
      validatedDemand: { value: "Trending", tone: "caution" },
      hasDirectSolution: { value: "Keep-warm — partial", tone: "caution" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "—", tone: "neutral" },
      defensibility: { value: "None", tone: "negative" },
      bristlesRead: { verdict: "skip", prose: "Platform regression. Fly will likely tune it back. Not yours to build." },
    },
  },
  {
    slug: "supabase-realtime-safari-18",
    sources: [
      { sourceKey: "gh", quoteCount: 11 },
      { sourceKey: "forum", quoteCount: 8 },
    ],
    quotes: [
      { authorHandle: "supabase/realtime", sourceKey: "gh", engagementValue: 38, engagementLabel: "reactions", quoteText: "WebSocket silently closes on Safari 18 after ~30s. Works everywhere else.", isWtpSignal: false },
      { authorHandle: "rt_dev", sourceKey: "forum", engagementValue: 14, engagementLabel: "replies", quoteText: "Heartbeat doesn't help. Safari kills the socket on background tab throttling.", isWtpSignal: false },
      { authorHandle: "frontend_mia", sourceKey: "gh", engagementValue: 12, engagementLabel: "reactions", quoteText: "Reconnect loop hides it but drops messages in the gap.", isWtpSignal: false },
      { authorHandle: "indie_ws", sourceKey: "forum", engagementValue: 5, engagementLabel: "replies", quoteText: "Polling fallback for Safari only. Ugly but works.", isWtpSignal: false },
    ],
    solutions: [
      { name: "Polling fallback", priceRange: "Free", matchType: "partial", description: "Detect Safari, fall back to polling.", mentionCount: 4 },
    ],
    wtp: null,
    personas: [
      { label: "Indie founders", count: 11, percentage: 58 },
      { label: "Engineers at 10–50 person co.", count: 8, percentage: 42 },
    ],
    related: [
      { label: "WebSocket reconnection patterns" },
      { label: "pgvector indexes degrade past 2M rows", targetSlug: "pgvector-index-degradation-2m" },
    ],
    frequency: freq(1, 3),
    compareCard: {
      validatedDemand: { value: "Trending", tone: "caution" },
      hasDirectSolution: { value: "Polling — partial", tone: "caution" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "Low · 1 wk", tone: "positive" },
      defensibility: { value: "None", tone: "negative" },
      bristlesRead: { verdict: "skip", prose: "Browser bug. Likely patched by Safari soon. Workaround is trivial." },
    },
  },
  {
    slug: "notion-api-bulk-write-throttle",
    sources: [
      { sourceKey: "gh", quoteCount: 10 },
      { sourceKey: "so", quoteCount: 6 },
    ],
    quotes: [
      { authorHandle: "sync_dev", sourceKey: "gh", engagementValue: 29, engagementLabel: "reactions", quoteText: "Bulk sync silently drops writes past the rate limit. No 429, just missing rows.", isWtpSignal: false },
      { authorHandle: "notion_hacker", sourceKey: "so", engagementValue: 4200, engagementLabel: "rep", quoteText: "Had to add my own backoff + reconcile pass. Should be in the SDK.", isWtpSignal: true, statedPriceUsd: 20 },
      { authorHandle: "cms_team", sourceKey: "gh", engagementValue: 15, engagementLabel: "reactions", quoteText: "Three retries minimum or you lose data. Docs don't say so.", isWtpSignal: false },
      { authorHandle: "ops_dani", sourceKey: "so", engagementValue: 1900, engagementLabel: "rep", quoteText: "A hardened Notion write client would save me a week.", isWtpSignal: true, statedPriceUsd: 25 },
    ],
    solutions: [
      { name: "Notion SDK + custom backoff", priceRange: "Free / OSS", matchType: "partial", description: "Roll your own retry/reconcile.", mentionCount: 4 },
    ],
    wtp: { mentionCount: 2, priceMinUsd: 20, priceMaxUsd: 25, medianUsd: 22, note: "Two mentions; teams building Notion-backed tools." },
    personas: [
      { label: "Indie founders", count: 9, percentage: 56 },
      { label: "Agency / contractors", count: 7, percentage: 44 },
    ],
    related: [
      { label: "Rate-limit backoff patterns" },
      { label: "SES bounce handling not surfaced in Resend", targetSlug: "ses-bounce-resend-dashboard" },
    ],
    frequency: freq(1, 3),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "Low · 1-2 wks", tone: "positive" },
      defensibility: { value: "Thin", tone: "caution" },
      bristlesRead: { verdict: "build-able", prose: "Small but real. A hardened write client could sell to Notion-tool builders." },
    },
  },
  {
    slug: "cursor-agent-multifile-context",
    sources: [
      { sourceKey: "hn", quoteCount: 9 },
      { sourceKey: "forum", quoteCount: 5 },
    ],
    quotes: [
      { authorHandle: "ai_ide_fan", sourceKey: "hn", engagementValue: 134, engagementLabel: "points", quoteText: "Agent forgets files it edited two steps ago and reverts its own changes.", isWtpSignal: false },
      { authorHandle: "cursor_forum", sourceKey: "forum", engagementValue: 12, engagementLabel: "replies", quoteText: "Multi-file refactors fall apart past ~5 files. Context window or planning bug.", isWtpSignal: false },
      { authorHandle: "dev_pat", sourceKey: "hn", engagementValue: 41, engagementLabel: "points", quoteText: "I babysit it now. Defeats the point.", isWtpSignal: false },
      { authorHandle: "refactor_guy", sourceKey: "forum", engagementValue: 7, engagementLabel: "replies", quoteText: "Smaller scoped prompts work. Tedious though.", isWtpSignal: true, statedPriceUsd: 20 },
    ],
    solutions: [
      { name: "Scoped-prompt workflow", priceRange: "Free", matchType: "partial", description: "Constrain edits to few files at a time.", mentionCount: 3 },
    ],
    wtp: { mentionCount: 1, priceMinUsd: 20, priceMaxUsd: 20, medianUsd: 20, note: "Single mention; mostly an upstream maturity issue." },
    personas: [
      { label: "Indie founders", count: 8, percentage: 57 },
      { label: "Engineers at 10–50 person co.", count: 6, percentage: 43 },
    ],
    related: [
      { label: "LLM streaming chokes through CDN buffering", targetSlug: "llm-streaming-cdn-buffering" },
      { label: "Agent planning + tool use" },
    ],
    frequency: freq(1, 3),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Low", tone: "negative" },
      buildEffort: { value: "High", tone: "negative" },
      defensibility: { value: "None", tone: "negative" },
      bristlesRead: { verdict: "skip", prose: "Will be fixed by Cursor itself. Not a wedge for an outside builder." },
    },
  },
  {
    slug: "astro-webhook-signature-mismatch",
    sources: [
      { sourceKey: "gh", quoteCount: 8 },
      { sourceKey: "so", quoteCount: 5 },
    ],
    quotes: [
      { authorHandle: "withastro/astro", sourceKey: "gh", engagementValue: 24, engagementLabel: "reactions", quoteText: "Astro's body parsing mangles the raw payload, so Stripe signature checks fail.", isWtpSignal: false },
      { authorHandle: "astro_pay", sourceKey: "so", engagementValue: 2600, engagementLabel: "rep", quoteText: "You must read the raw request body before Astro touches it. Took a day.", isWtpSignal: false },
      { authorHandle: "ecom_dev", sourceKey: "gh", engagementValue: 11, engagementLabel: "reactions", quoteText: "Same class of bug as the Vercel cold-start one. Webhooks are cursed in serverless.", isWtpSignal: true, statedPriceUsd: 30 },
      { authorHandle: "indie_store", sourceKey: "so", engagementValue: 880, engagementLabel: "rep", quoteText: "A framework-agnostic webhook verifier would be handy.", isWtpSignal: true, statedPriceUsd: 25 },
    ],
    solutions: [
      { name: "Raw-body middleware", priceRange: "Free / OSS", matchType: "partial", description: "Read raw body before parsing. DIY snippet.", mentionCount: 3 },
    ],
    wtp: { mentionCount: 2, priceMinUsd: 25, priceMaxUsd: 30, medianUsd: 27, note: "Two mentions; overlaps the Stripe-webhooks audience." },
    personas: [
      { label: "Indie founders", count: 8, percentage: 62 },
      { label: "Agency / contractors", count: 5, percentage: 38 },
    ],
    related: [
      { label: "Stripe webhooks fail silently on Vercel cold starts", targetSlug: "stripe-webhooks-vercel-cold-starts" },
      { label: "Raw body parsing across frameworks" },
    ],
    frequency: freq(1, 3),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "Low · 1 wk", tone: "positive" },
      defensibility: { value: "Narrow", tone: "caution" },
      bristlesRead: { verdict: "build-able", prose: "Folds into a broader webhook-verifier play. Weak standalone." },
    },
  },
  {
    slug: "posthog-replay-mobile-sampling",
    sources: [
      { sourceKey: "forum", quoteCount: 8 },
      { sourceKey: "gh", quoteCount: 6 },
      { sourceKey: "hn", quoteCount: 3 },
    ],
    quotes: [
      { authorHandle: "analytics_lee", sourceKey: "forum", engagementValue: 17, engagementLabel: "replies", quoteText: "Under sampling, mobile replays lose the events that actually matter for funnels.", isWtpSignal: false },
      { authorHandle: "posthog/posthog", sourceKey: "gh", engagementValue: 22, engagementLabel: "reactions", quoteText: "Mobile SDK drops events first when sampled. Web is fine.", isWtpSignal: false },
      { authorHandle: "growth_sam", sourceKey: "hn", engagementValue: 58, engagementLabel: "points", quoteText: "Our mobile conversion numbers were quietly wrong for a month.", isWtpSignal: true, statedPriceUsd: 30 },
      { authorHandle: "data_ous", sourceKey: "forum", engagementValue: 9, engagementLabel: "replies", quoteText: "Turned sampling off and the bill jumped. Need a smarter middle ground.", isWtpSignal: true, statedPriceUsd: 40 },
    ],
    solutions: [
      { name: "Disable sampling for mobile", priceRange: "Usage-priced", matchType: "partial", description: "Full capture; higher cost.", mentionCount: 4 },
    ],
    wtp: { mentionCount: 2, priceMinUsd: 30, priceMaxUsd: 40, medianUsd: 35, note: "Two mentions; analytics-heavy teams." },
    personas: [
      { label: "Engineers at 10–50 person co.", count: 10, percentage: 59 },
      { label: "Indie founders", count: 7, percentage: 41 },
    ],
    related: [
      { label: "Event sampling strategies" },
      { label: "Mobile funnel attribution" },
    ],
    frequency: freq(1, 4),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "Medium", tone: "caution" },
      defensibility: { value: "Thin", tone: "caution" },
      bristlesRead: { verdict: "watch", prose: "Real data-quality gap. Likely a PostHog config fix, not a product." },
    },
  },
  {
    slug: "stripe-connect-onboarding-422",
    sources: [
      { sourceKey: "so", quoteCount: 11 },
      { sourceKey: "gh", quoteCount: 7 },
    ],
    quotes: [
      { authorHandle: "connect_dev", sourceKey: "so", engagementValue: 5400, engagementLabel: "rep", quoteText: "Connect onboarding returns a 422 in test mode with no field-level detail.", isWtpSignal: false },
      { authorHandle: "stripe/stripe-node", sourceKey: "gh", engagementValue: 18, engagementLabel: "reactions", quoteText: "The 422 is a missing capability, but the error doesn't say which. Trial and error.", isWtpSignal: false },
      { authorHandle: "platform_ren", sourceKey: "so", engagementValue: 2200, engagementLabel: "rep", quoteText: "Lost an afternoon to a typo'd capability the API wouldn't name.", isWtpSignal: false },
      { authorHandle: "marketplace_dev", sourceKey: "gh", engagementValue: 9, engagementLabel: "reactions", quoteText: "A linter for Connect account params would pay for itself.", isWtpSignal: true, statedPriceUsd: 20 },
    ],
    solutions: [
      { name: "Stripe Connect docs", priceRange: "Free", matchType: "partial", description: "Capability list; no inline validation.", mentionCount: 3 },
    ],
    wtp: { mentionCount: 1, priceMinUsd: 20, priceMaxUsd: 20, medianUsd: 20, note: "One mention; narrow developer-experience gap." },
    personas: [
      { label: "Indie founders", count: 10, percentage: 56 },
      { label: "Engineers at 10–50 person co.", count: 8, percentage: 44 },
    ],
    related: [
      { label: "Stripe webhooks fail silently on Vercel cold starts", targetSlug: "stripe-webhooks-vercel-cold-starts" },
      { label: "Test-mode parity gaps" },
    ],
    frequency: freq(1, 3),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Low", tone: "negative" },
      buildEffort: { value: "Low · 1 wk", tone: "positive" },
      defensibility: { value: "Narrow", tone: "caution" },
      bristlesRead: { verdict: "skip", prose: "DX papercut. Stripe will likely improve the error. Thin wedge." },
    },
  },
  {
    slug: "ses-bounce-resend-dashboard",
    sources: [
      { sourceKey: "gh", quoteCount: 7 },
      { sourceKey: "forum", quoteCount: 5 },
    ],
    quotes: [
      { authorHandle: "deliver_dev", sourceKey: "gh", engagementValue: 16, engagementLabel: "reactions", quoteText: "Bounces pile up in SES but never surface in Resend, so the suppression list rots.", isWtpSignal: false },
      { authorHandle: "resend_forum", sourceKey: "forum", engagementValue: 9, engagementLabel: "replies", quoteText: "Had to wire SNS → my own webhook to reconcile suppressions.", isWtpSignal: true, statedPriceUsd: 25 },
      { authorHandle: "email_ops", sourceKey: "gh", engagementValue: 11, engagementLabel: "reactions", quoteText: "Deliverability dropped before we noticed the dashboard was blind to bounces.", isWtpSignal: false },
      { authorHandle: "smtp_sam", sourceKey: "forum", engagementValue: 4, engagementLabel: "replies", quoteText: "Would pay for a bounce-sync that just keeps the list clean.", isWtpSignal: true, statedPriceUsd: 30 },
    ],
    solutions: [
      { name: "SNS → custom webhook", priceRange: "Free / OSS", matchType: "partial", description: "Reconcile bounces yourself.", mentionCount: 3 },
    ],
    wtp: { mentionCount: 2, priceMinUsd: 25, priceMaxUsd: 30, medianUsd: 27, note: "Two mentions; deliverability-sensitive senders." },
    personas: [
      { label: "Indie founders", count: 7, percentage: 58 },
      { label: "Engineers at 10–50 person co.", count: 5, percentage: 42 },
    ],
    related: [
      { label: "Notion API rate-limits silently throttle", targetSlug: "notion-api-bulk-write-throttle" },
      { label: "Email suppression-list hygiene" },
    ],
    frequency: freq(1, 3),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Medium", tone: "caution" },
      buildEffort: { value: "Low · 1-2 wks", tone: "positive" },
      defensibility: { value: "Thin", tone: "caution" },
      bristlesRead: { verdict: "build-able", prose: "A small bounce-sync could sell to Resend+SES users. Narrow but clean." },
    },
  },
  {
    slug: "vercel-build-cache-monorepo-miss",
    sources: [
      { sourceKey: "gh", quoteCount: 6 },
      { sourceKey: "forum", quoteCount: 3 },
    ],
    quotes: [
      { authorHandle: "mono_dev", sourceKey: "gh", engagementValue: 13, engagementLabel: "reactions", quoteText: "Cache served a stale build because a changed internal package wasn't in the key.", isWtpSignal: false },
      { authorHandle: "vercel_forum", sourceKey: "forum", engagementValue: 7, engagementLabel: "replies", quoteText: "Had to bust the cache manually after a shared-lib change. Scary in prod.", isWtpSignal: false },
      { authorHandle: "turbo_user", sourceKey: "gh", engagementValue: 9, engagementLabel: "reactions", quoteText: "Turbo's graph knows the dep changed; the deploy cache didn't.", isWtpSignal: false },
      { authorHandle: "ci_lead", sourceKey: "forum", engagementValue: 4, engagementLabel: "replies", quoteText: "We now force --no-cache on shared-lib changes. Slow but safe.", isWtpSignal: false },
    ],
    solutions: [
      { name: "Force no-cache on shared changes", priceRange: "Free", matchType: "partial", description: "Bust cache when internal packages change.", mentionCount: 2 },
    ],
    wtp: null,
    personas: [
      { label: "Engineers at 10–50 person co.", count: 6, percentage: 67 },
      { label: "Indie founders", count: 3, percentage: 33 },
    ],
    related: [
      { label: "Monorepo CI cache keys" },
      { label: "Fly.io machine wake-from-zero hits 3.2s p95", targetSlug: "flyio-wake-from-zero-p95" },
    ],
    frequency: freq(1, 2),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "None", tone: "neutral" },
      personaFit: { value: "Low", tone: "negative" },
      buildEffort: { value: "—", tone: "neutral" },
      defensibility: { value: "None", tone: "negative" },
      bristlesRead: { verdict: "skip", prose: "Platform cache bug. Vercel's to fix. Not a product." },
    },
  },
  {
    slug: "appstore-connect-phone-reverify",
    sources: [{ sourceKey: "appstore", quoteCount: 11 }],
    quotes: [
      { authorHandle: "ios_ci_dev", sourceKey: "appstore", rating: 1, quoteText: "Every week App Store Connect forces phone re-verification. CI tokens break constantly.", isWtpSignal: false },
      { authorHandle: "fastlane_user", sourceKey: "appstore", rating: 2, quoteText: "Automation dies weekly. Have to log in by hand and re-verify.", isWtpSignal: false },
      { authorHandle: "mobile_ops", sourceKey: "appstore", rating: 1, quoteText: "No way to extend the session. Apple's policy, no workaround.", isWtpSignal: false },
      { authorHandle: "release_ana", sourceKey: "appstore", rating: 2, quoteText: "Burns 20 minutes every Monday. Just let API keys persist.", isWtpSignal: false },
    ],
    solutions: [
      { name: "App Store Connect API keys", priceRange: "Free", matchType: "partial", description: "Keys help but session still expires.", mentionCount: 3 },
    ],
    wtp: null,
    personas: [
      { label: "Mobile dev", count: 8, percentage: 73 },
      { label: "Agency / contractors", count: 3, percentage: 27 },
    ],
    related: [
      { label: "Expo OTA updates silently fail on iOS 18.4", targetSlug: "expo-ota-ios-18-4" },
      { label: "CI auth for mobile releases" },
    ],
    frequency: freq(1, 2),
    compareCard: {
      validatedDemand: { value: "Emerging", tone: "neutral" },
      hasDirectSolution: { value: "API keys — partial", tone: "caution" },
      personaFit: { value: "Low", tone: "negative" },
      buildEffort: { value: "—", tone: "neutral" },
      defensibility: { value: "None", tone: "negative" },
      bristlesRead: { verdict: "skip", prose: "Apple policy. Nothing to build around it." },
    },
  },
];
