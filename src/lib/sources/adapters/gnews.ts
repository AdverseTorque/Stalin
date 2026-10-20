import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { detectCountry } from "@/lib/geo/detect";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// [VERIFY] current free-tier quota/terms at gnews.io/docs before relying on
// this in production (not re-checked live — see PLAN.md). Free tier has a
// low daily quota, so this is a secondary source, not the primary feed.
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
    url.searchParams.set("max", "25");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`GNews API returned ${res.status}`);
    const json = await res.json();
    const articles: GNewsArticle[] = json?.articles ?? [];

    const items: NormalizedItem[] = [];
    for (const a of articles) {
      const title = a.title?.trim();
      const link = a.url?.trim();
      if (!title || !link) continue;

      const summary = (a.description ?? "").trim();
      const text = `${title} ${summary}`;
      const geo = detectCountry(text);
      if (!geo) continue;

      items.push({
        source: "GNews",
        sourceType: "api",
        title,
        summary: summary || title,
        url: link,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        category: classifyCategory(text, geo.name),
        severity: classifySeverityFromText(text),
        lat: geo.lat,
        lng: geo.lng,
        country: geo.name,
        continent: geo.continent,
        tags: [],
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
}
