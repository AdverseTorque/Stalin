import Parser from "rss-parser";
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { COUNTRIES, type CountryInfo } from "@/lib/geo/countries";
import { detectCountry } from "@/lib/geo/detect";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

const parser = new Parser({ timeout: 15_000 });

// Lazily built reverse lookup so RSS feeds with a fixed home country
// (PIB/MEA = always India) don't depend on detectCountry() finding a
// mention in the text itself.
const COUNTRY_BY_NAME: Record<string, CountryInfo> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c]),
);

export interface RssSourceConfig {
  name: string;
  feedUrl: string;
  homepageUrl: string;
  termsUrl: string;
  /** Used when detectCountry() can't find a country mention in the text (e.g. PIB/MEA feeds are always about India). */
  defaultCountry?: string;
}

export function createRssAdapter(config: RssSourceConfig): SourceAdapter {
  return {
    name: config.name,
    type: "rss",
    homepageUrl: config.homepageUrl,
    termsUrl: config.termsUrl,
    enabled: () => true,
    async fetch(): Promise<NormalizedItem[]> {
      const feed = await parser.parseURL(config.feedUrl);
      const items: NormalizedItem[] = [];

      for (const entry of feed.items) {
        const title = entry.title?.trim();
        const url = entry.link?.trim();
        if (!title || !url) continue;

        const summary = stripHtml(entry.contentSnippet ?? entry.content ?? "").slice(0, 400);
        const publishedAt = entry.isoDate ? new Date(entry.isoDate) : new Date();
        const text = `${title} ${summary}`;

        const detected = detectCountry(text);
        const geo = detected ?? (config.defaultCountry ? COUNTRY_BY_NAME[config.defaultCountry] : undefined);
        if (!geo) continue; // can't place it on the globe — skipped for Phase 3 (feed-only items without coordinates can come later)

        items.push({
          source: config.name,
          sourceType: "rss",
          title,
          summary: summary || title,
          url,
          publishedAt,
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
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
