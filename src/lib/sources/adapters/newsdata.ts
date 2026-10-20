import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { placeFromText } from "@/lib/sources/place";
import { htmlToText, parsePublished } from "@/lib/sources/text";
import { isOffTopic } from "@/lib/sources/relevance";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// NewsData.io returns a per-article `source_name` — this is also how Reuters
// content reaches the dashboard (Reuters has no free feed/API of its own;
// NewsData.io licenses it). See SOURCES.md.
export const newsdataAdapter: SourceAdapter = {
  name: "NewsData.io",
  type: "api",
  homepageUrl: "https://newsdata.io/",
  termsUrl: "https://newsdata.io/documentation",
  enabled: () => Boolean(process.env.NEWSDATA_API_KEY),
  async fetch(): Promise<NormalizedItem[]> {
    const key = process.env.NEWSDATA_API_KEY;
    if (!key) return [];

    const url = new URL("https://newsdata.io/api/1/latest");
    url.searchParams.set("apikey", key);
    url.searchParams.set("language", "en");
    url.searchParams.set("category", "world,politics,business");

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`NewsData.io API returned ${res.status}`);
    const json = await res.json();
    const results: NewsDataResult[] = json?.results ?? [];

    const items: NormalizedItem[] = [];
    for (const r of results) {
      const title = r.title ? htmlToText(r.title) : "";
      const link = r.link?.trim();
      if (!title || !link) continue;

      const summary = htmlToText(r.description ?? "");
      const text = `${title} ${summary}`;
      if (isOffTopic(text)) continue; // see lib/sources/relevance.ts
      const place = placeFromText(text);
      const sourceName = r.source_name?.trim() || "NewsData.io";

      items.push({
        source: sourceName,
        sourceType: "api",
        title,
        summary: summary || title,
        url: link,
        publishedAt: parsePublished(toIsoUtc(r.pubDate, r.pubDateTZ)) ?? new Date(),
        category: classifyCategory(text, place.country),
        severity: classifySeverityFromText(text),
        ...place,
        tags: sourceName.toLowerCase().includes("reuters") ? ["wire"] : [],
      });
    }
    return items;
  },
};

/**
 * NewsData.io sends `pubDate` as "2026-10-08 15:04:11" plus a separate
 * `pubDateTZ: "UTC"` (seen in its published example responses). That
 * format has no timezone marker, and JavaScript parses it as LOCAL time —
 * on an IST machine every article would be shifted 5½ hours. Make it
 * explicit ISO-8601 UTC instead.
 */
export function toIsoUtc(pubDate: string | undefined, tz: string | undefined): string | undefined {
  if (!pubDate) return undefined;
  const m = pubDate.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/);
  if (!m) return pubDate; // already some other (hopefully explicit) format
  if (tz && tz.toUpperCase() !== "UTC") return undefined; // unknown zone: let the caller fall back
  return `${m[1]}T${m[2]}Z`;
}

interface NewsDataResult {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  pubDateTZ?: string;
  source_name?: string;
}
