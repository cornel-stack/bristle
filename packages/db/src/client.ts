import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Runtime client — Supabase Transaction pooler via DATABASE_URL.
// `prepare: false` is REQUIRED: the pooler does not support prepared statements.
// Memoized as a module singleton so server invocations reuse one pool.
let cached: ReturnType<typeof drizzle<typeof schema>> | undefined;
let pool: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  pool = postgres(url, { prepare: false });
  cached = drizzle(pool, { schema });
  return cached;
}

// Close the connection pool so a one-shot script (seed/probe) can exit cleanly —
// postgres-js keeps the socket alive otherwise, hanging the process. No-op for
// long-lived server processes that never call it.
export async function closeDb(): Promise<void> {
  await pool?.end({ timeout: 5 });
  pool = undefined;
  cached = undefined;
}
