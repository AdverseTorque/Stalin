import { MAP_HEIGHT, MAP_WIDTH, project } from "@/lib/geo/projection";

// The world map's visible window (the SVG viewBox), in map units.
//
// The viewBox always has the container's shape (`aspect` = height/width),
// so the map is never shrunk to fit: spare space above/below the world is
// ocean. The world is ~2.5:1, so on a portrait phone the whole world is a
// thin strip — there the starting view fills the screen top to bottom,
// centred on India, and the user pans sideways (or zooms out to see it all).

export interface View {
  x: number;
  y: number;
  w: number;
}

export const MAP_ASPECT = MAP_HEIGHT / MAP_WIDTH;
const MIN_W = MAP_WIDTH / 10; // max 10x zoom
const INDIA = project(22, 80);
const INDIA_SPAN = 130; // map units: the subcontinent plus a margin

/** Limits zoom to [whole world, 10x] and keeps the window over the map (centred vertically when taller than it). */
export function clampView(v: View, aspect: number): View {
  const w = Math.min(MAP_WIDTH, Math.max(MIN_W, v.w));
  const h = w * aspect;
  return {
    w,
    x: Math.min(MAP_WIDTH - w, Math.max(0, v.x)),
    y: h >= MAP_HEIGHT ? (MAP_HEIGHT - h) / 2 : Math.min(MAP_HEIGHT - h, Math.max(0, v.y)),
  };
}

function centredOnIndia(w: number, aspect: number): View {
  return clampView({ w, x: INDIA.x - w / 2, y: INDIA.y - (w * aspect) / 2 }, aspect);
}

/** Starting view: the whole world, except in portrait, where it fills the height around India. */
export function fullView(aspect: number): View {
  return centredOnIndia(aspect > 1 ? MAP_HEIGHT / aspect : MAP_WIDTH, aspect);
}

/** Frames the subcontinent by whichever axis is tighter. */
export function indiaView(aspect: number): View {
  return centredOnIndia(Math.max(INDIA_SPAN, INDIA_SPAN / aspect), aspect);
}

/** Zoom by `factor`, keeping the point at (cx, cy) — fractions of the container — fixed on screen. */
export function zoomView(from: View, factor: number, aspect: number, cx = 0.5, cy = 0.5): View {
  const w = Math.min(MAP_WIDTH, Math.max(MIN_W, from.w * factor));
  return clampView({ w, x: from.x + (from.w - w) * cx, y: from.y + (from.w - w) * aspect * cy }, aspect);
}
