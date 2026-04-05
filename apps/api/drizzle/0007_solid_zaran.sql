CREATE TABLE IF NOT EXISTS "s2_battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"left_address" text NOT NULL,
	"left_token" integer NOT NULL,
	"right_address" text NOT NULL,
	"right_token" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"winner" text,
	"left_score" integer,
	"right_score" integer,
	"rounds_won_left" integer,
	"rounds_won_right" integer,
	"rounds_json" jsonb,
	"room_id" text,
	"room_token_left" text,
	"room_token_right" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "s2_players" (
	"address" text PRIMARY KEY NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"elo" integer DEFAULT 1000 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"headshot_kills" integer DEFAULT 0 NOT NULL,
	"total_kills" integer DEFAULT 0 NOT NULL,
	"sniper_count" integer DEFAULT 0 NOT NULL,
	"win_streak" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "s2_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"token_id" integer NOT NULL,
	"status_token" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"battle_id" uuid,
	"expires_at" timestamp NOT NULL,
	"matched_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "s2_snipers" (
	"token_id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"image" text,
	"skin" text,
	"scope_reticle" text,
	"kill_effect" text,
	"tracer_color" text,
	"inspect_anim" text,
	"owner" text,
	"cached_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "s2_battles" ADD CONSTRAINT "s2_battles_left_address_s2_players_address_fk" FOREIGN KEY ("left_address") REFERENCES "public"."s2_players"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "s2_battles" ADD CONSTRAINT "s2_battles_right_address_s2_players_address_fk" FOREIGN KEY ("right_address") REFERENCES "public"."s2_players"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_s2_battles_status" ON "s2_battles" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_s2_battles_resolved" ON "s2_battles" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_s2_leaderboard" ON "s2_players" USING btree ("score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_s2_queue_waiting" ON "s2_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_s2_queue_active_lookup" ON "s2_queue" USING btree ("address","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "s2_queue_status_token_unique" ON "s2_queue" USING btree ("status_token");