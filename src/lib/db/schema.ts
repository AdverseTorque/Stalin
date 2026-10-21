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
    // Nullable: items that name no single country (a global UN statement, a
    // Mars mission) are kept in the feed without a map position, rather than
    // dropped — dropping them was costing ~40% of BBC/UN News items.
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    country: text("country").notNull(),
    continent: text("continent").notNull(),
    // One of the 8 continent-agent regions (lib/agents/regions.ts),
    // computed once at ingestion time rather than re-derived on every
    // query. Nullable — some items' country/continent can't be resolved
    // to one of the 8 regions (see getAgentRegion()), and are simply
    // excluded from every agent rather than guessed at.
    agentRegion: text("agent_region"),
    tags: text("tags").array().notNull().default([]),
    contentHash: text("content_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Both the feed query and the retention cleanup filter/sort on this.
    index("items_published_at_idx").on(table.publishedAt),
    // Each continent agent's run queries "recent items in my region".
    index("items_agent_region_idx").on(table.agentRegion),
  ],
);

// One row per agent run per region — accumulates as a history (unlike
// `items`, these are NOT subject to the retention purge; see
// PLAN.md's bookmarks/situation_reports design note).
export const situationReports = pgTable(
  "situation_reports",
  {
    id: serial("id").primaryKey(),
    region: text("region").notNull(), // AgentRegion
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    summaryMd: text("summary_md").notNull(),
    itemIds: integer("item_ids").array().notNull().default([]),
    isNewsFlash: boolean("is_news_flash").notNull().default(false),
    severity: text("severity").notNull(), // Severity — the highest among the items it covers
  },
  (table) => [index("situation_reports_region_idx").on(table.region, table.generatedAt)],
);

export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;
export type SourceRow = typeof sources.$inferSelect;
export type SituationReportRow = typeof situationReports.$inferSelect;
export type NewSituationReportRow = typeof situationReports.$inferInsert;
