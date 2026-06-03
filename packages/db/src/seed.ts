import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (src/ → root)
import { isSourceKey } from "@bristle/shared";
import { closeDb, getDb } from "./client";
import { categories, problems, users } from "./schema";
import { redactConnectionString } from "./redact";
import { CATEGORIES } from "./seed/categories";
import { OTHER_FIXTURES } from "./seed/children";
import { DEMO_USER } from "./seed/demo-user";
import { HERO } from "./seed/hero";
import { PROBLEMS } from "./seed/problems";
import { seedProblemChildren } from "./seed/types";

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

  // --- Hero (Stripe webhooks) full depth: child rows + compare_card ---
  await seedProblemChildren(db, HERO, problemIdBySlug);
  console.log("seeded hero children + compare_card");

  // --- Other 14: compact-but-complete child rows + compare_card each ---
  for (const fx of OTHER_FIXTURES) {
    await seedProblemChildren(db, fx, problemIdBySlug);
  }
  console.log(`seeded ${OTHER_FIXTURES.length} non-hero fixtures' children`);

  // --- Demo user (fixed; upsert on email; watches 7 categories) ---
  await db
    .insert(users)
    .values(DEMO_USER)
    .onConflictDoUpdate({ target: users.email, set: DEMO_USER });
  const demoId = DEMO_USER.id;
  if (!demoId) throw new Error("demo user id missing");
  console.log(
    `seeded demo user (${DEMO_USER.watchedCategories?.length ?? 0} watched categories)`,
  );
}

try {
  await seed();
} catch (err) {
  console.error(
    `seed failed for ${redactConnectionString(process.env.DATABASE_URL ?? "")}:`,
    err instanceof Error ? err.message : err,
  );
  process.exitCode = 1;
} finally {
  await closeDb(); // let the one-shot script exit + flush stdout
}
