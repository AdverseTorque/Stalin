import { createHash } from "node:crypto";

/**
 * Dedup key independent of URL — two adapters (e.g. an RSS feed and GDELT's
 * mention of the same wire story) can surface the same event under
 * different URLs. Bucketed by day so the same headline republished a week
 * later isn't incorrectly treated as a duplicate.
 */
export function contentHash(source: string, title: string, publishedAt: Date): string {
  const dayBucket = publishedAt.toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${source}|${title.trim().toLowerCase()}|${dayBucket}`)
    .digest("hex");
}
