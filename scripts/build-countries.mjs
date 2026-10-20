// Builds data/countries.geojson from Natural Earth's INDIA
// point-of-view edition (official Indian boundaries: all of Jammu &
// Kashmir incl. PoK, Gilgit-Baltistan, Aksai Chin, Shaksgam; Arunachal),
// not the default "de facto" edition, which draws the Line of Control.
// Refuses to write output unless every border check below passes.
//
// To regenerate:
//   1. Download ne_10m_admin_0_countries_ind.geojson from
//      github.com/nvkelso/natural-earth-vector (geojson/ folder) — only the
//      10m scale exists for point-of-view editions.
//   2. npx mapshaper ne_10m_admin_0_countries_ind.geojson -simplify 4% keep-shapes \
//        -filter-fields ADMIN,ISO_A2,ISO_A2_EH,ISO_A3,MAPCOLOR7,CONTINENT \
//        -o simplified.geojson precision=0.001 format=geojson
//   3. node scripts/build-countries.mjs simplified.geojson
//   4. node scripts/build-world-map.mjs   (regenerates public/data/world-map.svg)
// Don't simplify below 4%: at 2% the PoK border moved enough that
// Muzaffarabad fell on Pakistan's side (caught by the checks below).
import { readFileSync, writeFileSync } from "node:fs";

const SRC = process.argv[2];
const OUT = new URL("../data/countries.geojson", import.meta.url);
const geo = JSON.parse(readFileSync(SRC, "utf8"));

function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inPolygon(lng, lat, rings) {
  if (!inRing(lng, lat, rings[0])) return false;
  return !rings.slice(1).some((hole) => inRing(lng, lat, hole));
}
function countryAt(lat, lng) {
  for (const f of geo.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    if (polys.some((p) => inPolygon(lng, lat, p))) return f.properties.ADMIN;
  }
  return "(none)";
}

const checks = [
  ["Srinagar", 34.08, 74.8, "India"],
  ["Leh (Ladakh)", 34.15, 77.58, "India"],
  ["Muzaffarabad (PoK)", 34.37, 73.47, "India"],
  ["Gilgit (Gilgit-Baltistan)", 35.92, 74.31, "India"],
  ["Aksai Chin", 35.2, 79.3, "India"],
  ["Shaksgam Valley", 36.0, 76.6, "India"],
  ["Itanagar (Arunachal)", 27.08, 93.6, "India"],
  ["Lahore", 31.55, 74.34, "Pakistan"],
  ["Islamabad", 33.69, 73.05, "Pakistan"],
  ["Lhasa", 29.65, 91.1, "China"],
];
let ok = true;
for (const [label, lat, lng, expected] of checks) {
  const got = countryAt(lat, lng);
  const pass = got === expected;
  ok &&= pass;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label.padEnd(28)} expected ${expected.padEnd(9)} got ${got}`);
}
if (!ok) {
  console.log("\nBorder checks failed — not writing output.");
  process.exit(1);
}

const out = {
  type: "FeatureCollection",
  features: geo.features
    .filter((f) => f.geometry)
    .map((f) => {
      const p = f.properties;
      // ISO_A2_EH ("eh" = everything-has) fills the -99 gaps ISO_A2 has for France/Norway.
      const iso2 = p.ISO_A2 !== "-99" ? p.ISO_A2 : p.ISO_A2_EH;
      return {
        type: "Feature",
        properties: { name: p.ADMIN, iso2, iso3: p.ISO_A3, mapColor: p.MAPCOLOR7, continent: p.CONTINENT },
        geometry: f.geometry,
      };
    }),
};
const json = JSON.stringify(out);
writeFileSync(OUT, json);
console.log(`\nWrote ${out.features.length} features, ${json.length} bytes -> ${OUT}`);
