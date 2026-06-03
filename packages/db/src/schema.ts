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

import { users } from "./auth-schema";

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

// === Slice 016 — catalog + dashboard ========================================

// Canonical product categories (the 8 §4.1a-tinted keys this slice — D9). tint_*
// reference existing design-token names; problem_count is a displayed literal
// (NOT count(*) over fixtures); momentum_series holds the dashboard weekly chart.
export const categories = pgTable("categories", {
  id: pk(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  tintBgKey: text("tint_bg_key"),
  tintFgKey: text("tint_fg_key"),
  problemCount: integer("problem_count").notNull().default(0),
  isCustom: boolean("is_custom").notNull().default(false),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  momentumSeries: jsonb("momentum_series"),
  position: integer("position").notNull().default(0),
});

// Per-user dashboard singletons (e.g. weekly_momentum caption + series). Typed at
// the read boundary by WeeklyMomentumSchema (packages/shared).
export const dashboardFixtures = pgTable(
  "dashboard_fixtures",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (t) => [unique().on(t.userId, t.key)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type DashboardFixture = typeof dashboardFixtures.$inferSelect;
export type NewDashboardFixture = typeof dashboardFixtures.$inferInsert;

// === Slice 016 — user-scoped product tables =================================
// The demo user (D5) owns all of these; the Tier-5 product writes them per real
// user later. No tier-enforcement logic this slice (usage_meters are displays).

export const savedCollections = pgTable(
  "saved_collections",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    position: integer("position").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.name)],
);

export const userSavedProblems = pgTable(
  "user_saved_problems",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id").references(() => savedCollections.id, {
      onDelete: "set null",
    }),
    position: integer("position").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.problemId)],
);

export const alertRules = pgTable(
  "alert_rules",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    categoryKey: text("category_key"),
    ruleType: text("rule_type").notNull(), // momentum | new | wtp | threshold
    threshold: integer("threshold"),
    channels: text("channels").array(), // email | slack | webhook | in-app
    enabled: boolean("enabled").notNull().default(true),
    firedCount: integer("fired_count").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.name)],
);

export const alertNotifications = pgTable("alert_notifications", {
  id: pk(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // momentum | new | wtp | digest | threshold | weekly
  title: text("title").notNull(),
  body: text("body"),
  problemId: uuid("problem_id").references(() => problems.id, {
    onDelete: "set null",
  }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Typed activity entries. user_id null = a global event (e.g. "3 problems added
// in Auth & SSO"); set = a user event (e.g. "saved pgvector").
export const problemActivityLog = pgTable("problem_activity_log", {
  id: pk(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  problemId: uuid("problem_id").references(() => problems.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(), // threshold_crossed | quotes_added | problem_added | saved
  title: text("title").notNull(),
  deltaLabel: text("delta_label"), // "+312%" | "NEW" | "SAVED"
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Per-user metric/used/quota for tier displays ("28 of 50"). Seeded values only.
export const usageMeters = pgTable(
  "usage_meters",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(),
    used: integer("used").notNull(),
    quota: integer("quota"),
    deltaPct: integer("delta_pct"),
    secondaryLabel: text("secondary_label"),
  },
  (t) => [unique().on(t.userId, t.metric)],
);

export type SavedCollection = typeof savedCollections.$inferSelect;
export type NewSavedCollection = typeof savedCollections.$inferInsert;
export type UserSavedProblem = typeof userSavedProblems.$inferSelect;
export type NewUserSavedProblem = typeof userSavedProblems.$inferInsert;
export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type AlertNotification = typeof alertNotifications.$inferSelect;
export type NewAlertNotification = typeof alertNotifications.$inferInsert;
export type ProblemActivity = typeof problemActivityLog.$inferSelect;
export type NewProblemActivity = typeof problemActivityLog.$inferInsert;
export type UsageMeter = typeof usageMeters.$inferSelect;
export type NewUsageMeter = typeof usageMeters.$inferInsert;

// Auth.js v5 tables + custom password-reset table (slice 013). Re-exported here
// so drizzle-kit (schema: "./src/schema.ts") picks them up for migration
// generation, and so @auth/drizzle-adapter + apps/web import from one surface.
export * from "./auth-schema";
