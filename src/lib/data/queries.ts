// Shared read queries — used by scripts/agents-run.ts (continent agents)
// AND src/app/api/mcp/route.ts (the MCP tool endpoints), so both always
// see the exact same data shape and filtering rules.
import { and, desc, eq, gte, ilike, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { items, situationReports, type ItemRow, type SituationReportRow } from "@/lib/db/schema";
import type { AgentRegion } from "@/lib/agents/regions";
import type { EventCategory, Severity } from "@/lib/types";

export async function getRecentItemsForRegion(region: AgentRegion, hours = 24): Promise<ItemRow[]> {
  const db = getDb();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select()
    .from(items)
    .where(and(eq(items.agentRegion, region), gte(items.publishedAt, cutoff)))
    .orderBy(desc(items.publishedAt))
    .limit(200);
}

export interface SearchEventsParams {
  query?: string;
  category?: EventCategory;
  region?: AgentRegion;
  country?: string;
  severity?: Severity;
  hours?: number;
  limit?: number;
}

export async function searchEvents(params: SearchEventsParams): Promise<ItemRow[]> {
  const db = getDb();
  const conditions = [];
  if (params.category) conditions.push(eq(items.category, params.category));
  if (params.region) conditions.push(eq(items.agentRegion, params.region));
  if (params.country) conditions.push(eq(items.country, params.country));
  if (params.severity) conditions.push(eq(items.severity, params.severity));
  if (params.hours) conditions.push(gte(items.publishedAt, new Date(Date.now() - params.hours * 60 * 60 * 1000)));
  if (params.query) {
    const q = `%${params.query}%`;
    conditions.push(or(ilike(items.title, q), ilike(items.summary, q)));
  }

  return db
    .select()
    .from(items)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(items.publishedAt))
    .limit(Math.min(params.limit ?? 25, 100));
}

export async function getCountryTimeline(country: string, days = 7): Promise<ItemRow[]> {
  const db = getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(items)
    .where(and(eq(items.country, country), gte(items.publishedAt, cutoff)))
    .orderBy(desc(items.publishedAt))
    .limit(200);
}

export async function getItemById(id: number): Promise<ItemRow | null> {
  const db = getDb();
  const rows = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getLatestSituationReport(region: AgentRegion): Promise<SituationReportRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(situationReports)
    .where(eq(situationReports.region, region))
    .orderBy(desc(situationReports.generatedAt))
    .limit(1);
  return rows[0] ?? null;
}
