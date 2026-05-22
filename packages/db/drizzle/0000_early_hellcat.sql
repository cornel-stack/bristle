-- hand-edited after db:generate: prepended CREATE EXTENSION IF NOT EXISTS vector (see plan §2). Expected drift for db:generate --check.
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"momentum_pct" integer NOT NULL,
	"sparkline" integer[] NOT NULL,
	"top_quote" text NOT NULL,
	"quote_source" text NOT NULL,
	"sources" text[] NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(1536),
	CONSTRAINT "problems_slug_unique" UNIQUE("slug")
);
