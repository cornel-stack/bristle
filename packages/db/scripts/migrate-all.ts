import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (scripts/ → root)
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { redactConnectionString } from "../src/redact";

// The two-project tax (Decision 1): once dev and prod are separate Supabase
// projects, a migration must reach BOTH or neither — a half-applied schema is the
// failure mode this command exists to prevent. It applies the SAME ./drizzle
// chain to dev AND prod, against each project's DIRECT/session URL (port 5432 —
// the migrator needs advisory locks the pooler lacks).
//
//   DATABASE_URL_DIRECT_DEV  → dev project   (set in Batch C when the dev project exists)
//   DATABASE_URL_DIRECT      → prod project  (the existing var)
//
// FAIL-FAST: if EITHER URL is missing we refuse to run, so you can't silently
// apply to only one and drift the other. (Two separate databases can't share one
// transaction, so this isn't atomic across them — the per-target apply is atomic,
// and the raw_items drift test on each DB is the backstop that catches a partial
// apply.) Authored in Batch A (T005); first RUN is Batch C (T023), once the dev
// project exists. NOT run here — no database is touched at authoring time.
const targets = [
  { label: "dev", url: process.env.DATABASE_URL_DIRECT_DEV },
  { label: "prod", url: process.env.DATABASE_URL_DIRECT },
] as const;

const missing = targets.filter((t) => !t.url).map((t) => t.label);
if (missing.length > 0) {
  console.error(
    `Refusing to migrate: missing ${missing
      .map((l) => (l === "dev" ? "DATABASE_URL_DIRECT_DEV" : "DATABASE_URL_DIRECT"))
      .join(" + ")}. ` +
      `Both dev and prod must be set so a migration can't be half-applied.`,
  );
  process.exit(1);
}

for (const { label, url } of targets) {
  let sql: ReturnType<typeof postgres> | undefined;
  try {
    sql = postgres(url!, { max: 1 });
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    console.log(`migrations applied → ${label}`);
  } catch (err) {
    console.error(
      `migration failed for ${label} (${redactConnectionString(url!)}):`,
      err instanceof Error ? err.message : err,
    );
    process.exitCode = 1;
  } finally {
    await sql?.end();
  }
}
