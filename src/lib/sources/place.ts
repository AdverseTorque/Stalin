import { COUNTRIES } from "@/lib/geo/countries";
import { detectCountry } from "@/lib/geo/detect";

export interface Placement {
  lat: number | null;
  lng: number | null;
  country: string;
  continent: string;
}

/** Items that name no single country — kept in the feed, just not on the map. */
export const UNPLACED_COUNTRY = "Global";
const UNPLACED: Placement = { lat: null, lng: null, country: UNPLACED_COUNTRY, continent: "Global" };

const BY_NAME = new Map(COUNTRIES.map((c) => [c.name, c]));

/**
 * Places a news item from its text (pass title first, then summary — the
 * earliest country mention wins). `defaultCountry` is for sources that are
 * about one country by definition (PIB, Indian outlets); it's only used
 * when the text names no country at all.
 */
export function placeFromText(text: string, defaultCountry?: string): Placement {
  const country = detectCountry(text) ?? (defaultCountry ? BY_NAME.get(defaultCountry) : undefined);
  if (!country) return UNPLACED;
  return { lat: country.lat, lng: country.lng, country: country.name, continent: country.continent };
}
