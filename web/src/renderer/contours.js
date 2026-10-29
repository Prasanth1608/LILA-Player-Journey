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
// Returns RGBA bytes. Each pixel: its level's colour with a fill that deepens with density,
// plus an anti-aliased outline of even width where the density crosses a level's threshold.
export function paintHeat(field, size, view, outW, outH, scale, levels, lineWidth) {
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

  // 2. Colour. Level settings are copied into flat arrays first: this loop runs for
  // every screen pixel, so it avoids creating objects or arrays per pixel.
  const n = levels.length;
  const from = levels.map((l) => l.from);
  const end = levels.map((l, k) => (k + 1 < n ? levels[k + 1].from : 1));
  const fillLo = levels.map((l) => l.fill[0]);
  const fillHi = levels.map((l) => l.fill[1]);
  const edge = levels.map((l) => l.edge);
  const R = levels.map((l) => l.rgb[0]), G = levels.map((l) => l.rgb[1]), B = levels.map((l) => l.rgb[2]);
  const out = new Uint8ClampedArray(outW * outH * 4);
  const reach = (lineWidth * scale) / 2 + 0.5; // outline visible within this many pixels of a threshold
  for (let y = 0; y < outH; y++) {
    const up = y > 0 ? outW : 0;
    const down = y < outH - 1 ? outW : 0;
    for (let x = 0; x < outW; x++) {
      const i = y * outW + x;
      const v = t[i];
      // Fill: highest level reached, deeper the further into that level
      let l = 0;
      while (l < n && v >= from[l]) l++;
      let fa = 0;
      if (l > 0) {
        const k = l - 1;
        const into = (v - from[k]) / (end[k] - from[k]);
        fa = fillLo[k] + (fillHi[k] - fillLo[k]) * (into < 1 ? into : 1);
      }
      // Outline: distance to the nearest threshold in pixels (value gap ÷ slope)
      const gx = (t[x < outW - 1 ? i + 1 : i] - t[x > 0 ? i - 1 : i]) * 0.5;
      const gy = (t[i + down] - t[i - up]) * 0.5;
      const slope = Math.sqrt(gx * gx + gy * gy);
      let la = 0, lk = 0;
      if (slope > 1e-6) {
        for (let k = 0; k < n; k++) {
          const d = (v > from[k] ? v - from[k] : from[k] - v) / slope;
          if (d >= reach) continue;
          let a = reach - d;
          if (a > 1) a = 1;
          a *= edge[k];
          if (a > la) { la = a; lk = k; }
        }
      }
      // Outline over fill
      const a = la + fa * (1 - la);
      if (a <= 0) continue;
      const kf = l > 0 ? l - 1 : 0;
      const wf = (fa * (1 - la)) / a;
      const wl = la / a;
      const o = i * 4;
      out[o] = R[lk] * wl + R[kf] * wf;
      out[o + 1] = G[lk] * wl + G[kf] * wf;
      out[o + 2] = B[lk] * wl + B[kf] * wf;
      out[o + 3] = a * 255;
    }
  }
  return out;
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
