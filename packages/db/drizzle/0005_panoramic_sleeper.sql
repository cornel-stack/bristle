CREATE TABLE "raw_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"content_hash" text NOT NULL,
	"title" text,
	"body" text,
	"url" text,
	"author" text,
	"points" integer,
	"num_comments" integer,
	"source_created_at" timestamp with time zone NOT NULL,
	"raw" jsonb NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_items_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE INDEX "raw_items_source_created_at_idx" ON "raw_items" USING btree ("source","source_created_at");--> statement-breakpoint
CREATE INDEX "raw_items_source_source_id_idx" ON "raw_items" USING btree ("source","source_id");