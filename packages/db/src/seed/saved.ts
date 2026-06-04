// Saved Kanban (Image 4). The headline "28 of 50" is a usage_meters literal (T017);
// the actually-seeded cards are the ones VISIBLE in the design, mapped to real
// fixtures. With only 15 fixtures (and unique (user, problem)), column counts read
// smaller than the design's 8/5/11/4 headers — the inherent 15-fixture ceiling for
// Tier 4 (founder-accepted).
export interface CollectionSeed {
  name: string;
  color: string;
  position: number;
  slugs: string[]; // ordered = Kanban card order
}

export const SAVED_COLLECTIONS: CollectionSeed[] = [
  {
    name: "Next product",
    color: "red",
    position: 0,
    slugs: [
      "stripe-webhooks-vercel-cold-starts",
      "llm-streaming-cdn-buffering",
      "astro-webhook-signature-mismatch",
    ],
  },
  {
    name: "Q3 brief candidates",
    color: "green",
    position: 1,
    slugs: ["pgvector-index-degradation-2m", "notion-api-bulk-write-throttle"],
  },
  {
    name: "Read later",
    color: "purple",
    position: 2,
    slugs: [
      "flyio-wake-from-zero-p95",
      "ses-bounce-resend-dashboard",
      "appstore-connect-phone-reverify",
    ],
  },
  {
    name: "For Jules to review",
    color: "blue",
    position: 3,
    slugs: ["cursor-agent-multifile-context"],
  },
];
