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
// REFUSE-BOTH-OR-NEITHER. Two failure modes can half-apply: (1) a URL is MISSING,
// (2) a target is UNREACHABLE (DNS flake, paused project, wrong host). We guard
// both: first require both URLs, then PRE-FLIGHT a connection to each — if either
// can't be reached we abort BEFORE applying to anyone, so prod is never migrated
// while dev silently lags (or vice-versa). Two databases can't share a
// transaction, so this isn't atomic across them; the pre-flight removes the
// realistic failure, migrations are idempotent (a retry completes a laggard), and
// the raw_items drift test on each DB is the final backstop.
//   DATABASE_URL_DIRECT_DEV  → dev project (session pooler 5432)
//   DATABASE_URL_DIRECT      → prod project (session pooler 5432)
const targets = [
  { label: "dev", env: "DATABASE_URL_DIRECT_DEV", url: process.env.DATABASE_URL_DIRECT_DEV },
  { label: "prod", env: "DATABASE_URL_DIRECT", url: process.env.DATABASE_URL_DIRECT },
] as const;

const missing = targets.filter((t) => !t.url);
if (missing.length > 0) {
  console.error(
    `Refusing to migrate: missing ${missing.map((t) => t.env).join(" + ")}. ` +
      `Both dev and prod must be set so a migration can't be half-applied.`,
  );
  process.exit(1);
}

// Pre-flight: a connection must succeed for EVERY target before any apply.
const unreachable: string[] = [];
for (const { label, url } of targets) {
  let sql: ReturnType<typeof postgres> | undefined;
  try {
    sql = postgres(url!, { max: 1, connect_timeout: 10 });
    await sql`select 1`;
  } catch (err) {
    unreachable.push(`${label} (${redactConnectionString(url!)}): ${err instanceof Error ? err.message : err}`);
  } finally {
    await sql?.end({ timeout: 3 });
  }
}
if (unreachable.length > 0) {
  console.error("Refusing to migrate — unreachable target(s), aborting before ANY apply:");
  for (const u of unreachable) console.error(`  - ${u}`);
  process.exit(1);
}

// Both reachable → apply the chain to each.
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
