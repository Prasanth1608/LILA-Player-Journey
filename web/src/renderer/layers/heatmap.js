// Heatmap drawing, in two steps:
//   1. buildField (once per selection): each grid cell with a count draws a soft round
//      blob into a map-sized canvas; busier cells draw stronger blobs and overlaps add up.
//      Smoothed and scaled to 0–1 → the density field.
//   2. paintHeatCanvas (per view): renderer/contours.js samples the field for exactly
//      what is on screen and paints one continuous colour/opacity fog, without partitions.
import { HEATMAP } from "../../theme/visual.js";
import { normaliseField, paintHeat } from "../contours.js";

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

// counts: count per grid cell; max: busiest cell → { data, size } density field (0–1)
export function buildField(counts, max, grid) {
  const size = HEATMAP.fieldSize;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const cell = size / grid;
  const r = Math.round(Math.max(HEATMAP.minRadius, cell * HEATMAP.radiusCells));
  const blob = blobSprite(r);
  for (let i = 0; i < counts.length; i++) {
    const count = counts[i];
    if (count === 0) continue;
    // Square root spreads the range so a few very busy cells don't hide the rest
    ctx.globalAlpha = HEATMAP.blobAlpha * (HEATMAP.minWeight + (1 - HEATMAP.minWeight) * Math.sqrt(count / max));
    ctx.drawImage(blob, ((i % grid) + 0.5) * cell - r, (Math.floor(i / grid) + 0.5) * cell - r);
  }
  const pixels = ctx.getImageData(0, 0, size, size).data;
  const intensity = new Uint8Array(size * size);
  for (let i = 0; i < intensity.length; i++) intensity[i] = pixels[i * 4 + 3];
  return { data: normaliseField(intensity, size, HEATMAP.smooth), size };
}

// The coloured overlay for one view, at screen resolution (CSS size × pixel ratio)
export function paintHeatCanvas(field, view, pixelRatio, levels = HEATMAP.levels) {
  const w = Math.max(1, Math.round(view.width * pixelRatio));
  const h = Math.max(1, Math.round(view.height * pixelRatio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(w, h);
  image.data.set(paintHeat(field.data, field.size, view, w, h, pixelRatio, levels));
  ctx.putImageData(image, 0, 0);
  return canvas;
}
