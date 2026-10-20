import Parser from "rss-parser";
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { COUNTRIES, type CountryInfo } from "@/lib/geo/countries";
import { detectCountry } from "@/lib/geo/detect";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// No `timeout` option needed — fetch() below is given its own AbortSignal,
// and parseString() just parses text we already have in hand.
const parser = new Parser();

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
      // Fetch + decode ourselves rather than parser.parseURL() — some
      // feeds (PIB in particular) don't declare charset=utf-8 correctly in
      // their Content-Type header, and rss-parser's own HTTP layer decoded
      // UTF-8 bytes as Latin-1 for that feed, producing mojibake. The
      // WHATWG fetch Response.text() API does correct charset handling
      // (defaults to UTF-8 per spec), so decoding happens here instead.
      const res = await fetch(config.feedUrl, {
        signal: AbortSignal.timeout(15_000),
        headers: { "User-Agent": "SITREP/0.1 (+https://github.com/AdverseTorque/Stalin)" },
      });
      if (!res.ok) throw new Error(`${config.name} RSS returned ${res.status}`);
      const xml = await res.text();
      const feed = await parser.parseString(xml);
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
