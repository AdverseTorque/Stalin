import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { placeFromText } from "@/lib/sources/place";
import { htmlToText, parsePublished } from "@/lib/sources/text";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// Free plan (per gnews.io's own page): 100 requests/day, max 10 articles
// per request, non-commercial use. One request per ingestion run at the
// 20-minute schedule = 72/day, inside the quota.
export const gnewsAdapter: SourceAdapter = {
  name: "GNews",
  type: "api",
  homepageUrl: "https://gnews.io/",
  termsUrl: "https://gnews.io/docs/v4",
  enabled: () => Boolean(process.env.GNEWS_API_KEY),
  async fetch(): Promise<NormalizedItem[]> {
    const key = process.env.GNEWS_API_KEY;
    if (!key) return [];

    const url = new URL("https://gnews.io/api/v4/top-headlines");
    url.searchParams.set("apikey", key);
    url.searchParams.set("lang", "en");
    url.searchParams.set("category", "world");
    url.searchParams.set("max", "10");

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`GNews API returned ${res.status}`);
    const json = await res.json();
    const articles: GNewsArticle[] = json?.articles ?? [];

    const items: NormalizedItem[] = [];
    for (const a of articles) {
      const title = a.title ? htmlToText(a.title) : "";
      const link = a.url?.trim();
      if (!title || !link) continue;

      const summary = htmlToText(a.description ?? "");
      const text = `${title} ${summary}`;
      const place = placeFromText(text);
      // Real publisher byline (GNews aggregates many outlets) — see SOURCES.md.
      const sourceName = a.source?.name?.trim() || "GNews";

      items.push({
        source: sourceName,
        sourceType: "api",
        title,
        summary: summary || title,
        url: link,
        publishedAt: parsePublished(a.publishedAt) ?? new Date(),
        category: classifyCategory(text, place.country),
        severity: classifySeverityFromText(text),
        ...place,
        tags: sourceName.toLowerCase().includes("reuters") ? ["wire"] : [],
      });
    }
    return items;
  },
};

interface GNewsArticle {
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  source?: { name?: string };
}
