import { config } from "dotenv";
config({ path: new URL("../../../.env.local", import.meta.url).pathname }); // repo-root .env.local (src/ → root)
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { redactConnectionString } from "./redact";

// Migrations run against the DIRECT/session connection (port 5432) — the migrator
// needs advisory locks + prepared statements the Transaction pooler lacks.
const url = process.env.DATABASE_URL_DIRECT;
if (!url) throw new Error("DATABASE_URL_DIRECT is not set");

let sql: ReturnType<typeof postgres> | undefined;
try {
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
} catch (err) {
  // Redact: never echo the raw connection string (it carries the password).
  console.error(
    `migration failed for ${redactConnectionString(url)}:`,
    err instanceof Error ? err.message : err,
  );
  process.exitCode = 1;
} finally {
  await sql?.end();
}
