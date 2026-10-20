import { describe, expect, it } from "vitest";
import { clampView, fullView, indiaView, zoomView } from "@/lib/geo/mapView";
import { MAP_HEIGHT, MAP_WIDTH, project } from "@/lib/geo/projection";

const PHONE = 650 / 390; // portrait phone map area (height / width)
const DESKTOP = 0.62; // typical desktop centre panel
const BANNER = 0.2; // wider than the 2.5:1 world itself

/** The window stays over the map horizontally, and vertically unless it's taller than the map. */
function onMap(v: { x: number; y: number; w: number }, aspect: number) {
  const h = v.w * aspect;
  expect(v.x).toBeGreaterThanOrEqual(0);
  expect(v.x + v.w).toBeLessThanOrEqual(MAP_WIDTH + 1e-9);
  if (h <= MAP_HEIGHT) {
    expect(v.y).toBeGreaterThanOrEqual(0);
    expect(v.y + h).toBeLessThanOrEqual(MAP_HEIGHT + 1e-9);
  } else {
    expect(v.y + h / 2).toBeCloseTo(MAP_HEIGHT / 2); // centred, ocean above and below
  }
}

describe("fullView", () => {
  it("fills a portrait phone top to bottom instead of a thin strip", () => {
    const v = fullView(PHONE);
    expect(v.w * PHONE).toBeCloseTo(MAP_HEIGHT);
    expect(v.y).toBeCloseTo(0);
    onMap(v, PHONE);
  });

  it("centres India on a portrait phone", () => {
    const v = fullView(PHONE);
    expect(v.x + v.w / 2).toBeCloseTo(project(22, 80).x);
  });

  it("shows the whole world on desktop and wide screens", () => {
    for (const a of [DESKTOP, BANNER]) {
      const v = fullView(a);
      expect(v.w).toBe(MAP_WIDTH);
      expect(v.x).toBe(0);
      onMap(v, a);
    }
  });
});

describe("clampView / zoomView", () => {
  it("never zooms out past the whole world or pans off it", () => {
    for (const a of [PHONE, DESKTOP, BANNER]) {
      const v = clampView({ x: -500, y: 9999, w: 99999 }, a);
      expect(v.w).toBe(MAP_WIDTH);
      onMap(v, a);
    }
  });

  it("caps zoom-in at 10x", () => {
    expect(clampView({ x: 0, y: 0, w: 1 }, DESKTOP).w).toBe(MAP_WIDTH / 10);
  });

  it("keeps the anchor point fixed while zooming", () => {
    const from = { x: 300, y: 50, w: 400 };
    const to = zoomView(from, 0.5, DESKTOP, 0.25, 0.75);
    expect(to.x + to.w * 0.25).toBeCloseTo(from.x + from.w * 0.25);
    expect(to.y + to.w * DESKTOP * 0.75).toBeCloseTo(from.y + from.w * DESKTOP * 0.75);
  });
});

describe("indiaView", () => {
  it("contains all of India (incl. J&K and the north-east) on any screen", () => {
    const corners = [project(37, 68), project(6, 97)];
    for (const a of [PHONE, DESKTOP]) {
      const v = indiaView(a);
      for (const c of corners) {
        expect(c.x).toBeGreaterThan(v.x);
        expect(c.x).toBeLessThan(v.x + v.w);
        expect(c.y).toBeGreaterThan(v.y);
        expect(c.y).toBeLessThan(v.y + v.w * a);
      }
    }
  });
});
