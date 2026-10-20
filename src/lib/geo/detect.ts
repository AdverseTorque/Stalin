import { COUNTRIES, type CountryInfo } from "@/lib/geo/countries";

interface NameEntry {
  pattern: RegExp;
  country: CountryInfo;
}

// Longest name/alias first, so "South Africa" is tried before a shorter
// overlapping fragment would be. Built once at module load, not per call.
const ENTRIES: NameEntry[] = COUNTRIES.flatMap((country) => {
  const names = [country.name, ...(country.aliases ?? [])];
  return names.map((name) => ({
    pattern: new RegExp(`\\b${escapeRegExp(name)}\\b`, "i"),
    country,
  }));
}).sort((a, b) => b.pattern.source.length - a.pattern.source.length);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Best-effort country detection from free text (title + summary). Used for
 * sources that don't carry their own coordinates (Guardian/GNews/NewsData.io
 * RSS). This is a simple gazetteer match, not NLP — it will miss countries
 * outside lib/geo/countries.ts and can occasionally mis-tag ambiguous text.
 * Good enough for MVP placement on the globe; flagged in PLAN.md as an area
 * to improve later rather than silently treated as perfect.
 */
export function detectCountry(text: string): CountryInfo | null {
  for (const entry of ENTRIES) {
    if (entry.pattern.test(text)) return entry.country;
  }
  return null;
}

const BY_FIPS: Record<string, CountryInfo> = Object.fromEntries(
  COUNTRIES.map((c) => [c.fips, c]),
);

/**
 * Resolves GDELT's ActionGeo_CountryCode (FIPS 10-4, NOT ISO — see
 * countries.ts) to a proper country/continent. Only covers the countries in
 * this gazetteer; callers should fall back to GDELT's own raw place name +
 * an "Unknown" continent for anything not covered.
 */
export function getCountryByFips(fips: string): CountryInfo | null {
  return BY_FIPS[fips] ?? null;
}
