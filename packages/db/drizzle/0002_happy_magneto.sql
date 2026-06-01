ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_code_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_version" text;

-- ROLLBACK (manual; forward-only in CI). Reverse-order undo of the 6 statements.
-- WARNING: re-adding NOT NULL to passwordHash will FAIL if any OAuth-only
-- (null-hash) users exist — backfill or keep it nullable before reverting that line.
-- ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;
-- ALTER TABLE "users" DROP COLUMN "terms_version";
-- ALTER TABLE "users" DROP COLUMN "terms_accepted_at";
-- ALTER TABLE "users" DROP COLUMN "email_verification_attempts";
-- ALTER TABLE "users" DROP COLUMN "email_verification_code_expires";
-- ALTER TABLE "users" DROP COLUMN "email_verification_code";