import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (src/ → root)
import { isSourceKey } from "@bristle/shared";
import { getDb } from "./client";
import { categories, problems } from "./schema";
import { redactConnectionString } from "./redact";
import { CATEGORIES } from "./seed/categories";
import { PROBLEMS } from "./seed/problems";

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

  // --- Problems (upsert on slug; backfills the 4 pre-existing rows in place) ---
  // Validate every source key against the registry first — no off-registry key
  // (e.g. producthunt/googleplay) can ever land in a fixture.
  const problemIdBySlug = new Map<string, string>();
  for (const p of PROBLEMS) {
    for (const key of p.sources) {
      if (!isSourceKey(key)) {
        throw new Error(`problem "${p.slug}": invalid source key "${key}"`);
      }
    }
    const [row] = await db
      .insert(problems)
      .values(p)
      .onConflictDoUpdate({ target: problems.slug, set: p })
      .returning({ id: problems.id, slug: problems.slug });
    if (!row) throw new Error(`problem upsert returned no row for "${p.slug}"`);
    problemIdBySlug.set(row.slug, row.id);
  }
  console.log(`seeded ${PROBLEMS.length} problems (${problemIdBySlug.size} ids)`);
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
