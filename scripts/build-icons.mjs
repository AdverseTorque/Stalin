// Renders src/app/icon.svg into the PNG sizes phones need for the
// installable app (manifest: 192/512; iOS home screen: 180 apple-icon).
// Dev-time only: requires @resvg/resvg-js (npm i -D @resvg/resvg-js).
//
//   node scripts/build-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const svg = readFileSync(new URL("../src/app/icon.svg", import.meta.url), "utf8");
const render = (size) => new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();

mkdirSync(new URL("../public/icons/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/icons/icon-192.png", import.meta.url), render(192));
writeFileSync(new URL("../public/icons/icon-512.png", import.meta.url), render(512));
// Next.js metadata convention: app/apple-icon.png -> <link rel="apple-touch-icon">
writeFileSync(new URL("../src/app/apple-icon.png", import.meta.url), render(180));
console.log("Wrote public/icons/icon-192.png, icon-512.png and src/app/apple-icon.png");
