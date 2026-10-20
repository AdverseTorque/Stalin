import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Lazily-constructed Drizzle client. Deliberately NOT created at module
 * import time — Next.js builds/prerenders this module without DATABASE_URL
 * configured, and other scripts may import `schema` without ever touching
 * the DB. Throws only when something actually tries to query without a
 * connection string configured.
 */
export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local for local dev, or to " +
        "the Vercel/GitHub Actions environment for deployed runs. See PLAN.md §2.",
    );
  }
  const sql = neon(url);
  cached = drizzle(sql, { schema });
  return cached;
}
