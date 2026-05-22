import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (src/ → root)
import { getDb } from "./client";
import { problems, type NewProblem } from "./schema";
import { redactConnectionString } from "./redact";

// Canonical seed — mirrors the Slice 1.3 fixture. Upsert on the unique slug so
// re-running is idempotent (insert first time, update thereafter). embedding null.
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

try {
  await getDb()
    .insert(problems)
    .values(STRIPE)
    .onConflictDoUpdate({ target: problems.slug, set: STRIPE });
  console.log(`seeded problem: ${STRIPE.slug}`);
} catch (err) {
  console.error(
    `seed failed for ${redactConnectionString(process.env.DATABASE_URL ?? "")}:`,
    err instanceof Error ? err.message : err,
  );
  process.exitCode = 1;
}
