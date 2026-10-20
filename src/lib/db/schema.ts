import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Operational registry of ingestion sources — also doubles as a lightweight
// run log so a failing source is visible without a separate logging table
// (ties into the "never show a blank/broken screen" requirement: the
// dashboard just serves whatever sources succeeded).
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // 'gdelt' | 'rss' | 'api'
  homepageUrl: text("homepage_url"),
  termsUrl: text("terms_url"),
  enabled: boolean("enabled").notNull().default(true),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunCount: integer("last_run_count"),
  lastError: text("last_error"),
});

// Mirrors SitrepEvent (src/lib/types.ts) exactly — the frontend reads this
// table directly, so the two shapes must stay in sync.
export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    sourceType: text("source_type").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    url: text("url").notNull().unique(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    category: text("category").notNull(), // EventCategory
    severity: text("severity").notNull(), // Severity
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    country: text("country").notNull(),
    continent: text("continent").notNull(),
    tags: text("tags").array().notNull().default([]),
    contentHash: text("content_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Both the 7-day feed query and the retention cleanup filter/sort on this.
    index("items_published_at_idx").on(table.publishedAt),
  ],
);

export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;
export type SourceRow = typeof sources.$inferSelect;
