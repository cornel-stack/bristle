import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (src/ → root)
import { isSourceKey } from "@bristle/shared";
import { closeDb, getDb } from "./client";
import { eq } from "drizzle-orm";
import {
  alertNotifications,
  alertRules,
  categories,
  problems,
  savedCollections,
  userSavedProblems,
  users,
} from "./schema";
import { redactConnectionString } from "./redact";
import { ALERT_NOTIFICATIONS, ALERT_RULES } from "./seed/alerts";
import { CATEGORIES } from "./seed/categories";
import { OTHER_FIXTURES } from "./seed/children";
import { DEMO_USER } from "./seed/demo-user";
import { HERO } from "./seed/hero";
import { PROBLEMS } from "./seed/problems";
import { SAVED_COLLECTIONS } from "./seed/saved";
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

  // --- Saved collections + the real visible Kanban cards (Image 4) ---
  let savedCardCount = 0;
  for (const col of SAVED_COLLECTIONS) {
    const [crow] = await db
      .insert(savedCollections)
      .values({
        userId: demoId,
        name: col.name,
        color: col.color,
        position: col.position,
      })
      .onConflictDoUpdate({
        target: [savedCollections.userId, savedCollections.name],
        set: { color: col.color, position: col.position },
      })
      .returning({ id: savedCollections.id });
    if (!crow) throw new Error(`collection upsert failed: ${col.name}`);
    for (let i = 0; i < col.slugs.length; i++) {
      const slug = col.slugs.at(i);
      if (!slug) continue;
      const problemId = problemIdBySlug.get(slug);
      if (!problemId) throw new Error(`saved: no problem for slug "${slug}"`);
      await db
        .insert(userSavedProblems)
        .values({ userId: demoId, problemId, collectionId: crow.id, position: i })
        .onConflictDoUpdate({
          target: [userSavedProblems.userId, userSavedProblems.problemId],
          set: { collectionId: crow.id, position: i },
        });
      savedCardCount++;
    }
  }
  console.log(
    `seeded ${SAVED_COLLECTIONS.length} collections, ${savedCardCount} saved cards`,
  );

  // --- Alert rules (upsert on name) + notifications (replace-all) ---
  for (const r of ALERT_RULES) {
    await db
      .insert(alertRules)
      .values({ userId: demoId, ...r })
      .onConflictDoUpdate({
        target: [alertRules.userId, alertRules.name],
        set: { ...r },
      });
  }
  await db.delete(alertNotifications).where(eq(alertNotifications.userId, demoId));
  await db.insert(alertNotifications).values(
    ALERT_NOTIFICATIONS.map((n) => ({
      userId: demoId,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      problemId: n.slug ? (problemIdBySlug.get(n.slug) ?? null) : null,
      createdAt: new Date(n.createdAt),
    })),
  );
  const unread = ALERT_NOTIFICATIONS.filter((n) => !n.isRead).length;
  console.log(
    `seeded ${ALERT_RULES.length} alert rules, ${ALERT_NOTIFICATIONS.length} notifications (${unread} unread)`,
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
