import { connection, NextResponse } from "next/server";
import { AGENT_REGIONS } from "@/lib/agents/regions";
import { getLatestSituationReport } from "@/lib/data/queries";

// See src/app/api/events/route.ts for why connection() is needed here too
// (getDb() can throw before any real network call, which otherwise lets
// Next.js 16's cacheComponents freeze this route's output at build time).
export async function GET() {
  await connection();
  try {
    const reports = await Promise.all(
      AGENT_REGIONS.map(async (region) => ({
        region,
        report: await getLatestSituationReport(region),
      })),
    );
    return NextResponse.json({
      reports: reports.map(({ region, report }) => ({
        region,
        generatedAt: report?.generatedAt.toISOString() ?? null,
        severity: report?.severity ?? null,
        isNewsFlash: report?.isNewsFlash ?? false,
        itemCount: report?.itemIds.length ?? 0,
        summaryMd: report?.summaryMd ?? null,
      })),
    });
  } catch (err) {
    console.error("GET /api/agents failed:", err);
    // No situation reports available (DB unreachable, or agents haven't run
    // yet) — empty list rather than a 500, so the Agents panel just shows
    // its normal "nothing yet" empty state instead of breaking.
    return NextResponse.json({ reports: [] });
  }
}
