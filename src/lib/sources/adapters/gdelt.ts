import AdmZip from "adm-zip";
import { classifySeverityFromGoldstein } from "@/lib/classify/severity";
import type { EventCategory } from "@/lib/types";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

const LAST_UPDATE_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt";

// GDELT 2.0 event export column indices. [VERIFY] against the current
// codebook (gdeltproject.org/data/lookups/CAMEO.eventcodes.txt and the
// GDELT 2.0 column layout doc) before relying on this in production —
// GDELT hasn't changed this layout in years, but it was not re-verified
// live when this was written (no web access in that session).
const COL = {
  ActionGeo_CountryCode: 53,
  ActionGeo_FullName: 52,
  ActionGeo_Lat: 56,
  ActionGeo_Long: 57,
  Actor1Name: 6,
  Actor2Name: 16,
  EventRootCode: 28,
  GoldsteinScale: 30,
  NumMentions: 31,
  SOURCEURL: 60,
};

// CAMEO root-code buckets (see PLAN.md for the reasoning): violent codes map
// to "conflict", protest to "unrest", everything else (statements, consults,
// cooperation, demands, threats, etc.) to "geopolitics" — GDELT doesn't cover
// economics as a category, that signal comes from the news-API adapters.
const CONFLICT_ROOTS = new Set(["18", "19", "20"]);
const UNREST_ROOTS = new Set(["14"]);

function rootToCategory(root: string, countryCode: string): EventCategory {
  if (CONFLICT_ROOTS.has(root)) return "conflict";
  if (UNREST_ROOTS.has(root)) return "unrest";
  if (countryCode === "IN") return "india";
  return "geopolitics";
}

const EVENT_ROOT_LABEL: Record<string, string> = {
  "01": "issued a statement regarding",
  "02": "appealed to",
  "03": "expressed intent to cooperate with",
  "04": "consulted with",
  "05": "engaged in diplomatic cooperation with",
  "06": "engaged in material cooperation with",
  "07": "provided aid to",
  "08": "yielded to",
  "09": "investigated",
  "10": "demanded action from",
  "11": "disapproved of",
  "12": "rejected a proposal from",
  "13": "threatened",
  "14": "protested against",
  "15": "showed military posture toward",
  "16": "reduced relations with",
  "17": "coerced",
  "18": "assaulted",
  "19": "engaged in armed conflict with",
  "20": "used mass violence against",
};

export const gdeltAdapter: SourceAdapter = {
  name: "GDELT",
  type: "gdelt",
  homepageUrl: "https://www.gdeltproject.org/",
  termsUrl: "https://www.gdeltproject.org/about.html",
  enabled: () => true,
  async fetch(): Promise<NormalizedItem[]> {
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

    const candidates: Array<{ item: NormalizedItem; numMentions: number }> = [];
    for (const line of csv.split("\n")) {
      if (!line.trim()) continue;
      const cols = line.split("\t");

      const lat = Number(cols[COL.ActionGeo_Lat]);
      const lng = Number(cols[COL.ActionGeo_Long]);
      if (!lat && !lng) continue; // ungeocoded row — can't place it on the globe

      const numMentions = Number(cols[COL.NumMentions]) || 0;
      if (numMentions < 10) continue; // noise filter — keep only events with real pickup

      const root = cols[COL.EventRootCode];
      const countryCode = cols[COL.ActionGeo_CountryCode] ?? "";
      const goldstein = Number(cols[COL.GoldsteinScale]) || 0;
      const sourceUrl = cols[COL.SOURCEURL]?.trim();
      if (!sourceUrl) continue;

      const actor1 = cols[COL.Actor1Name]?.trim() || "An actor";
      const actor2 = cols[COL.Actor2Name]?.trim();
      const actionLabel = EVENT_ROOT_LABEL[root] ?? "was involved in an event with";
      const title = actor2
        ? `${titleCase(actor1)} ${actionLabel} ${titleCase(actor2)}`
        : `${titleCase(actor1)} ${actionLabel.replace(/ with$| toward$| from$/, "")}`;

      const placeName = cols[COL.ActionGeo_FullName]?.trim() || "an unspecified location";

      candidates.push({
        numMentions,
        item: {
          source: "GDELT",
          sourceType: "gdelt",
          title,
          summary: `Geopolitical event data point from GDELT, located near ${placeName}. Mentioned in ${numMentions} article(s) so far. GDELT aggregates structured event data rather than full articles — follow the source link for the original report.`,
          url: sourceUrl,
          publishedAt: new Date(), // GDELT's own event date is a day-granularity field; DATEADDED (ingestion time) is close enough for a 15-min-cadence feed
          category: rootToCategory(root, countryCode),
          severity: classifySeverityFromGoldstein(goldstein),
          lat,
          lng,
          country: placeName,
          continent: "Unknown", // GDELT gives a place name, not a continent — left for a later enrichment pass if needed
          tags: ["gdelt"],
        },
      });
    }

    // Cap per run, keeping the most-corroborated events — a single GDELT
    // export file can contain tens of thousands of rows; this is meant to
    // stay a curated dashboard, not a firehose.
    return candidates
      .sort((a, b) => b.numMentions - a.numMentions)
      .slice(0, 60)
      .map((c) => c.item);
  },
};

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
