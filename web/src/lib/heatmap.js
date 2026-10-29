// Heatmap maths. Pure functions (no React, no canvas), easy to test.
// Data shape: pipeline/DATA_CONTRACT.md → heatmaps/<map>.json (version 2).

// Adds up the ticked matches, separately for every metric.
// Returns { arrays: { metric: Float32Array(grid × grid) }, totals: { metric: number } }
export function metricArrays(heatFile, matchIds) {
  const size = heatFile.grid * heatFile.grid;
  const arrays = {};
  const totals = {};
  for (const metric of heatFile.metrics) {
    arrays[metric] = new Float32Array(size);
    totals[metric] = 0;
  }
  for (const id of matchIds) {
    const match = heatFile.matches[id];
    if (!match) continue; // a match with no heat (e.g. no rows on the map)
    for (const [metric, flat] of Object.entries(match)) {
      const arr = arrays[metric];
      if (!arr) continue; // a metric this website doesn't know yet
      for (let i = 0; i < flat.length; i += 2) {
        arr[flat[i]] += flat[i + 1]; // flat = [cell, count, cell, count, ...]
        totals[metric] += flat[i + 1];
      }
    }
  }
  return { arrays, totals };
}

// Adds metrics of the SAME unit (e.g. player + bot traffic) into one count per cell.
// Returns { counts, max } or null when there's nothing to show.
export function sumMetrics(arrays, metricIds) {
  const parts = metricIds.map((id) => arrays[id]).filter(Boolean);
  if (parts.length === 0) return null;
  const counts = parts.length === 1 ? parts[0] : new Float32Array(parts[0].length);
  if (parts.length > 1) {
    for (const arr of parts) for (let i = 0; i < arr.length; i++) counts[i] += arr[i];
  }
  let max = 0;
  for (const c of counts) if (c > max) max = c;
  return max > 0 ? { counts, max } : null;
}

// Grid cell under a point given as fractions of the image (0–1 across, 0–1 down)
export function cellAt(xFraction, yFraction, grid) {
  const col = Math.min(grid - 1, Math.max(0, Math.floor(xFraction * grid)));
  const row = Math.min(grid - 1, Math.max(0, Math.floor(yFraction * grid)));
  return row * grid + col;
}
