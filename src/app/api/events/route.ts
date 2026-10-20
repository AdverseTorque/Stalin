import { connection, NextResponse } from "next/server";
import { desc, gte } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { items, type ItemRow } from "@/lib/db/schema";
import { MOCK_EVENTS } from "@/lib/mock/events";
import type { EventCategory, Severity, SitrepEvent } from "@/lib/types";

// `export const dynamic = "force-dynamic"` is disallowed alongside
// cacheComponents (build error if present). The replacement, `connection()`,
// is needed here specifically because getDb() can throw *before* any actual
// network call (when DATABASE_URL is unset) — which completes during
// prerendering and would otherwise let Next statically freeze the
// mock-data fallback as this route's permanent response. See
// node_modules/next/dist/docs/.../functions/connection.md.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  await connection();
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
    const rows = await db
      .select()
      .from(items)
      .where(gte(items.publishedAt, cutoff))
      .orderBy(desc(items.publishedAt))
      .limit(500);

    if (rows.length === 0) {
      // DB is reachable but empty — most likely ingestion hasn't run yet.
      // Serve mock data so the dashboard is never blank while that's true.
      return NextResponse.json({
        events: MOCK_EVENTS,
        source: "mock" as const,
        reason: "no-data-yet",
      });
    }

    return NextResponse.json({
      events: rows.map(rowToEvent),
      source: "live" as const,
    });
  } catch (err) {
    // No DATABASE_URL configured yet, or the DB is temporarily unreachable —
    // the brief is explicit that one failing source must never produce a
    // blank/broken screen, so this falls back to mock data instead of 500ing.
    console.error("GET /api/events falling back to mock data:", err);
    return NextResponse.json({
      events: MOCK_EVENTS,
      source: "mock" as const,
      reason: "db-unavailable",
    });
  }
}

function rowToEvent(row: ItemRow): SitrepEvent {
  return {
    id: String(row.id),
    title: row.title,
    summary: row.summary,
    source: row.source,
    url: row.url,
    publishedAt: row.publishedAt.toISOString(),
    category: row.category as EventCategory,
    severity: row.severity as Severity,
    lat: row.lat,
    lng: row.lng,
    country: row.country,
    continent: row.continent,
    tags: row.tags,
  };
}
