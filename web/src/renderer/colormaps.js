// Turns a value from 0 to 1 into a colour on the heatmap ramp (theme/visual.js).
import { HEATMAP } from "../theme/visual.js";

// Returns [r, g, b, a] with a in 0–1, blending between the two nearest stops
export function rampColor(t) {
  const stops = HEATMAP.stops;
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    if (t <= p1) {
      const [p0, c0] = stops[i - 1];
      const f = (t - p0) / (p1 - p0);
      return c0.map((v, k) => v + (c1[k] - v) * f);
    }
  }
  return stops[stops.length - 1][1];
}

// CSS gradient of the same ramp, for the legend
export function rampCss() {
  return `linear-gradient(to right, ${HEATMAP.stops
    .map(([p, [r, g, b, a]]) => `rgba(${r}, ${g}, ${b}, ${Math.max(a, 0.15)}) ${p * 100}%`)
    .join(", ")})`;
}
