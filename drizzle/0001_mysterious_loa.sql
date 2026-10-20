CREATE TABLE "situation_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"region" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary_md" text NOT NULL,
	"item_ids" integer[] DEFAULT '{}' NOT NULL,
	"is_news_flash" boolean DEFAULT false NOT NULL,
	"severity" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "agent_region" text;--> statement-breakpoint
CREATE INDEX "situation_reports_region_idx" ON "situation_reports" USING btree ("region","generated_at");--> statement-breakpoint
CREATE INDEX "items_agent_region_idx" ON "items" USING btree ("agent_region");