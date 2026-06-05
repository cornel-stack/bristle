import { config } from "dotenv";
config({ path: new URL("../../.env.local", import.meta.url).pathname }); // repo-root .env.local (package root → root)
import { defineConfig } from "drizzle-kit";

// drizzle-kit (generate / migrate / studio) uses the DIRECT/session connection
// (DATABASE_URL_DIRECT, port 5432) — never the Transaction pooler — because the
// migrator needs advisory locks + prepared statements the pooler lacks.
export default defineConfig({
  // Array so the pipeline-namespaced raw_items (pipeline-schema.ts) is seen by
  // drizzle-kit alongside the app schema, WITHOUT mixing it into the app barrel.
  // The migration diff is additive: 0000–0004 already cover every app table, so
  // the only new object is raw_items → 0005 creates just that.
  schema: ["./src/schema.ts", "./src/pipeline-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
  strict: true,
  verbose: true,
});
