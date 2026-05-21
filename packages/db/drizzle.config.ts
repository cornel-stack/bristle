import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// drizzle-kit (generate / migrate / studio) uses the DIRECT/session connection
// (DATABASE_URL_DIRECT, port 5432) — never the Transaction pooler — because the
// migrator needs advisory locks + prepared statements the pooler lacks.
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
  strict: true,
  verbose: true,
});
