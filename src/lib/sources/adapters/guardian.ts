import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { placeFromText } from "@/lib/sources/place";
import { htmlToText, parsePublished } from "@/lib/sources/text";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

// One request per section on purpose: whether `section=a|b` (boolean OR)
// is supported couldn't be confirmed (no official example; the public
// `api-key=test` key now returns 401), so this sticks to the documented
// single-value form. 3 sections x 72 runs/day (every 20 min) = 216 calls/day.
const SECTIONS = ["world", "politics", "business"] as const;

export const guardianAdapter: SourceAdapter = {
  name: "The Guardian",
  type: "api",
  homepageUrl: "https://www.theguardian.com/",
  termsUrl: "https://open-platform.theguardian.com/documentation/",
  enabled: () => Boolean(process.env.GUARDIAN_API_KEY),
  async fetch(): Promise<NormalizedItem[]> {
    const key = process.env.GUARDIAN_API_KEY;
    if (!key) return [];

    const items: NormalizedItem[] = [];
    for (const section of SECTIONS) {
      const url = new URL("https://content.guardianapis.com/search");
      url.searchParams.set("api-key", key);
      url.searchParams.set("section", section);
      url.searchParams.set("order-by", "newest");
      url.searchParams.set("page-size", "30");
      url.searchParams.set("show-fields", "trailText");

      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`Guardian API (${section}) returned ${res.status}`);
      const json = await res.json();
      const results: GuardianResult[] = json?.response?.results ?? [];

      for (const r of results) {
        const title = r.webTitle ? htmlToText(r.webTitle) : "";
        const link = r.webUrl?.trim();
        if (!title || !link) continue;

        const summary = htmlToText(r.fields?.trailText ?? "");
        const text = `${title} ${summary}`;
        const place = placeFromText(text);

        items.push({
          source: "The Guardian",
          sourceType: "api",
          title,
          summary: summary || title,
          url: link,
          publishedAt: parsePublished(r.webPublicationDate) ?? new Date(),
          category: classifyCategory(text, place.country),
          severity: classifySeverityFromText(text),
          ...place,
          tags: [],
        });
      }
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
