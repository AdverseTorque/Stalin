// Run on a schedule by .github/workflows/ingest.yml (every 15-30 min), or
// locally via `npm run ingest` once DATABASE_URL (and optionally the news
// API keys) are set in .env.local. Fetches every registered source,
// normalizes + dedupes + inserts new items, logs per-source health to the
// `sources` table, and purges anything older than the rolling retention window
// (RETENTION_DAYS in src/lib/retention.ts).
import { config } from "dotenv";
config({ path: ".env.local" }); // no-op in CI, where env vars are injected directly

import { lt, notInArray, sql } from "drizzle-orm";
import { getAgentRegion } from "@/lib/agents/regions";
import { getDb } from "@/lib/db/client";
import { items, sources } from "@/lib/db/schema";
import { RETENTION_DAYS, RETENTION_MS } from "@/lib/retention";
import { contentHash } from "@/lib/sources/hash";
import { SOURCE_REGISTRY } from "@/lib/sources/registry";
import type { NormalizedItem } from "@/lib/sources/types";

async function run() {
  const db = getDb();
  let totalInserted = 0;

  for (const adapter of SOURCE_REGISTRY) {
    if (!adapter.enabled()) {
      console.log(`[skip] ${adapter.name} — not enabled (likely missing an API key)`);
      continue;
    }

    try {
      const raw = await adapter.fetch();
      const rows = toRows(raw);

      if (rows.length > 0) {
        const inserted = await db
          .insert(items)
          .values(rows)
          .onConflictDoNothing()
          .returning({ id: items.id });
        totalInserted += inserted.length;
        console.log(`[ok] ${adapter.name}: fetched ${rows.length}, inserted ${inserted.length} new`);
      } else {
        console.log(`[ok] ${adapter.name}: fetched 0`);
      }

      await upsertSourceHealth(adapter.name, adapter.type, adapter.homepageUrl, adapter.termsUrl, rows.length, null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[error] ${adapter.name}: ${message}`);
      await upsertSourceHealth(adapter.name, adapter.type, adapter.homepageUrl, adapter.termsUrl, 0, message);
      // One source failing must never stop the others — continue the loop.
    }
  }

  // Sources removed from the registry keep their old health rows; mark them
  // disabled so they don't look like silently-failing sources.
  await db
    .update(sources)
    .set({ enabled: false })
    .where(notInArray(sources.name, SOURCE_REGISTRY.map((a) => a.name)));

  const cutoff = new Date(Date.now() - RETENTION_MS);
  const deleted = await db.delete(items).where(lt(items.publishedAt, cutoff)).returning({ id: items.id });

  console.log(`\nDone. Inserted ${totalInserted} new item(s) total. Purged ${deleted.length} item(s) older than ${RETENTION_DAYS} days.`);

  async function upsertSourceHealth(
    name: string,
    type: string,
    homepageUrl: string,
    termsUrl: string,
    count: number,
    error: string | null,
  ) {
    await db
      .insert(sources)
      .values({
        name,
        type,
        homepageUrl,
        termsUrl,
        lastRunAt: new Date(),
        lastRunCount: count,
        lastError: error,
      })
      .onConflictDoUpdate({
        target: sources.name,
        set: {
          enabled: true, // re-enable if this source was retired and later re-added
          lastRunAt: new Date(),
          lastRunCount: count,
          lastError: error,
          // sql`excluded...` keeps homepage/terms URLs fresh if the registry changes them
          homepageUrl: sql`excluded.homepage_url`,
          termsUrl: sql`excluded.terms_url`,
        },
      });
  }
}

function toRows(raw: NormalizedItem[]) {
  // Dedup within this single batch too (two adapters can occasionally
  // surface the exact same story in one run), not just against the DB.
  const seen = new Set<string>();
  const rows = [];
  // Don't insert what the retention purge below would delete straight away.
  const oldest = Date.now() - RETENTION_MS;
  for (const item of raw) {
    if (item.publishedAt.getTime() < oldest) continue;
    const hash = contentHash(item.source, item.title, item.publishedAt);
    const key = `${item.url}|${hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      ...item,
      contentHash: hash,
      agentRegion: getAgentRegion(item.country, item.continent),
    });
  }
  return rows;
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Ingestion run failed:", err);
    process.exit(1);
  });
