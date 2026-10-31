// Heatmap colouring maths. Pure functions (no DOM), so they're unit-tested.
//
// field:  density across the whole map, size × size values from 0 (nothing) to 1 (busiest
//         spot in the selection). Built once per selection (layers/heatmap.js).
// paintHeat samples the field for exactly what is on screen, so it can be redrawn sharp
// at any zoom, and the levels never change when you zoom or pan.

// Raw blob intensity (0–255) → smoothed field scaled to 0–1
export function normaliseField(intensity, size, smooth = 0) {
  const values = smooth > 0 ? boxBlur(boxBlur(intensity, size, size, smooth), size, size, smooth) : Float32Array.from(intensity);
  let max = 0;
  for (const v of values) if (v > max) max = v;
  if (max > 0) for (let i = 0; i < values.length; i++) values[i] /= max;
  return values;
}

// view:  { x, y, mapW, mapH } — where the whole map sits on screen (CSS px), from viewport.js
// out:   outW × outH pixels covering the screen; scale = output pixels per CSS pixel
// Returns RGBA bytes. Colour and opacity are smoothly interpolated between palette stops;
// there are no threshold outlines or separately painted Low/Medium/High regions.
export function paintHeat(field, size, view, outW, outH, scale, levels) {
  // 1. Density at each screen pixel (bilinear sample; 0 off the map)
  const t = new Float32Array(outW * outH);
  for (let oy = 0; oy < outH; oy++) {
    const fy = ((oy + 0.5) / scale - view.y) / view.mapH;
    if (fy < 0 || fy >= 1) continue;
    for (let ox = 0; ox < outW; ox++) {
      const fx = ((ox + 0.5) / scale - view.x) / view.mapW;
      if (fx < 0 || fx >= 1) continue;
      t[oy * outW + ox] = sample(field, size, fx * size - 0.5, fy * size - 0.5);
    }
  }

  // 2. Prepare continuous colour/opacity stops. Each level defines a smooth segment
  // from its `from` value to the next stop (or density 1 for the final stop).
  // `edge` is intentionally ignored: contour partitions are not part of this style.
  const stops = levels.map((level) => ({
    at: level.from,
    rgb: level.rgb,
    alphaFrom: level.fill[0],
    alphaTo: level.fill[1],
  })).sort((a, b) => a.at - b.at);
  const out = new Uint8ClampedArray(outW * outH * 4);
  if (stops.length === 0) return out;
  const first = stops[0];

  for (let i = 0; i < t.length; i++) {
    const value = t[i];
    if (value <= 0) continue;

    if (value < first.at) {
      // Fade in from transparent before the first palette stop.
      const alpha = first.alphaFrom * smoothstep(0, first.at, value);
      writePixel(out, i, first.rgb, alpha);
      continue;
    }

    let k = 0;
    while (k < stops.length - 1 && value >= stops[k + 1].at) k++;
    const left = stops[k];
    const right = stops[Math.min(k + 1, stops.length - 1)];
    const end = k + 1 < stops.length ? right.at : 1;
    const u = smoothstep(left.at, end, value);
    const rgb = [0, 1, 2].map((channel) =>
      left.rgb[channel] + (right.rgb[channel] - left.rgb[channel]) * u
    );
    const alpha = left.alphaFrom + (left.alphaTo - left.alphaFrom) * u;
    writePixel(out, i, rgb, alpha);
  }
  return out;
}

function smoothstep(min, max, value) {
  if (max <= min) return value >= max ? 1 : 0;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

function writePixel(out, index, rgb, alpha) {
  const offset = index * 4;
  out[offset] = rgb[0];
  out[offset + 1] = rgb[1];
  out[offset + 2] = rgb[2];
  out[offset + 3] = Math.max(0, Math.min(255, alpha * 255));
}

// Bilinear interpolation between the 4 nearest field values (clamped at the edges)
function sample(field, size, x, y) {
  const x0 = Math.max(0, Math.min(size - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(size - 1, Math.floor(y)));
  const x1 = Math.min(size - 1, x0 + 1);
  const y1 = Math.min(size - 1, y0 + 1);
  const dx = Math.max(0, Math.min(1, x - x0));
  const dy = Math.max(0, Math.min(1, y - y0));
  const top = field[y0 * size + x0] * (1 - dx) + field[y0 * size + x1] * dx;
  const bottom = field[y1 * size + x0] * (1 - dx) + field[y1 * size + x1] * dx;
  return top * (1 - dy) + bottom * dy;
}

// Average of each pixel's (2r+1)×(2r+1) neighbourhood, done as two 1-D passes (fast).
// Run twice it's close to a soft Gaussian blur.
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const pass = (from, to, len, count, step, lineStep) => {
    for (let line = 0; line < count; line++) {
      const base = line * lineStep;
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += from[base + Math.min(len - 1, Math.max(0, k)) * step];
      for (let k = 0; k < len; k++) {
        to[base + k * step] = sum / (2 * r + 1);
        sum += from[base + Math.min(len - 1, k + r + 1) * step] - from[base + Math.max(0, k - r) * step];
      }
    }
  };
  pass(src, tmp, w, h, 1, w);  // rows
  pass(tmp, out, h, w, w, 1);  // columns
  return out;
}
