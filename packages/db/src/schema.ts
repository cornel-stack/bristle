import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// Minimal problems table — one row renders one ProblemCardFull (see contracts/).
// `slug` is the stable, URL-safe upsert key (also the future /problems/[slug] route).
// `embedding` exercises pgvector end to end; unpopulated this slice.
export const problems = pgTable("problems", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  momentumPct: integer("momentum_pct").notNull(),
  sparkline: integer("sparkline").array().notNull(),
  topQuote: text("top_quote").notNull(),
  quoteSource: text("quote_source").notNull(),
  sources: text("sources").array().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  embedding: vector("embedding", { dimensions: 1536 }),
  // Slice 016 (migration 0004) — additive product fields. ALL nullable or
  // defaulted: the live Tier-2 landing hero + /problems/[slug] read only the
  // columns above, so extending here cannot regress them. The 4 existing rows'
  // new fields are backfilled by the seed (T010), not the migration.
  synthesis: text("synthesis"),
  demandStatus: text("demand_status"),
  momentumBucket: text("momentum_bucket"),
  mentionCount60d: integer("mention_count_60d"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  compareCard: jsonb("compare_card"),
});

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;

// Auth.js v5 tables + custom password-reset table (slice 013). Re-exported here
// so drizzle-kit (schema: "./src/schema.ts") picks them up for migration
// generation, and so @auth/drizzle-adapter + apps/web import from one surface.
export * from "./auth-schema";
