import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Migrations run against the DIRECT/session connection (port 5432) — the migrator
// needs advisory locks + prepared statements the Transaction pooler lacks.
const url = process.env.DATABASE_URL_DIRECT;
if (!url) throw new Error("DATABASE_URL_DIRECT is not set");

const sql = postgres(url, { max: 1 });

await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
await sql.end();

console.log("migrations applied");
