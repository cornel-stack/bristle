ALTER TABLE "users" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role_custom" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "watched_categories" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;

-- ROLLBACK (manual; forward-only in CI). Reverse-order undo of the 4 statements.
-- All four are nullable + unconsumed by other slices, so dropping them is safe
-- (no backfill, no constraint to restore).
-- ALTER TABLE "users" DROP COLUMN "onboarding_completed_at";
-- ALTER TABLE "users" DROP COLUMN "watched_categories";
-- ALTER TABLE "users" DROP COLUMN "role_custom";
-- ALTER TABLE "users" DROP COLUMN "role";