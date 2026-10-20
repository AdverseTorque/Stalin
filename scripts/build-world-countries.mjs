// Generates src/lib/geo/world-countries.json — every country in
// data/countries.geojson (India point-of-view edition) with its ISO/FIPS
// codes, continent, and a representative point (area-weighted centroid of
// its LARGEST polygon, so overseas territories/islands don't drag the
// point into the sea). Used to place news items that only name a country.
// lib/geo/countries.ts layers hand-checked capital coordinates on top for
// the most-covered countries.
//
//   node scripts/build-world-countries.mjs
import { readFileSync, writeFileSync } from "node:fs";

const geo = JSON.parse(readFileSync(new URL("../data/countries.geojson", import.meta.url), "utf8"));

// Shoelace area + centroid of a ring (lng/lat treated as planar — fine for
// a label point, not for measurement).
function ringStats(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const cross = x0 * y1 - x1 * y0;
    a += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  a /= 2;
  if (a === 0) return { area: 0, lng: ring[0][0], lat: ring[0][1] };
  return { area: Math.abs(a), lng: cx / (6 * a), lat: cy / (6 * a) };
}

const SKIP_CONTINENTS = new Set(["Seven seas (open ocean)"]);
const out = [];
for (const f of geo.features) {
  const p = f.properties;
  if (!f.geometry || SKIP_CONTINENTS.has(p.continent) || !p.iso2 || p.iso2 === "-99") continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const largest = polys.map((rings) => ringStats(rings[0])).sort((a, b) => b.area - a.area)[0];
  out.push({
    name: p.name,
    iso2: p.iso2,
    iso3: p.iso3,
    fips: p.fips,
    continent: p.continent,
    lat: Math.round(largest.lat * 1000) / 1000,
    lng: Math.round(largest.lng * 1000) / 1000,
  });
}
out.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(new URL("../src/lib/geo/world-countries.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`Wrote ${out.length} countries`);
for (const n of ["India", "Albania", "Haiti", "Armenia", "France", "Chile", "Norway"]) {
  const c = out.find((x) => x.name === n);
  console.log(`  ${n.padEnd(8)} ${c ? `${c.lat}, ${c.lng}  fips=${c.fips}  ${c.continent}` : "MISSING"}`);
}
