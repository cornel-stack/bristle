import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (src/ → root)
import { getDb } from "./client";
import { problems, type NewProblem } from "./schema";
import { redactConnectionString } from "./redact";

// Canonical seed — four problems (payments hero + the three sample-row cards).
// Upsert on the unique slug so re-running is idempotent. embedding null.
const STRIPE: NewProblem = {
  slug: "stripe-webhooks-vercel-cold-starts",
  title: "Stripe webhooks fail silently on Vercel cold starts",
  category: "payments",
  momentumPct: 312,
  sparkline: [4, 5, 5, 6, 7, 6, 8, 9, 8, 11, 12, 14, 16, 19],
  topQuote:
    "Retries were dropped during cold starts and we lost reconciled revenue for two days before noticing.",
  quoteSource: "gh",
  sources: ["gh", "hn", "so"],
  lastSeenAt: new Date("2026-05-22T00:00:00Z"),
};

const LLM_STREAMING: NewProblem = {
  slug: "llm-streaming-cdn-buffering",
  title: "LLM streaming chokes through CDN buffering",
  category: "ai-ml",
  momentumPct: 184,
  sparkline: [6, 7, 7, 8, 9, 8, 10, 11, 12, 13, 15, 17, 19, 22],
  topQuote: "Cloudflare buffers SSE despite explicit headers. Three weeks to find this.",
  quoteSource: "hn",
  sources: ["hn", "so", "gh"],
  lastSeenAt: new Date("2026-05-21T22:00:00Z"),
};

const EXPO_OTA: NewProblem = {
  slug: "expo-ota-ios-18-4",
  title: "Expo OTA updates silently fail on iOS 18.4",
  category: "mobile",
  momentumPct: 96,
  sparkline: [3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 12, 14],
  topQuote: "Users on 18.4 stuck on last build. No error, no telemetry, no acknowledgment.",
  quoteSource: "gh",
  sources: ["gh", "ap", "so"],
  lastSeenAt: new Date("2026-05-21T20:00:00Z"),
};

const PGVECTOR: NewProblem = {
  slug: "pgvector-index-degradation-2m",
  title: "pgvector indexes degrade past 2M rows",
  category: "devtools",
  momentumPct: 72,
  sparkline: [5, 6, 6, 7, 8, 7, 9, 9, 10, 11, 12, 12, 13, 15],
  topQuote: "Hybrid search query went from 80ms to 4.2s once we crossed 2M embeddings.",
  quoteSource: "gh",
  sources: ["gh", "hn", "so"],
  lastSeenAt: new Date("2026-05-21T18:00:00Z"),
};

const SEED: NewProblem[] = [STRIPE, LLM_STREAMING, EXPO_OTA, PGVECTOR];

try {
  const db = getDb();
  for (const row of SEED) {
    await db
      .insert(problems)
      .values(row)
      .onConflictDoUpdate({ target: problems.slug, set: row });
  }
  console.log(`seeded ${SEED.length} problems: ${SEED.map((r) => r.slug).join(", ")}`);
} catch (err) {
  console.error(
    `seed failed for ${redactConnectionString(process.env.DATABASE_URL ?? "")}:`,
    err instanceof Error ? err.message : err,
  );
  process.exitCode = 1;
}
