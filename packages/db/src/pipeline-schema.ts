import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// === Slice 5.1 (migration 0005) — pipeline-namespaced, separate from the app's
// problems/categories. The ONLY table this slice adds. The Python HN ingester
// (apps/pipeline) reads/writes it via asyncpg; Drizzle stays the single migration
// authority (Decision 2). Additive — touches no app table.
//
// `raw_items` is an append-only capture of one ingested source item BEFORE any
// classification (5.2) or clustering (5.3). Multi-source from day one via `source`
// (FR-003): 'hn' now; 'github' / 'stackoverflow' arrive in 5.6/5.7 on this same shape.
export const rawItems = pgTable(
  "raw_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // Source discriminator — 'hn' for this slice (FR-003).
    source: text("source").notNull(),
    // The upstream item id (the Algolia objectID for HN). Natural key for debugging.
    sourceId: text("source_id").notNull(),
    // THE DEDUP KEY (FR-004, Decision 4). UNIQUE → the dedup guarantee is a DB
    // invariant; the ingester writes with INSERT … ON CONFLICT (content_hash) DO
    // NOTHING, so overlapping / retried / double-fired runs cannot double-write.
    //
    // Derivation (computed in Python, apps/pipeline/ingest/hn.py — Batch B):
    //   content_hash = sha256( norm(source | source_id | title | url | body) )
    // Hashed over STABLE, identity-bearing fields ONLY. It deliberately EXCLUDES
    // volatile signals (`points`, `num_comments`) and ALL ingest metadata
    // (`ingested_at`, no fetched-at, no run id) — so the SAME item re-fetched via
    // the max(source_created_at) − B lookback overlap produces the SAME hash and
    // dedups, instead of inserting a near-duplicate.
    contentHash: text("content_hash").notNull().unique(),
    title: text("title"),
    body: text("body"), // story/comment text; null for link-only posts
    url: text("url"), // external link; null for Ask HN
    author: text("author"),
    // Volatile engagement signals — NOT part of content_hash (see above).
    points: integer("points"),
    numComments: integer("num_comments"),
    // The original upstream post time. THE WATERMARK COLUMN: the ingester derives
    // its fetch window from max(source_created_at) − B (Decision 4, OD-1). NOT
    // ingest time — this is the item's own created_at.
    sourceCreatedAt: timestamp("source_created_at", { withTimezone: true }).notNull(),
    // Full upstream payload, for lossless reprocessing in 5.2+.
    raw: jsonb("raw").notNull(),
    // When WE captured the row (capture metadata, never part of the hash).
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Watermark queries: max(source_created_at) WHERE source=… (Decision 4).
    index("raw_items_source_created_at_idx").on(t.source, t.sourceCreatedAt),
    // Natural-key lookups/debugging (non-unique; source_id is folded into the hash).
    index("raw_items_source_source_id_idx").on(t.source, t.sourceId),
  ],
);

export type RawItem = typeof rawItems.$inferSelect;
export type NewRawItem = typeof rawItems.$inferInsert;
