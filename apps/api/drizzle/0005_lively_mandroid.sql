ALTER TABLE "battles" ALTER COLUMN "winner" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ALTER COLUMN "left_hp" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ALTER COLUMN "right_hp" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ALTER COLUMN "rounds_json" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ALTER COLUMN "resolved_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "status" text DEFAULT 'resolved' NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "commit_hash" text;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "commit_preimage_json" jsonb;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "drand_round" integer;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "drand_randomness" text;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "drand_signature" text;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "battle_seed" text;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "engine_version" text DEFAULT 'v1-hourly-seed' NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "resolution_error" text;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "committed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_battles_status" ON "battles" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_battles_drand_round" ON "battles" USING btree ("drand_round");