"use client";

import useSWR from "swr";
import { COUNTRIES } from "@/lib/geo/countries";

// Natural Earth 110m admin-0 countries, trimmed to the properties below and
// served from our own /public (not fetched from a third-party URL at
// runtime). `mapColor` is Natural Earth's MAPCOLOR7 — a precomputed
// 7-colour assignment guaranteeing neighbouring countries never share a
// colour, which is exactly what gives a political/atlas map its look.
export interface CountryFeature {
  type: "Feature";
  properties: {
    name: string;
    iso2: string;
    iso3: string;
    mapColor: number;
    continent: string;
  };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}

interface CountryCollection {
  type: "FeatureCollection";
  features: CountryFeature[];
}

const BY_ISO2 = new Map(COUNTRIES.map((c) => [c.iso2, c.name]));
const BY_NAME = new Map(
  COUNTRIES.flatMap((c) => [c.name, ...(c.aliases ?? [])].map((n) => [n.toLowerCase(), c.name] as const)),
);

/**
 * Maps a shape back to the country name our events use (lib/geo/countries.ts),
 * so clicking a country on the globe can filter the feed. ISO code first,
 * then name — Natural Earth stores "-99" as the ISO code for France and
 * Norway (a long-standing dataset quirk), so ISO alone silently misses them.
 * Falls back to Natural Earth's own name for countries outside our gazetteer.
 */
export function resolveCountryName(feature: CountryFeature): string {
  const { iso2, name } = feature.properties;
  return BY_ISO2.get(iso2) ?? BY_NAME.get(name.toLowerCase()) ?? name;
}

const fetcher = async (url: string): Promise<CountryCollection> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
};

/** Static asset — fetched once and never revalidated. */
export function useCountryShapes(): CountryFeature[] {
  const { data } = useSWR("/data/countries-110m.geojson", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });
  return data?.features ?? [];
}
