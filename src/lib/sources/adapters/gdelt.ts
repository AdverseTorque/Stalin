import AdmZip from "adm-zip";
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromGoldstein } from "@/lib/classify/severity";
import { getCountryByFips } from "@/lib/geo/detect";
import { fetchArticleMeta } from "@/lib/sources/article-meta";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

const LAST_UPDATE_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt";

// GDELT 2.0 event export column indices — live-tested against a real export
// file (see SOURCES.md): sane titles/places/coordinates came back, so this
// layout is confirmed correct, not just taken from docs.
const COL = {
  ActionGeo_CountryCode: 53, // FIPS 10-4, NOT ISO — see lib/geo/countries.ts
  ActionGeo_FullName: 52,
  ActionGeo_Lat: 56,
  ActionGeo_Long: 57,
  EventRootCode: 28,
  GoldsteinScale: 30,
  NumMentions: 31,
  SOURCEURL: 60,
};

// CAMEO root codes reliably signal conflict/protest regardless of what the
// real headline says, so these still short-circuit straight to a category.
// Everything else is classified from the real fetched headline instead of
// GDELT's own actor/action text — see "category classification" fix in the
// commit this landed in: country-based fallback alone was mistagging
// ordinary India-located events (e.g. "a merchant rejected a proposal") as
// Indian Politics just because of location, not content.
const CONFLICT_ROOTS = new Set(["18", "19", "20"]);
const UNREST_ROOTS = new Set(["14"]);

// How many raw (geocoded, well-mentioned) candidates to attempt headline
// fetches for before capping to the final 60 — several will fail to
// resolve a real headline (dead link, non-HTML response, timeout) and get
// dropped, so this over-samples to still land near 60 after that filter.
const CANDIDATE_POOL_SIZE = 100;
const FINAL_LIMIT = 60;
const FETCH_CONCURRENCY = 10;

interface RawCandidate {
  lat: number;
  lng: number;
  numMentions: number;
  root: string;
  fipsCode: string;
  goldstein: number;
  sourceUrl: string;
  placeNameFallback: string;
}

export const gdeltAdapter: SourceAdapter = {
  name: "GDELT",
  type: "gdelt",
  homepageUrl: "https://www.gdeltproject.org/",
  termsUrl: "https://www.gdeltproject.org/about.html",
  enabled: () => true,
  async fetch(): Promise<NormalizedItem[]> {
    const raw = await downloadLatestEventRows();
    // GDELT sometimes logs the same article twice under different
    // actor/action rows (once per relationship it detected in the text) —
    // dedupe by URL before spending a fetch on each one.
    const seenUrls = new Set<string>();
    const deduped = raw.filter((r) => {
      if (seenUrls.has(r.sourceUrl)) return false;
      seenUrls.add(r.sourceUrl);
      return true;
    });
    const candidates = deduped
      .sort((a, b) => b.numMentions - a.numMentions)
      .slice(0, CANDIDATE_POOL_SIZE);

    const resolved = await mapWithConcurrency(candidates, FETCH_CONCURRENCY, resolveCandidate);

    return resolved
      .filter((item): item is NormalizedItem => item !== null)
      .slice(0, FINAL_LIMIT);
  },
};

async function downloadLatestEventRows(): Promise<RawCandidate[]> {
  const lastUpdate = await (await fetch(LAST_UPDATE_URL)).text();
  const exportLine = lastUpdate
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.includes(".export.CSV.zip"));
  if (!exportLine) return [];

  const zipUrl = exportLine.split(" ").pop();
  if (!zipUrl) return [];

  const zipBuffer = Buffer.from(await (await fetch(zipUrl)).arrayBuffer());
  const zip = new AdmZip(zipBuffer);
  const entry = zip.getEntries()[0];
  if (!entry) return [];
  const csv = entry.getData().toString("utf-8");

  const rows: RawCandidate[] = [];
  for (const line of csv.split("\n")) {
    if (!line.trim()) continue;
    const cols = line.split("\t");

    const lat = Number(cols[COL.ActionGeo_Lat]);
    const lng = Number(cols[COL.ActionGeo_Long]);
    if (!lat && !lng) continue; // ungeocoded row — can't place it on the globe

    const numMentions = Number(cols[COL.NumMentions]) || 0;
    if (numMentions < 10) continue; // noise filter — keep only events with real pickup

    const sourceUrl = cols[COL.SOURCEURL]?.trim();
    if (!sourceUrl) continue;

    rows.push({
      lat,
      lng,
      numMentions,
      root: cols[COL.EventRootCode],
      fipsCode: cols[COL.ActionGeo_CountryCode] ?? "",
      goldstein: Number(cols[COL.GoldsteinScale]) || 0,
      sourceUrl,
      placeNameFallback: cols[COL.ActionGeo_FullName]?.trim() || "an unspecified location",
    });
  }
  return rows;
}

async function resolveCandidate(c: RawCandidate): Promise<NormalizedItem | null> {
  const meta = await fetchArticleMeta(c.sourceUrl);
  if (!meta.title) return null; // no real headline available — dropped rather than shown with a machine-generated one

  const place = getCountryByFips(c.fipsCode);
  const countryName = place?.name ?? c.placeNameFallback;
  const continent = place?.continent ?? "Unknown";

  const category = CONFLICT_ROOTS.has(c.root)
    ? "conflict"
    : UNREST_ROOTS.has(c.root)
      ? "unrest"
      : classifyCategory(meta.title, countryName);

  return {
    source: meta.sourceName,
    sourceType: "gdelt",
    title: meta.title,
    summary:
      meta.description ??
      `Reported via GDELT's global event index — ${c.numMentions} article mention(s) so far. See the source link for the full story.`,
    url: c.sourceUrl,
    publishedAt: new Date(), // GDELT's own event date is day-granularity; ingestion time is close enough at a 20 min cadence
    category,
    severity: classifySeverityFromGoldstein(c.goldstein),
    lat: c.lat,
    lng: c.lng,
    country: countryName,
    continent,
    tags: ["gdelt"],
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
