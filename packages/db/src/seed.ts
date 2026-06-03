import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (src/ → root)
import { getDb } from "./client";
import { categories } from "./schema";
import { redactConnectionString } from "./redact";
import { CATEGORIES } from "./seed/categories";

// Slice 016 fixtures seed. Idempotent (D6): natural-key upsert where a key exists;
// replace-children for unkeyed lists. Run: pnpm --filter @bristle/db db:seed.
// Order matters (FKs): categories → problems → problem children → (Batch C) demo
// user + user-scoped fixtures.
async function seed() {
  const db = getDb();

  // --- Categories (upsert on key) ---
  for (const c of CATEGORIES) {
    await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({ target: categories.key, set: c });
  }
  console.log(`seeded ${CATEGORIES.length} categories`);
}

try {
  await seed();
} catch (err) {
  console.error(
    `seed failed for ${redactConnectionString(process.env.DATABASE_URL ?? "")}:`,
    err instanceof Error ? err.message : err,
  );
  process.exitCode = 1;
}
