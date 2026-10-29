// Heatmap drawing, "blob" style (how most heatmap libraries work):
//   1. Each grid cell with a count draws a soft round blob (bright centre, fading edge)
//      into an off-screen canvas. Busier cells draw stronger blobs; overlaps add up.
//   2. The resulting intensity (0–255) is coloured with the green → yellow → red ramp.
// Blobs have a minimum on-screen size, so even 2 kills show as clear spots, while
// dense areas still build up into strong colour.
import { HEATMAP } from "../../theme/visual.js";
import { rampColor } from "../colormaps.js";

// Ramp looked up once per intensity level (256 entries), not once per pixel
const LUT = Array.from({ length: 256 }, (_, i) => rampColor(i / 255));

// One blurred-circle sprite per radius, reused for every cell
let sprite = { r: 0, canvas: null };
function blobSprite(r) {
  if (sprite.r === r) return sprite.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = r * 2;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "rgba(0, 0, 0, 1)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r * 2, r * 2);
  sprite = { r, canvas };
  return canvas;
}

// counts: count per grid cell; max: busiest cell. width/height: on-screen size in CSS px.
// Rebuilt only when the data or the canvas size changes, never per frame.
export function buildHeatmapImage(counts, max, grid, width, height) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // 1. Intensity: one blob per cell with data
  const cellW = w / grid;
  const cellH = h / grid;
  const r = Math.round(Math.max(HEATMAP.minRadiusPx, cellW * HEATMAP.radiusCells));
  const blob = blobSprite(r);
  for (let cell = 0; cell < counts.length; cell++) {
    const count = counts[cell];
    if (count === 0) continue;
    const x = ((cell % grid) + 0.5) * cellW;
    const y = (Math.floor(cell / grid) + 0.5) * cellH;
    // Square root spreads the range so a few very busy cells don't hide the rest.
    // Each blob is partly transparent, so dense areas build up gradually instead of saturating.
    ctx.globalAlpha = HEATMAP.blobAlpha * (HEATMAP.minWeight + (1 - HEATMAP.minWeight) * Math.sqrt(count / max));
    ctx.drawImage(blob, x - r, y - r);
  }

  // 2. Colour: intensity (alpha channel) → ramp colour
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const [cr, cg, cb, ca] = LUT[a];
    d[i] = cr;
    d[i + 1] = cg;
    d[i + 2] = cb;
    d[i + 3] = ca * 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

// Drawn over the map's current (zoomed/panned) position
export function drawHeatmap(ctx, view, image) {
  ctx.drawImage(image, view.x, view.y, view.mapW, view.mapH);
}
