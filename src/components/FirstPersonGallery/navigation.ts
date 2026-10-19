import { MathUtils, Vector3 } from "three";
import { ISLAND_BOUNDS } from "./islandLayout";
export const EYE_HEIGHT = 1.6;
export const WALK_BOUNDS = { minX: -3.5, maxX: 3.5, minZ: -45.5, maxZ: 5.5 };
export function constrainPosition(
  p: Vector3,
  previous?: Vector3,
  fixedHeight = true,
) {
  p.x = MathUtils.clamp(p.x, WALK_BOUNDS.minX, WALK_BOUNDS.maxX);
  p.y = fixedHeight ? EYE_HEIGHT : MathUtils.clamp(p.y, 1.6, 3.75);
  p.z = MathUtils.clamp(p.z, WALK_BOUNDS.minZ, WALK_BOUNDS.maxZ);
  const b = ISLAND_BOUNDS;
  if (p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ) {
    if (previous && previous.x <= b.minX) p.x = b.minX;
    else if (previous && previous.x >= b.maxX) p.x = b.maxX;
    else if (previous && previous.z <= b.minZ) p.z = b.minZ;
    else if (previous && previous.z >= b.maxZ) p.z = b.maxZ;
    else {
      const faces = [
        { d: p.x - b.minX, axis: "x", v: b.minX },
        { d: b.maxX - p.x, axis: "x", v: b.maxX },
        { d: p.z - b.minZ, axis: "z", v: b.minZ },
        { d: b.maxZ - p.z, axis: "z", v: b.maxZ },
      ].sort((a, b) => a.d - b.d);
      if (faces[0].axis === "x") p.x = faces[0].v;
      else p.z = faces[0].v;
    }
  }
  return p;
}
function crossesIsland(a: Vector3, b: Vector3) {
  let min = 0,
    max = 1;
  for (const [start, end, lo, hi] of [
    [a.x, b.x, ISLAND_BOUNDS.minX, ISLAND_BOUNDS.maxX],
    [a.z, b.z, ISLAND_BOUNDS.minZ, ISLAND_BOUNDS.maxZ],
  ]) {
    const delta = end - start;
    if (Math.abs(delta) < 1e-8) {
      if (start < lo || start > hi) return false;
    } else {
      const x = (lo - start) / delta,
        y = (hi - start) / delta;
      min = Math.max(min, Math.min(x, y));
      max = Math.min(max, Math.max(x, y));
      if (min > max) return false;
    }
  }
  return min <= max;
}
export function galleryRoute(from: Vector3, to: Vector3) {
  if (!crossesIsland(from, to)) return [to];
  const lane = from.x < 0 ? ISLAND_BOUNDS.minX - 0.4 : ISLAND_BOUNDS.maxX + 0.4;
  return [
    new Vector3(lane, EYE_HEIGHT, from.z),
    new Vector3(lane, EYE_HEIGHT, to.z),
    to,
  ].filter((p, i, all) => p.distanceTo(i === 0 ? from : all[i - 1]) > 0.01);
}
export function nearestChapter(z: number) {
  return MathUtils.clamp(Math.round((-z - 2) / 10), 0, 4);
}
