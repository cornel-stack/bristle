-- hand-edited after db:generate: prepended CREATE EXTENSION IF NOT EXISTS vector so
-- this migration is SELF-CONTAINED when conftest applies it standalone (the 0000
-- precedent). pgvector is already enabled on dev+prod, so this is an idempotent
-- no-op there; it only matters for a fresh test container. Expected drift for
-- db:generate --check.
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "processed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_item_id" uuid NOT NULL,
	"label" text NOT NULL,
	"reason" text,
	"confidence" real,
	"forced_keep" boolean DEFAULT false NOT NULL,
	"normalized_text" text,
	"embedding" vector(1536),
	"classifier_model" text,
	"prompt_version" text,
	"embedding_model" text,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_items_raw_item_id_unique" UNIQUE("raw_item_id")
);
--> statement-breakpoint
ALTER TABLE "processed_items" ADD CONSTRAINT "processed_items_raw_item_id_raw_items_id_fk" FOREIGN KEY ("raw_item_id") REFERENCES "public"."raw_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "processed_items_embedding_hnsw_idx" ON "processed_items" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);