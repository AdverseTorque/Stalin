import Parser from "rss-parser";
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { placeFromText } from "@/lib/sources/place";
import { isOffTopic } from "@/lib/sources/relevance";
import { htmlToText, parsePublished } from "@/lib/sources/text";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// No `timeout` option needed — fetch() below is given its own AbortSignal,
// and parseString() just parses text we already have in hand.
const parser = new Parser();

export interface RssSourceConfig {
  /** Unique per feed — also the key for per-source health in the `sources` table. */
  name: string;
  /** Publisher name shown on items, when several feeds share one publisher ("The Hindu" for National + International). */
  publisher?: string;
  feedUrl: string;
  homepageUrl: string;
  termsUrl: string;
  /** Used only when the text names no country (e.g. PIB is always about India). */
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
      const feed = await parser.parseString(await res.text());
      const items: NormalizedItem[] = [];

      for (const entry of feed.items) {
        const title = entry.title ? htmlToText(entry.title) : "";
        const url = entry.link?.trim();
        if (!title || !url) continue;

        const summary = htmlToText(entry.contentSnippet ?? entry.content ?? "").slice(0, 400);
        const text = `${title} ${summary}`;
        // Every item is kept, placed or not — see lib/sources/place.ts.
        if (isOffTopic(text)) continue; // sport/entertainment/lifestyle — see lib/sources/relevance.ts
        const place = placeFromText(text, config.defaultCountry);

        items.push({
          source: config.publisher ?? config.name,
          sourceType: "rss",
          title,
          summary: summary || title,
          url,
          publishedAt: parsePublished(entry.isoDate) ?? new Date(),
          category: classifyCategory(text, place.country),
          severity: classifySeverityFromText(text),
          ...place,
          tags: [],
        });
      }

      return items;
    },
  };
}
