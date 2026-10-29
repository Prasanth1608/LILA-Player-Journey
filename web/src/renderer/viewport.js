// Converts minimap fractions (u across, v up, 0–1) to canvas pixels, including zoom/pan.
// Every layer draws through toPx, so all layers zoom and pan together.
//
// Camera = { zoom, fx, fy }: zoom level and the map point (as fractions of the image,
// top-left = 0,0) shown at the canvas centre. Stored as fractions, not pixels, so a
// window resize keeps the same view.
import { ZOOM } from "../theme/visual.js";

export const HOME = { zoom: 1, fx: 0.5, fy: 0.5 };

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Keep zoom within limits and the map always covering the canvas (no empty edges)
export function clampCamera({ zoom, fx, fy }, limits = ZOOM) {
  const z = clamp(zoom, limits.min, limits.max);
  const half = 1 / (2 * z); // half the visible width, as a fraction of the map
  return { zoom: z, fx: clamp(fx, half, 1 - half), fy: clamp(fy, half, 1 - half) };
}

// Zoom by `factor`, keeping the map point under (px, py) fixed on screen (like editors)
export function zoomAt(camera, factor, px, py, width, height, limits = ZOOM) {
  const before = createViewport(width, height, camera);
  const [mx, my] = before.toFraction(px, py);        // map point under the pointer
  const zoom = clamp(camera.zoom * factor, limits.min, limits.max);
  // Where the map's top-left must be so (mx, my) stays at (px, py)
  const x = px - mx * width * zoom;
  const y = py - my * height * zoom;
  return clampCamera({
    zoom,
    fx: (width / 2 - x) / (width * zoom),
    fy: (height / 2 - y) / (height * zoom),
  }, limits);
}

// Drag: move the map by (dx, dy) screen pixels
export function panBy(camera, dx, dy, width, height, limits = ZOOM) {
  return clampCamera({
    zoom: camera.zoom,
    fx: camera.fx - dx / (width * camera.zoom),
    fy: camera.fy - dy / (height * camera.zoom),
  }, limits);
}

export function createViewport(width, height, camera = HOME) {
  const { zoom, fx, fy } = camera;
  const mapW = width * zoom;           // drawn size of the whole map
  const mapH = height * zoom;
  const x = width / 2 - fx * mapW;     // where the map's top-left corner lands
  const y = height / 2 - fy * mapH;
  return {
    width, height, zoom, x, y, mapW, mapH,
    // v is flipped: game "up" is the top of the image, where canvas y = 0
    toPx: (u, v) => [x + u * mapW, y + (1 - v) * mapH],
    // Screen pixel → image fractions (top-left = 0,0); used for hover readouts
    toFraction: (px, py) => [(px - x) / mapW, (py - y) / mapH],
  };
}
