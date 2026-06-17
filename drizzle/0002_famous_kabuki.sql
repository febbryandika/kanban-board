CREATE TABLE "ai_rate_limits" (
	"user_id" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text,
	"count" integer,
	"last_request" bigint
);
