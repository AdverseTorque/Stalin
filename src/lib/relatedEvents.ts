import type { SitrepEvent } from "@/lib/types";

/**
 * Lightweight "similar context" — category/country/tag overlap scoring,
 * not embeddings. PLAN.md explicitly names keyword/tag matching as the
 * acceptable fallback when embeddings are too costly for this stage; a
 * pgvector-based upgrade can replace this later without changing the
 * EventDetailPanel UI that consumes it.
 */
export function findRelatedEvents(
  target: SitrepEvent,
  pool: SitrepEvent[],
  limit = 4,
): SitrepEvent[] {
  const scored = pool
    .filter((e) => e.id !== target.id)
    .map((e) => {
      let score = 0;
      if (e.category === target.category) score += 2;
      if (e.country === target.country) score += 2;
      const sharedTags = e.tags.filter((t) => target.tags.includes(t)).length;
      score += sharedTags;
      return { event: e, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.event.publishedAt).getTime() - new Date(a.event.publishedAt).getTime());

  return scored.slice(0, limit).map((s) => s.event);
}
