CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"expiration_time" timestamp,
	"address" text,
	"user_agent" text,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_notified_at" timestamp,
	"disabled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_unique" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_subscriptions_address" ON "push_subscriptions" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_subscriptions_active" ON "push_subscriptions" USING btree ("disabled_at","updated_at");