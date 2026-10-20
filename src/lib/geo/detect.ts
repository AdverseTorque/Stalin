import { COUNTRIES, type CountryInfo } from "@/lib/geo/countries";
import { ACRONYMS, ALT_NAMES, BLOCKERS, DEMONYMS } from "@/lib/geo/demonyms";

// Country detection from free text — gazetteer matching, not NLP.
//
// Rules (each fixes a measured problem with the earlier version):
// 1. The EARLIEST mention wins (headline first). Previously the longest
//    name anywhere won, so "UAE and India held talks" could pick India.
// 2. Case-SENSITIVE for normal text, so "turkey" (the bird) or "us" (the
//    pronoun) don't match. ALL-CAPS headlines fall back to
//    case-insensitive, otherwise they'd match nothing.
// 3. Acronyms (US, UK, UAE…) are always case-sensitive.
// 4. Blocker phrases ("Latin American", "Indian Ocean") are matched and
//    then ignored, so the country word inside them doesn't count.

const BY_ISO2 = new Map(COUNTRIES.map((c) => [c.iso2, c]));

const PHRASES = new Map<string, string | null>(); // phrase -> iso2, or null for a blocker
const ACRONYM_PHRASES = new Map<string, string>();

for (const c of COUNTRIES) {
  for (const name of [c.name, ...(c.aliases ?? [])]) {
    if (/^[A-Z.]{2,5}$/.test(name)) ACRONYM_PHRASES.set(name, c.iso2);
    else PHRASES.set(name, c.iso2);
  }
}
for (const [phrase, iso2] of Object.entries(ALT_NAMES)) PHRASES.set(phrase, iso2);
for (const [phrase, iso2] of Object.entries(DEMONYMS)) PHRASES.set(phrase, iso2);
for (const [phrase, iso2] of Object.entries(ACRONYMS)) ACRONYM_PHRASES.set(phrase, iso2);
for (const phrase of BLOCKERS) PHRASES.set(phrase, null);

const LOWER_LOOKUP = new Map([...PHRASES].map(([k, v]) => [k.toLowerCase(), v]));

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest first, so at any position the longest phrase wins ("South
// Sudanese" over "Sudanese", "Latin American" over "American").
// Lookarounds instead of \b so phrases ending in "." ("U.S.") still work.
function buildRegex(phrases: Iterable<string>, flags: string): RegExp {
  const alternation = [...phrases]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternation})(?![\\p{L}\\p{N}])`, flags);
}

const CASE_SENSITIVE = buildRegex(PHRASES.keys(), "gu");
const CASE_INSENSITIVE = buildRegex(PHRASES.keys(), "giu");
const ACRONYM_REGEX = buildRegex(ACRONYM_PHRASES.keys(), "gu");

function isShouting(text: string): boolean {
  const upper = (text.match(/\p{Lu}/gu) ?? []).length;
  const lower = (text.match(/\p{Ll}/gu) ?? []).length;
  return upper > lower;
}

/**
 * Best-effort country detection from free text (pass title first, then
 * summary). Returns null when nothing matches — callers keep the item
 * anyway, just without a map position.
 */
export function detectCountry(text: string): CountryInfo | null {
  const shouting = isShouting(text);
  const regex = shouting ? CASE_INSENSITIVE : CASE_SENSITIVE;

  const hits: { index: number; length: number; iso2: string | null }[] = [];
  for (const m of text.matchAll(regex)) {
    const iso2 = shouting ? LOWER_LOOKUP.get(m[0].toLowerCase()) : PHRASES.get(m[0]);
    if (iso2 !== undefined) hits.push({ index: m.index, length: m[0].length, iso2 });
  }
  for (const m of text.matchAll(ACRONYM_REGEX)) {
    hits.push({ index: m.index, length: m[0].length, iso2: ACRONYM_PHRASES.get(m[0]) ?? null });
  }
  hits.sort((a, b) => a.index - b.index || b.length - a.length);

  for (const hit of hits) {
    if (hit.iso2 === null) continue; // blocker phrase
    const country = BY_ISO2.get(hit.iso2);
    if (country) return country;
  }
  return null;
}

const BY_FIPS = new Map<string, CountryInfo>();
for (const c of COUNTRIES) {
  if (c.fips) BY_FIPS.set(c.fips, c);
  for (const f of c.extraFips ?? []) BY_FIPS.set(f, c);
}

/**
 * Resolves GDELT's ActionGeo_CountryCode (FIPS 10-4, NOT ISO — see
 * countries.ts) to a country/continent. Returns null for codes with no
 * country (e.g. open ocean).
 */
export function getCountryByFips(fips: string): CountryInfo | null {
  return BY_FIPS.get(fips) ?? null;
}
