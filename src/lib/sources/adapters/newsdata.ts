import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { detectCountry } from "@/lib/geo/detect";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// [VERIFY] current free-tier quota/terms at newsdata.io/documentation before
// relying on this in production (not re-checked live — see PLAN.md).
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

    const res = await fetch(url);
    if (!res.ok) throw new Error(`NewsData.io API returned ${res.status}`);
    const json = await res.json();
    const results: NewsDataResult[] = json?.results ?? [];

    const items: NormalizedItem[] = [];
    for (const r of results) {
      const title = r.title?.trim();
      const link = r.link?.trim();
      if (!title || !link) continue;

      const summary = (r.description ?? "").trim();
      const text = `${title} ${summary}`;
      const geo = detectCountry(text);
      if (!geo) continue;

      items.push({
        source: "NewsData.io",
        sourceType: "api",
        title,
        summary: summary || title,
        url: link,
        publishedAt: r.pubDate ? new Date(r.pubDate) : new Date(),
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

interface NewsDataResult {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
}
