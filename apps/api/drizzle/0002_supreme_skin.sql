CREATE TABLE IF NOT EXISTS "ownership_snapshots" (
	"address" text PRIMARY KEY NOT NULL,
	"token_ids" jsonb NOT NULL,
	"gun_count" integer DEFAULT 0 NOT NULL,
	"source" text NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "queue" ADD COLUMN "status_token" text;--> statement-breakpoint
UPDATE "queue" SET "status_token" = gen_random_uuid()::text WHERE "status_token" IS NULL;--> statement-breakpoint
ALTER TABLE "queue" ALTER COLUMN "status_token" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "queue_status_token_unique" ON "queue" USING btree ("status_token");
