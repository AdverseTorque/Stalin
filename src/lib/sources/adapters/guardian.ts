import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { detectCountry } from "@/lib/geo/detect";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// [VERIFY] current free-tier quota/terms at open-platform.theguardian.com/access
// before relying on this in production (not re-checked live — see PLAN.md).
export const guardianAdapter: SourceAdapter = {
  name: "The Guardian",
  type: "api",
  homepageUrl: "https://www.theguardian.com/",
  termsUrl: "https://open-platform.theguardian.com/documentation/",
  enabled: () => Boolean(process.env.GUARDIAN_API_KEY),
  async fetch(): Promise<NormalizedItem[]> {
    const key = process.env.GUARDIAN_API_KEY;
    if (!key) return [];

    const url = new URL("https://content.guardianapis.com/search");
    url.searchParams.set("api-key", key);
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", "40");
    url.searchParams.set("show-fields", "trailText");
    // World + politics sections cover our 5 categories reasonably well
    // without pulling in sport/culture noise.
    url.searchParams.set("section", "world|politics|business|uk-news");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Guardian API returned ${res.status}`);
    const json = await res.json();
    const results: GuardianResult[] = json?.response?.results ?? [];

    const items: NormalizedItem[] = [];
    for (const r of results) {
      const title = r.webTitle?.trim();
      const link = r.webUrl?.trim();
      if (!title || !link) continue;

      const summary = (r.fields?.trailText ?? "").replace(/<[^>]*>/g, "").trim();
      const text = `${title} ${summary}`;
      const geo = detectCountry(text);
      if (!geo) continue; // no placeable location — skipped for the globe in Phase 3

      items.push({
        source: "The Guardian",
        sourceType: "api",
        title,
        summary: summary || title,
        url: link,
        publishedAt: r.webPublicationDate ? new Date(r.webPublicationDate) : new Date(),
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

interface GuardianResult {
  webTitle?: string;
  webUrl?: string;
  webPublicationDate?: string;
  fields?: { trailText?: string };
}
