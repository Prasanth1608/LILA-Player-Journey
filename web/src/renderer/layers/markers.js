// Event markers: kills, deaths, storm deaths, loot.
import { COLORS, MARKER } from "../../theme/visual.js";
import { drawShape } from "../shapes.js";

// events: [{ u, v, ... }] already filtered to one layer
export function drawMarkers(ctx, view, events, { shape, color, outlineColor }) {
  const r = MARKER.size[shape] ?? 7;
  const outline = outlineColor ?? COLORS.outline;
  for (const e of events) {
    const [x, y] = view.toPx(e.u, e.v);
    drawShape(ctx, shape, x, y, r, color, outline, MARKER.outlineWidth);
  }
}
