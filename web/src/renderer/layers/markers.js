// Event markers: kills, deaths, storm deaths, loot.
// Only events that have happened by the current playback time are shown.
import { COLORS, MARKER } from "../../theme/visual.js";
import { drawShape } from "../shapes.js";

// events: [{ t, u, v, ... }] already filtered to one layer
// pulseWindow: match-seconds during which a new event shows a ring (0 = no rings)
export function drawMarkers(ctx, view, events, { shape, color }, { time, pulseWindow }) {
  const r = MARKER.size[shape] ?? 7;
  const outline = COLORS.outline;

  for (const e of events) {
    if (e.t > time) continue; // hasn't happened yet
    const [x, y] = view.toPx(e.u, e.v);

    // VFX: an expanding, fading ring right after the event happens
    const age = time - e.t;
    if (pulseWindow > 0 && age < pulseWindow) {
      const p = age / pulseWindow; // 0 → 1
      ctx.beginPath();
      ctx.arc(x, y, r + 4 + p * 14, 0, Math.PI * 2);
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    drawShape(ctx, shape, x, y, r, color, outline, MARKER.outlineWidth);
  }
}
