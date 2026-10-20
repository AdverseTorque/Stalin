// The 8 continent-agent regions from the brief — note "South Asia" is its
// own region (split out from "Asia") and "MENA" is its own region (split
// out from "Africa"), matching the brief's explicit list rather than the
// coarser `continent` field already on each item (Asia/Europe/Africa/North
// America/South America/Oceania).
export type AgentRegion =
  | "south_asia"
  | "asia"
  | "europe"
  | "mena"
  | "sub_saharan_africa"
  | "north_america"
  | "latin_america"
  | "oceania";

export const AGENT_REGION_LABEL: Record<AgentRegion, string> = {
  south_asia: "South Asia / India",
  asia: "Asia",
  europe: "Europe",
  mena: "Middle East & North Africa",
  sub_saharan_africa: "Sub-Saharan Africa",
  north_america: "North America",
  latin_america: "Latin America",
  oceania: "Oceania",
};

export const AGENT_REGIONS = Object.keys(AGENT_REGION_LABEL) as AgentRegion[];

const SOUTH_ASIA = new Set([
  "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Afghanistan", "Maldives", "Bhutan", "Myanmar",
]);
const MENA = new Set([
  "Israel", "Palestine", "Iran", "Iraq", "Saudi Arabia", "UAE", "Qatar", "Turkey", "Syria", "Lebanon",
  "Yemen", "Jordan", "Egypt", "Algeria", "Morocco",
]);
const NORTH_AMERICA_STRICT = new Set(["United States", "Canada"]);
const LATIN_AMERICA_EXTRA = new Set(["Mexico"]); // the rest of Latin America falls out of the South America continent case below

/**
 * Maps a resolved country + continent (as already stored on each item) to
 * one of the 8 agent regions. Returns null for items whose country/
 * continent couldn't be resolved at ingestion (e.g. a GDELT FIPS code not
 * in lib/geo/countries.ts) — those are simply excluded from every region
 * agent rather than guessed at.
 */
export function getAgentRegion(country: string, continent: string): AgentRegion | null {
  if (SOUTH_ASIA.has(country)) return "south_asia";
  if (MENA.has(country)) return "mena";
  if (NORTH_AMERICA_STRICT.has(country)) return "north_america";
  if (LATIN_AMERICA_EXTRA.has(country)) return "latin_america";

  switch (continent) {
    case "Asia":
      return "asia";
    case "Europe":
      return "europe";
    case "Africa":
      return "sub_saharan_africa";
    case "South America":
      return "latin_america";
    case "Oceania":
      return "oceania";
    case "North America":
      return "north_america";
    default:
      return null;
  }
}
