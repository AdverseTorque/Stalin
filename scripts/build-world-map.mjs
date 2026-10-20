// Renders data/countries.geojson (India point-of-view boundaries, built and
// border-verified by scripts/build-countries.mjs) into a static flat world
// map: public/data/world-map.svg. Drawn once at build time and shown as a
// plain <img> — the browser rasterises it once, zero JavaScript at runtime
// (the old 3D globe needed three.js + a 470KB GeoJSON + geometry building
// on every page load, which stalled the whole UI).
//
// Projection: equirectangular, cropped to latitudes LAT_TOP..LAT_BOTTOM
// (drops Antarctica and the empty far north). src/lib/geo/projection.ts
// MUST use the same constants so event markers line up with the map.
//
//   node scripts/build-world-map.mjs
import { readFileSync, writeFileSync } from "node:fs";

const WIDTH = 1000;
const LAT_TOP = 84;
const LAT_BOTTOM = -58;
const HEIGHT = (WIDTH * (LAT_TOP - LAT_BOTTOM)) / 360;

const LAND = "#24395c";
const BORDER = "#4d6a94";

const geo = JSON.parse(readFileSync(new URL("../data/countries.geojson", import.meta.url), "utf8"));

const px = ([lng, lat]) => [
  Math.round(((lng + 180) / 360) * WIDTH * 10) / 10,
  Math.round(((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * HEIGHT * 10) / 10,
];

const ringPath = (ring) => {
  const pts = ring.map(px);
  return `M${pts.map(([x, y]) => `${x},${y}`).join("L")}Z`;
};

const paths = [];
for (const f of geo.features) {
  if (f.properties.name === "Antarctica" || !f.geometry) continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const d = polys.map((rings) => rings.map(ringPath).join("")).join("");
  paths.push(`<path d="${d}"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT.toFixed(1)}" preserveAspectRatio="xMidYMid meet">
<g fill="${LAND}" stroke="${BORDER}" stroke-width="0.35" stroke-linejoin="round" fill-rule="evenodd">
${paths.join("\n")}
</g>
</svg>`;

writeFileSync(new URL("../public/data/world-map.svg", import.meta.url), svg);
console.log(`Wrote ${paths.length} countries, ${svg.length} bytes, viewBox 0 0 ${WIDTH} ${HEIGHT.toFixed(1)}`);
