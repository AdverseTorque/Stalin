// One-time (or re-runnable) maintenance script: computes agent_region for
// existing rows that predate the column, or anytime lib/agents/regions.ts'
// mapping logic changes. Groups by distinct (country, continent) pairs and
// issues one UPDATE per pair rather than one per row.
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, eq, isNull, sql } from "drizzle-orm";
import { getAgentRegion } from "@/lib/agents/regions";
import { getDb } from "@/lib/db/client";
import { items } from "@/lib/db/schema";

async function main() {
  const db = getDb();
  const rows = await db
    .selectDistinct({ country: items.country, continent: items.continent })
    .from(items)
    .where(isNull(items.agentRegion));

  let updatedPairs = 0;
  let totalRows = 0;
  for (const { country, continent } of rows) {
    const region = getAgentRegion(country, continent);
    const result = await db
      .update(items)
      .set({ agentRegion: region })
      .where(and(eq(items.country, country), eq(items.continent, continent), isNull(items.agentRegion)))
      .returning({ id: items.id });
    updatedPairs++;
    totalRows += result.length;
    console.log(`${country} / ${continent} -> ${region ?? "(unmapped)"} (${result.length} row(s))`);
  }

  const stillNull = await db.select({ count: sql<number>`count(*)` }).from(items).where(isNull(items.agentRegion));
  console.log(`\nBackfilled ${totalRows} row(s) across ${updatedPairs} country/continent pair(s).`);
  console.log(`Remaining rows with no agent_region (country not in the gazetteer): ${stillNull[0]?.count ?? 0}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
