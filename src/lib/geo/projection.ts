// Equirectangular projection matching public/data/world-map.svg. These
// constants MUST stay identical to scripts/build-world-map.mjs, or event
// markers will drift off the map.
export const MAP_WIDTH = 1000;
export const MAP_LAT_TOP = 84;
export const MAP_LAT_BOTTOM = -58;
export const MAP_HEIGHT = (MAP_WIDTH * (MAP_LAT_TOP - MAP_LAT_BOTTOM)) / 360;

export function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * MAP_WIDTH,
    y: ((MAP_LAT_TOP - lat) / (MAP_LAT_TOP - MAP_LAT_BOTTOM)) * MAP_HEIGHT,
  };
}
