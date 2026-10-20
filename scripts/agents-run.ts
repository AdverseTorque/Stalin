// Run on a schedule by .github/workflows/agents.yml (every 30 min), or
// locally via `npm run agents` once GROQ_API_KEY is set in .env.local.
// For each of the 8 continent-agent regions: reads the last 24h of items,
// asks the LLM for a short situation report, and writes one row to
// situation_reports. Severity and the NEWS FLASH flag are computed
// directly from the underlying items' severities (not trusted to the
// LLM's judgement) — the LLM only writes the narrative.
import { config } from "dotenv";
config({ path: ".env.local" });

import { AGENT_REGIONS } from "@/lib/agents/regions";
import { AGENT_SYSTEM_PROMPT, buildRegionPrompt } from "@/lib/agents/prompt";
import { getRecentItemsForRegion } from "@/lib/data/queries";
import { getDb } from "@/lib/db/client";
import { situationReports } from "@/lib/db/schema";
import { generateText } from "@/lib/llm/client";
import { SEVERITY_ORDER, type Severity } from "@/lib/types";

function highestSeverity(severities: Severity[]): Severity {
  return severities.reduce((worst, s) => (SEVERITY_ORDER[s] > SEVERITY_ORDER[worst] ? s : worst), "low" as Severity);
}

async function run() {
  const db = getDb();
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const region of AGENT_REGIONS) {
    try {
      const recentItems = await getRecentItemsForRegion(region, 24);
      if (recentItems.length === 0) {
        console.log(`[skip] ${region}: no items in the last 24h`);
        skipped++;
        continue;
      }

      const severity = highestSeverity(recentItems.map((i) => i.severity as Severity));
      const isNewsFlash = recentItems.some((i) => i.severity === "critical");

      const summaryMd = await generateText({
        system: AGENT_SYSTEM_PROMPT,
        prompt: buildRegionPrompt(region, recentItems),
        // gpt-oss's hidden reasoning trace shares this budget with the
        // visible answer (see lib/llm/client.ts) — 500 was too tight and
        // came back empty on a long prompt during testing.
        maxTokens: 900,
      });

      await db.insert(situationReports).values({
        region,
        summaryMd,
        itemIds: recentItems.map((i) => i.id),
        isNewsFlash,
        severity,
      });

      console.log(`[ok] ${region}: report from ${recentItems.length} item(s), severity=${severity}, newsFlash=${isNewsFlash}`);
      generated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[error] ${region}: ${message}`);
      failed++;
      // One region failing (LLM timeout, rate limit, etc.) must never stop the rest.
    }
  }

  console.log(`\nDone. Generated ${generated} report(s), skipped ${skipped} (no data), failed ${failed}.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Agent run failed:", err);
    process.exit(1);
  });
