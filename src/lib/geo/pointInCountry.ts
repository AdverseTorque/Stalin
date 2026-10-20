// Node-only (ingestion scripts): which country contains a lat/lng point,
// using the SAME India point-of-view boundaries as the map
// (data/countries.geojson, border-verified by scripts/build-countries.mjs).
//
// Used for GDELT events, which carry exact coordinates. GDELT's own country
// code follows de facto control (e.g. Muzaffarabad = Pakistan); resolving by
// point-in-polygon instead makes every event's country agree with the map
// and with India's official boundaries.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COUNTRIES, type CountryInfo } from "@/lib/geo/countries";

type Ring = [number, number][];
interface Shape {
  iso2: string;
  name: string;
  polygons: Ring[][];
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
}

let shapes: Shape[] | null = null;

function loadShapes(): Shape[] {
  // Scripts run from the repo root (npm scripts / GitHub Actions).
  const geo = JSON.parse(readFileSync(join(process.cwd(), "data", "countries.geojson"), "utf8"));
  return geo.features
    .filter((f: { geometry: unknown }) => f.geometry)
    .map((f: { properties: { iso2: string; name: string }; geometry: { type: string; coordinates: unknown } }) => {
      const polygons = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const poly of polygons)
        for (const [lng, lat] of poly[0]) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      return { iso2: f.properties.iso2, name: f.properties.name, polygons, bbox: [minLng, minLat, maxLng, maxLat] };
    });
}

function inRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const BY_ISO2 = new Map(COUNTRIES.map((c) => [c.iso2, c]));

/** The country containing this point, or null (open sea, or a territory not in the gazetteer). */
export function countryAtPoint(lat: number, lng: number): CountryInfo | null {
  shapes ??= loadShapes();
  for (const s of shapes) {
    const [minLng, minLat, maxLng, maxLat] = s.bbox;
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
    for (const poly of s.polygons) {
      if (inRing(lng, lat, poly[0]) && !poly.slice(1).some((hole) => inRing(lng, lat, hole))) {
        return BY_ISO2.get(s.iso2) ?? null;
      }
    }
  }
  return null;
}
