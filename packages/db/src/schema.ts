import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
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

// === Slice 016 (migration 0004) — problem-scoped child tables ===============
// Relational/queried evidence data (page-2 tabs, page-3 facets, page-6 metrics).
// Fixture-only this slice; the Tier-5 pipeline writes the same shapes later.

const pk = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);

// One complaint citation. Threaded posts carry engagement_value/label; App Store
// reviews carry `rating` (stars) instead. WTP-flagged rows carry stated_price_usd.
export const problemQuotes = pgTable("problem_quotes", {
  id: pk(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  authorHandle: text("author_handle").notNull(),
  sourceKey: text("source_key").notNull(),
  engagementValue: integer("engagement_value"),
  engagementLabel: text("engagement_label"),
  rating: integer("rating"),
  quoteText: text("quote_text").notNull(),
  sourceUrl: text("source_url"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  isWtpSignal: boolean("is_wtp_signal").notNull().default(false),
  statedPriceUsd: integer("stated_price_usd"),
  position: integer("position").notNull().default(0),
});

// Per-source quote counts (drives the page-2 donut + the card/table badges).
export const problemSources = pgTable("problem_sources", {
  id: pk(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  sourceKey: text("source_key").notNull(),
  quoteCount: integer("quote_count").notNull(),
});

export const existingSolutions = pgTable("existing_solutions", {
  id: pk(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceRange: text("price_range"),
  matchType: text("match_type").notNull(), // direct | adjacent | partial
  description: text("description"),
  mentionCount: integer("mention_count"),
  position: integer("position").notNull().default(0),
});

// One aggregate row per problem (absent row = genuine "0 WTP", distinct from 0).
export const wtpSignals = pgTable(
  "wtp_signals",
  {
    id: pk(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    mentionCount: integer("mention_count").notNull(),
    priceMinUsd: integer("price_min_usd"),
    priceMaxUsd: integer("price_max_usd"),
    medianUsd: integer("median_usd"),
    note: text("note"),
  },
  (t) => [unique().on(t.problemId)],
);

export const problemPersonas = pgTable("problem_personas", {
  id: pk(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  count: integer("count").notNull(),
  percentage: integer("percentage"),
  position: integer("position").notNull().default(0),
});

// 90-day mention series (page-2 chart + sparkline source); one point may flag the
// validation-threshold crossing. This is what the Tier-5.9 pipeline writes.
export const problemFrequencyPoints = pgTable("problem_frequency_points", {
  id: pk(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  observedOn: date("observed_on").notNull(),
  mentionCount: integer("mention_count").notNull(),
  isThresholdMarker: boolean("is_threshold_marker").notNull().default(false),
});

// Related-problem links. May point at a seeded problem (related_problem_id) OR be
// a label-only link to an unseeded problem (target_slug/label only) — see D8.
export const problemRelated = pgTable("problem_related", {
  id: pk(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  relatedProblemId: uuid("related_problem_id").references(() => problems.id, {
    onDelete: "set null",
  }),
  label: text("label").notNull(),
  targetSlug: text("target_slug"),
  position: integer("position").notNull().default(0),
});

export type ProblemQuote = typeof problemQuotes.$inferSelect;
export type NewProblemQuote = typeof problemQuotes.$inferInsert;
export type ProblemSource = typeof problemSources.$inferSelect;
export type NewProblemSource = typeof problemSources.$inferInsert;
export type ExistingSolution = typeof existingSolutions.$inferSelect;
export type NewExistingSolution = typeof existingSolutions.$inferInsert;
export type WtpSignal = typeof wtpSignals.$inferSelect;
export type NewWtpSignal = typeof wtpSignals.$inferInsert;
export type ProblemPersona = typeof problemPersonas.$inferSelect;
export type NewProblemPersona = typeof problemPersonas.$inferInsert;
export type ProblemFrequencyPoint = typeof problemFrequencyPoints.$inferSelect;
export type NewProblemFrequencyPoint =
  typeof problemFrequencyPoints.$inferInsert;
export type ProblemRelated = typeof problemRelated.$inferSelect;
export type NewProblemRelated = typeof problemRelated.$inferInsert;

// Auth.js v5 tables + custom password-reset table (slice 013). Re-exported here
// so drizzle-kit (schema: "./src/schema.ts") picks them up for migration
// generation, and so @auth/drizzle-adapter + apps/web import from one surface.
export * from "./auth-schema";
