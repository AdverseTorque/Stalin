import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { AGENT_REGION_LABEL, AGENT_REGIONS } from "@/lib/agents/regions";
import {
  getCountryTimeline,
  getItemById,
  getLatestSituationReport,
  searchEvents,
} from "@/lib/data/queries";
import { CATEGORY_LABEL, type EventCategory } from "@/lib/types";
import type { ItemRow } from "@/lib/db/schema";
import type { AgentRegion } from "@/lib/agents/regions";

// MCP endpoint — lets an external MCP client (Claude Desktop, or any other
// MCP-compatible app) query this dashboard's own 7-day event data and
// region situation reports directly, without scraping the website. Stateless
// by default (mcp-handler), which fits Vercel's serverless functions —
// no session/Redis config needed for simple read-only tools like these.
const CATEGORY_VALUES = Object.keys(CATEGORY_LABEL) as [EventCategory, ...EventCategory[]];
const SEVERITY_VALUES = ["low", "medium", "high", "critical"] as const;
const REGION_VALUES = AGENT_REGIONS as [AgentRegion, ...AgentRegion[]];

function itemToSummary(i: ItemRow) {
  return {
    id: i.id,
    title: i.title,
    summary: i.summary,
    source: i.source,
    url: i.url,
    publishedAt: i.publishedAt.toISOString(),
    category: i.category,
    severity: i.severity,
    country: i.country,
    continent: i.continent,
    tags: i.tags,
  };
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "search_events",
    {
      title: "Search Events",
      description:
        "Search the dashboard's 7-day rolling event database by free-text query and/or filters (category, region, country, severity, recency). Returns headline-level data only, never full article text.",
      inputSchema: z.object({
        query: z.string().optional().describe("Free-text match against title/summary"),
        category: z.enum(CATEGORY_VALUES).optional(),
        region: z.enum(REGION_VALUES).optional().describe(`One of: ${AGENT_REGIONS.join(", ")}`),
        country: z.string().optional(),
        severity: z.enum(SEVERITY_VALUES).optional(),
        hours: z.number().int().positive().max(168).optional().describe("Only items from the last N hours (max 168 = 7 days)"),
        limit: z.number().int().positive().max(100).optional(),
      }),
    },
    async (params) => {
      const results = await searchEvents(params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: results.length, items: results.map(itemToSummary) }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_region_summary",
    {
      title: "Get Region Summary",
      description:
        "Returns the latest AI-generated situation report for one of the 8 continent-agent regions (what happened / why it matters / what to watch).",
      inputSchema: z.object({
        region: z.enum(REGION_VALUES).describe(`One of: ${AGENT_REGIONS.join(", ")}`),
      }),
    },
    async ({ region }) => {
      const report = await getLatestSituationReport(region);
      if (!report) {
        return {
          content: [
            {
              type: "text",
              text: `No situation report has been generated yet for ${AGENT_REGION_LABEL[region]}.`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                region,
                generatedAt: report.generatedAt.toISOString(),
                severity: report.severity,
                isNewsFlash: report.isNewsFlash,
                itemCount: report.itemIds.length,
                summary: report.summaryMd,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_country_timeline",
    {
      title: "Get Country Timeline",
      description: "Returns a chronological timeline of tracked events for one country over the last N days (default 7, the full retention window).",
      inputSchema: z.object({
        country: z.string(),
        days: z.number().int().positive().max(7).optional(),
      }),
    },
    async ({ country, days }) => {
      const results = await getCountryTimeline(country, days ?? 7);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ country, count: results.length, items: results.map(itemToSummary) }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_item_by_id",
    {
      title: "Get Item By ID",
      description: "Returns full details for a single tracked event by its numeric id.",
      inputSchema: z.object({
        id: z.number().int().positive(),
      }),
    },
    async ({ id }) => {
      const item = await getItemById(id);
      if (!item) {
        return { content: [{ type: "text", text: `No item found with id ${id}.` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(itemToSummary(item), null, 2) }] };
    },
  );
});

export { handler as GET, handler as POST, handler as DELETE };
