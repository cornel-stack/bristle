CREATE TABLE "alert_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"problem_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category_key" text,
	"rule_type" text NOT NULL,
	"threshold" integer,
	"channels" text[],
	"enabled" boolean DEFAULT true NOT NULL,
	"fired_count" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "alert_rules_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"tint_bg_key" text,
	"tint_fg_key" text,
	"problem_count" integer DEFAULT 0 NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"momentum_series" jsonb,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "dashboard_fixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "dashboard_fixtures_user_id_key_unique" UNIQUE("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "existing_solutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_range" text,
	"match_type" text NOT NULL,
	"description" text,
	"mention_count" integer,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"problem_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"delta_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_frequency_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"observed_on" date NOT NULL,
	"mention_count" integer NOT NULL,
	"is_threshold_marker" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"label" text NOT NULL,
	"count" integer NOT NULL,
	"percentage" integer,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"author_handle" text NOT NULL,
	"source_key" text NOT NULL,
	"engagement_value" integer,
	"engagement_label" text,
	"rating" integer,
	"quote_text" text NOT NULL,
	"source_url" text,
	"posted_at" timestamp with time zone,
	"is_wtp_signal" boolean DEFAULT false NOT NULL,
	"stated_price_usd" integer,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_related" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"related_problem_id" uuid,
	"label" text NOT NULL,
	"target_slug" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"source_key" text NOT NULL,
	"quote_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "saved_collections_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "usage_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"used" integer NOT NULL,
	"quota" integer,
	"delta_pct" integer,
	"secondary_label" text,
	CONSTRAINT "usage_meters_user_id_metric_unique" UNIQUE("user_id","metric")
);
--> statement-breakpoint
CREATE TABLE "user_saved_problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"collection_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_saved_problems_user_id_problem_id_unique" UNIQUE("user_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "wtp_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"mention_count" integer NOT NULL,
	"price_min_usd" integer,
	"price_max_usd" integer,
	"median_usd" integer,
	"note" text,
	CONSTRAINT "wtp_signals_problem_id_unique" UNIQUE("problem_id")
);
--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "synthesis" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "demand_status" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "momentum_bucket" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "mention_count_60d" integer;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "first_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "compare_card" jsonb;--> statement-breakpoint
ALTER TABLE "alert_notifications" ADD CONSTRAINT "alert_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_notifications" ADD CONSTRAINT "alert_notifications_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_fixtures" ADD CONSTRAINT "dashboard_fixtures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "existing_solutions" ADD CONSTRAINT "existing_solutions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_activity_log" ADD CONSTRAINT "problem_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_activity_log" ADD CONSTRAINT "problem_activity_log_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_frequency_points" ADD CONSTRAINT "problem_frequency_points_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_personas" ADD CONSTRAINT "problem_personas_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_quotes" ADD CONSTRAINT "problem_quotes_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_related" ADD CONSTRAINT "problem_related_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_related" ADD CONSTRAINT "problem_related_related_problem_id_problems_id_fk" FOREIGN KEY ("related_problem_id") REFERENCES "public"."problems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_sources" ADD CONSTRAINT "problem_sources_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_collections" ADD CONSTRAINT "saved_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_meters" ADD CONSTRAINT "usage_meters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_problems" ADD CONSTRAINT "user_saved_problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_problems" ADD CONSTRAINT "user_saved_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_problems" ADD CONSTRAINT "user_saved_problems_collection_id_saved_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."saved_collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wtp_signals" ADD CONSTRAINT "wtp_signals_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;
-- ROLLBACK (manual; forward-only in CI). Reverse-order undo. The 15 new tables
-- drop with CASCADE (removes their FK constraints); then the 7 additive problems
-- columns drop. The slice-004 problems columns + all rows are left intact.
-- DROP TABLE IF EXISTS "wtp_signals" CASCADE;
-- DROP TABLE IF EXISTS "user_saved_problems" CASCADE;
-- DROP TABLE IF EXISTS "usage_meters" CASCADE;
-- DROP TABLE IF EXISTS "saved_collections" CASCADE;
-- DROP TABLE IF EXISTS "problem_sources" CASCADE;
-- DROP TABLE IF EXISTS "problem_related" CASCADE;
-- DROP TABLE IF EXISTS "problem_quotes" CASCADE;
-- DROP TABLE IF EXISTS "problem_personas" CASCADE;
-- DROP TABLE IF EXISTS "problem_frequency_points" CASCADE;
-- DROP TABLE IF EXISTS "problem_activity_log" CASCADE;
-- DROP TABLE IF EXISTS "existing_solutions" CASCADE;
-- DROP TABLE IF EXISTS "dashboard_fixtures" CASCADE;
-- DROP TABLE IF EXISTS "categories" CASCADE;
-- DROP TABLE IF EXISTS "alert_rules" CASCADE;
-- DROP TABLE IF EXISTS "alert_notifications" CASCADE;
-- ALTER TABLE "problems" DROP COLUMN "compare_card";
-- ALTER TABLE "problems" DROP COLUMN "updated_at";
-- ALTER TABLE "problems" DROP COLUMN "first_seen_at";
-- ALTER TABLE "problems" DROP COLUMN "mention_count_60d";
-- ALTER TABLE "problems" DROP COLUMN "momentum_bucket";
-- ALTER TABLE "problems" DROP COLUMN "demand_status";
-- ALTER TABLE "problems" DROP COLUMN "synthesis";
