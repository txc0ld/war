CREATE TABLE IF NOT EXISTS "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"left_queue_id" uuid NOT NULL,
	"right_queue_id" uuid NOT NULL,
	"left_address" text NOT NULL,
	"left_token" integer NOT NULL,
	"right_address" text NOT NULL,
	"right_token" integer NOT NULL,
	"winner" text NOT NULL,
	"left_hp" integer NOT NULL,
	"right_hp" integer NOT NULL,
	"rounds_json" jsonb NOT NULL,
	"resolved_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"address" text PRIMARY KEY NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"gun_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"token_id" integer NOT NULL,
	"country" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"battle_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battles" ADD CONSTRAINT "battles_left_queue_id_queue_id_fk" FOREIGN KEY ("left_queue_id") REFERENCES "public"."queue"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battles" ADD CONSTRAINT "battles_right_queue_id_queue_id_fk" FOREIGN KEY ("right_queue_id") REFERENCES "public"."queue"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battles" ADD CONSTRAINT "battles_left_address_players_address_fk" FOREIGN KEY ("left_address") REFERENCES "public"."players"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battles" ADD CONSTRAINT "battles_right_address_players_address_fk" FOREIGN KEY ("right_address") REFERENCES "public"."players"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "battles_left_queue_id_unique" ON "battles" USING btree ("left_queue_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "battles_right_queue_id_unique" ON "battles" USING btree ("right_queue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leaderboard" ON "players" USING btree ("score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_queue_waiting" ON "queue" USING btree ("status");