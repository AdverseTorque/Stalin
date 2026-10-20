CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"source_type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"url" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"country" text NOT NULL,
	"continent" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_url_unique" UNIQUE("url"),
	CONSTRAINT "items_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"homepage_url" text,
	"terms_url" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_run_count" integer,
	"last_error" text,
	CONSTRAINT "sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "items_published_at_idx" ON "items" USING btree ("published_at");