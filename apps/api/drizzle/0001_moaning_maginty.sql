CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
	"scope" text NOT NULL,
	"identifier" text NOT NULL,
	"bucket_start" timestamp NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "cooldown_until" timestamp;--> statement-breakpoint
ALTER TABLE "queue" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "queue" ADD COLUMN "matched_at" timestamp;--> statement-breakpoint
ALTER TABLE "queue" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "queue" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
UPDATE "queue"
SET
	"expires_at" = COALESCE("created_at", now()) + interval '10 minutes',
	"matched_at" = CASE WHEN "status" = 'matched' THEN COALESCE("created_at", now()) ELSE "matched_at" END,
	"updated_at" = COALESCE("updated_at", "created_at", now())
WHERE "expires_at" IS NULL OR "matched_at" IS NULL OR "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "queue" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_bucket_unique" ON "rate_limit_buckets" USING btree ("scope","identifier","bucket_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rate_limit_bucket_start" ON "rate_limit_buckets" USING btree ("bucket_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_queue_active_lookup" ON "queue" USING btree ("address","status","expires_at");
