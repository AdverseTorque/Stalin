import AdmZip from "adm-zip";
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromGoldstein } from "@/lib/classify/severity";
import { getCountryByFips } from "@/lib/geo/detect";
import { countryAtPoint } from "@/lib/geo/pointInCountry";
import { fetchArticleMeta } from "@/lib/sources/article-meta";
import { UNPLACED_COUNTRY } from "@/lib/sources/place";
import { isOffTopic } from "@/lib/sources/relevance";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

const LAST_UPDATE_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt";
const DOWNLOAD_TIMEOUT_MS = 30_000;

// GDELT 2.0 event export column indices — live-tested against a real export
// file (see SOURCES.md), and covered by tests/gdelt.test.ts.
export const COL = {
  EventRootCode: 28,
  GoldsteinScale: 30,
  NumMentions: 31,
  ActionGeo_FullName: 52,
  ActionGeo_CountryCode: 53, // FIPS 10-4, NOT ISO — see lib/geo/countries.ts
  ActionGeo_Lat: 56,
  ActionGeo_Long: 57,
  DATEADDED: 59, // YYYYMMDDHHMMSS, UTC — when GDELT recorded the event
  SOURCEURL: 60,
};

// CAMEO root codes that reliably mean conflict (assault/fight/mass
// violence) or protest, whatever the headline wording. Everything else is
// classified from the real fetched headline.
const CONFLICT_ROOTS = new Set(["18", "19", "20"]);
const UNREST_ROOTS = new Set(["14"]);

// GDELT publishes a file every 15 minutes; ingestion runs every 20. Reading
// only the newest file skipped roughly one file in four, so each run reads
// the newest FILES_PER_RUN files (30 min of coverage). The URL dedupe below
// absorbs the overlap.
const FILES_PER_RUN = 2;
const MIN_MENTIONS = 10; // noise filter — keep only events with real pickup
// Over-sample before the headline fetch: some candidates fail to resolve a
// real headline (dead link, non-HTML, timeout) and are dropped.
// Per run, every 20 min (72 runs/day): 40 x 72 = ~2,900 GDELT events/day.
// Higher drowned the curated feeds in noise once the scheduler runs.
const CANDIDATE_POOL_SIZE = 70;
const FINAL_LIMIT = 40;
const FETCH_CONCURRENCY = 10;

export interface RawCandidate {
  lat: number;
  lng: number;
  numMentions: number;
  root: string;
  fipsCode: string;
  goldstein: number;
  sourceUrl: string;
  placeName: string;
  dateAdded: Date | null;
}

export const gdeltAdapter: SourceAdapter = {
  name: "GDELT",
  type: "gdelt",
  homepageUrl: "https://www.gdeltproject.org/",
  termsUrl: "https://www.gdeltproject.org/about.html",
  enabled: () => true,
  async fetch(): Promise<NormalizedItem[]> {
    const raw = await downloadRecentRows();
    // GDELT logs the same article once per actor/action relationship it
    // finds — dedupe by URL before spending a fetch on each.
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
    return resolved.filter((item): item is NormalizedItem => item !== null).slice(0, FINAL_LIMIT);
  },
};

async function downloadRecentRows(): Promise<RawCandidate[]> {
  const lastUpdate = await (await fetch(LAST_UPDATE_URL, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) })).text();
  const latestUrl = lastUpdate
    .split("\n")
    .map((l) => l.trim().split(" ").pop() ?? "")
    .find((u) => u.endsWith(".export.CSV.zip"));
  if (!latestUrl) return [];

  const rows: RawCandidate[] = [];
  for (const url of previousExportUrls(latestUrl, FILES_PER_RUN)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
      if (!res.ok) continue; // an older file can be briefly missing; the newest one is what matters
      const entry = new AdmZip(Buffer.from(await res.arrayBuffer())).getEntries()[0];
      if (entry) rows.push(...parseExportCsv(entry.getData().toString("utf-8")));
    } catch {
      // One unreadable file shouldn't lose the others.
    }
  }
  return rows;
}

/**
 * Given the newest export URL (".../20261020101500.export.CSV.zip"), returns
 * it plus the (count - 1) preceding 15-minute files' URLs.
 */
export function previousExportUrls(latestUrl: string, count: number): string[] {
  const m = latestUrl.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.export\.CSV\.zip$/);
  if (!m) return [latestUrl];
  const base = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const prefix = latestUrl.slice(0, m.index);
  const pad = (n: number) => String(n).padStart(2, "0");
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base - i * 15 * 60 * 1000);
    const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
    return `${prefix}${stamp}.export.CSV.zip`;
  });
}

/** Pure parser for one GDELT 2.0 event export file (tab-separated, no header). */
export function parseExportCsv(csv: string): RawCandidate[] {
  const rows: RawCandidate[] = [];
  for (const line of csv.split("\n")) {
    if (!line.trim()) continue;
    const cols = line.split("\t");

    const latRaw = cols[COL.ActionGeo_Lat];
    const lngRaw = cols[COL.ActionGeo_Long];
    if (!latRaw || !lngRaw) continue; // ungeocoded row
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const numMentions = Number(cols[COL.NumMentions]) || 0;
    if (numMentions < MIN_MENTIONS) continue;

    const sourceUrl = cols[COL.SOURCEURL]?.trim();
    if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) continue;

    rows.push({
      lat,
      lng,
      numMentions,
      root: cols[COL.EventRootCode] ?? "",
      fipsCode: cols[COL.ActionGeo_CountryCode] ?? "",
      goldstein: Number(cols[COL.GoldsteinScale]) || 0,
      sourceUrl,
      placeName: cols[COL.ActionGeo_FullName]?.trim() ?? "",
      dateAdded: parseGdeltTimestamp(cols[COL.DATEADDED]),
    });
  }
  return rows;
}

/** "20261020101500" (UTC) -> Date, or null if malformed. */
export function parseGdeltTimestamp(raw: string | undefined): Date | null {
  const m = raw?.trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
}

async function resolveCandidate(c: RawCandidate): Promise<NormalizedItem | null> {
  const meta = await fetchArticleMeta(c.sourceUrl);
  if (!meta.title) return null; // no real headline available — dropped rather than shown with a machine-generated one
  if (isOffTopic(`${meta.title} ${meta.description ?? ""}`)) return null; // see lib/sources/relevance.ts

  // Country by point-in-polygon against the official (India point-of-view)
  // boundaries, so it always agrees with the map — GDELT's own FIPS code
  // follows de facto control (it labels Muzaffarabad "Pakistan"). FIPS is
  // only the fallback for points that fall in no polygon (coasts, sea).
  const country = countryAtPoint(c.lat, c.lng) ?? getCountryByFips(c.fipsCode);
  const countryName = country?.name ?? (c.placeName || UNPLACED_COUNTRY);
  const continent = country?.continent ?? "Global";

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
    publishedAt: c.dateAdded ?? new Date(),
    category,
    severity: classifySeverityFromGoldstein(c.goldstein),
    lat: c.lat,
    lng: c.lng,
    country: countryName,
    continent,
    tags: ["gdelt"],
  };
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
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
