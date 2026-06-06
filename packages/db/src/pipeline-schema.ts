import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

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

// === Slice 5.2 (migration 0006) — derived classification + embedding. raw_items
// stays IMMUTABLE; this is the ONLY table 5.2 adds, one row per processed
// raw_item. Additive — touches no app table. Drizzle stays the single migration
// authority (Decision 1); the Python processor reads/writes via asyncpg.
//
// KEEP/DROP IS DERIVED (`label != 'noise'`) — never stored separately (FR-001/007).
// The four keep-types are best-effort secondary signal for 5.3/5.4; the DoD gates
// the noise-vs-keep boundary only.
export const processedItems = pgTable(
  "processed_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // THE IDEMPOTENCY KEY (FR-004/006). UNIQUE → exactly one verdict per raw item;
    // the processor writes INSERT … ON CONFLICT (raw_item_id) DO NOTHING, so
    // overlapping / retried / concurrent runs cannot double-write. CASCADE so a
    // deleted raw item can't orphan a verdict.
    rawItemId: uuid("raw_item_id")
      .notNull()
      .unique()
      .references(() => rawItems.id, { onDelete: "cascade" }),
    // The 5-way classifier label (5.2-OD-2: `text`, NOT a pg enum — a new label
    // needs no ALTER TYPE; simpler contract/drift introspection): complaint / bug /
    // feature-request / wish / noise. Keep/drop = (label != 'noise').
    label: text("label").notNull(),
    reason: text("reason"),
    confidence: real("confidence"),
    // FR-011: true when a sub-threshold confidence overrode a 'noise' call to keep
    // (bias against false-drops). forced_keep items STILL embed (they're kept).
    forcedKeep: boolean("forced_keep").notNull().default(false),
    // The normalized text that was classified/embedded (the embedded input).
    normalizedText: text("normalized_text"),
    // 1536-dim embedding — NULL for 'noise' (only kept items embed, FR-002); width
    // matches the existing problems.embedding vector(1536) (A9, locked).
    embedding: vector("embedding", { dimensions: 1536 }),
    // Reproducibility metadata (FR-013) — enables selective re-processing when the
    // classifier model, the prompt/rubric, or the embedding model changes.
    classifierModel: text("classifier_model"),
    promptVersion: text("prompt_version"),
    embeddingModel: text("embedding_model"),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // HNSW (cosine) for 5.3's nearest-neighbor joins — incremental-friendly
    // (5.2-OD-5: m=16, ef_construction=64; vector_cosine_ops).
    index("processed_items_embedding_hnsw_idx")
      .using("hnsw", t.embedding.op("vector_cosine_ops"))
      .with({ m: 16, ef_construction: 64 }),
  ],
);

export type ProcessedItem = typeof processedItems.$inferSelect;
export type NewProcessedItem = typeof processedItems.$inferInsert;
