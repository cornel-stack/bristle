// One-off gate probe: verify the dev DB is reachable and the 5 slice-013 auth
// tables exist with the expected shape. Run: pnpm --filter @bristle/db db:probe
import "dotenv/config";
import postgres from "postgres";

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) {
  console.error("No DATABASE_URL_DIRECT / DATABASE_URL set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, idle_timeout: 5, connect_timeout: 10 });

const EXPECTED = [
  "users",
  "accounts",
  "sessions",
  "verificationTokens",
  "password_reset_tokens",
];

try {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('users','accounts','sessions','verificationTokens','password_reset_tokens')
    ORDER BY table_name
  `;
  const found = tables.map((r) => r.table_name as string);
  console.log("TABLES:", found.length, found);

  // Column counts per table (expected: users 8 / accounts 11 / sessions 3 /
  // verificationTokens 3 / password_reset_tokens 6).
  for (const t of EXPECTED) {
    const cols = await sql`
      SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${t}
    `;
    console.log(`COLS ${t}: ${cols[0].n}`);
  }

  // FKs with ON DELETE CASCADE on the 3 user-FK tables.
  const fks = await sql`
    SELECT tc.table_name, rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      AND tc.table_name IN ('accounts','sessions','password_reset_tokens')
    ORDER BY tc.table_name
  `;
  console.log("FKS:", fks.map((r) => `${r.table_name}:${r.delete_rule}`));

  // Index count across the 5 tables.
  const idx = await sql`
    SELECT count(*)::int AS n FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('users','accounts','sessions','verificationTokens','password_reset_tokens')
  `;
  console.log("INDEXES:", idx[0].n);

  const missing = EXPECTED.filter((t) => !found.includes(t));
  if (missing.length) {
    console.error("MISSING:", missing);
    process.exit(2);
  }
  console.log("OK — all 5 auth tables present.");
} catch (err) {
  console.error("DB probe failed:", (err as Error).message);
  process.exit(3);
} finally {
  await sql.end();
}
