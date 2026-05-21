import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Runtime client — Supabase Transaction pooler via DATABASE_URL.
// `prepare: false` is REQUIRED: the pooler does not support prepared statements.
// Memoized as a module singleton so server invocations reuse one pool.
let cached: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { prepare: false });
  cached = drizzle(client, { schema });
  return cached;
}
