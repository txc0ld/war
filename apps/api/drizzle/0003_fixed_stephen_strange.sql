CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"address" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"status_message" text,
	"show_battle_results" boolean DEFAULT true NOT NULL,
	"show_chat_presence" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_messages_created_at" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_messages_address" ON "chat_messages" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profiles_updated_at" ON "profiles" USING btree ("updated_at");