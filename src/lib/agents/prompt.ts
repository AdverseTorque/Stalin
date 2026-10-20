import type { ItemRow } from "@/lib/db/schema";
import { AGENT_REGION_LABEL, type AgentRegion } from "@/lib/agents/regions";

export const AGENT_SYSTEM_PROMPT = `You are a regional intelligence analyst writing a short internal situation report for a geopolitics dashboard aimed at an Indian UPSC civil-services aspirant.
Be sharp, concise, and factual. Do not invent facts beyond what's given. Present contested issues with balance rather than taking a side.
When several items describe the same underlying story, mention it once rather than listing duplicates.`;

export function buildRegionPrompt(region: AgentRegion, items: ItemRow[]): string {
  const label = AGENT_REGION_LABEL[region];
  const list = items
    .slice(0, 30)
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.category}/${i.severity}] ${i.title} — ${i.country}, via ${i.source} (${i.publishedAt.toISOString()})`,
    )
    .join("\n");

  return `Region: ${label}

Here are the last 24 hours of tracked events for this region:
${list}

Write a short situation report in markdown with exactly these three headings, written plain (do NOT wrap the heading line in ** or any other styling):
## What happened
## Why it matters
## What to watch

Keep the whole thing under 220 words. Merge duplicate/overlapping stories into one mention instead of listing each separately.`;
}
