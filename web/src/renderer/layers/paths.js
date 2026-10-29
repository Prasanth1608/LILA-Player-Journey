// Player/bot routes: lines joining each 5-second snapshot in time order,
// drawn only up to the current playback time.
import { COLORS, PATH } from "../../theme/visual.js";
import { lastIndexAtOrBefore, positionAt } from "../../lib/interpolate.js";
import { drawShape } from "../shapes.js";

// players: [{ path: [[t, u, v], ...] }]
// time: current match time. trailSeconds: null = whole path so far, or a number = only recent part.
export function drawPaths(ctx, view, players, color, { time, trailSeconds }) {
  for (const { path } of players) {
    const last = lastIndexAtOrBefore(path, time);
    if (last < 0) continue; // this player hasn't appeared yet

    // Screen points from the path's start up to now: [t, x, y]
    const all = path.slice(0, last + 1).map(([t, u, v]) => [t, ...view.toPx(u, v)]);
    // Extend to where the player is right now (between two snapshots)
    const head = positionAt(path, time, PATH.gapBreakSeconds);
    if (head && time > path[last][0]) all.push([time, ...view.toPx(...head)]);

    // Which part is visible: all so far, or only the last `trailSeconds`
    const first = trailSeconds == null ? 0 : Math.max(0, lastIndexAtOrBefore(path, time - trailSeconds));
    const pts = all.slice(first);

    drawLine(ctx, pts, color, time, trailSeconds);
    drawChevrons(ctx, all, first, color);

    // Start ● only if the beginning is visible; end ■ once the player's path is over
    if (first === 0) drawShape(ctx, "circle", pts[0][1], pts[0][2], PATH.endpointRadius, color, COLORS.outline, 1.5);
    const [endT, endU, endV] = path[path.length - 1];
    if (time >= endT) {
      const [ex, ey] = view.toPx(endU, endV);
      drawShape(ctx, "square", ex, ey, PATH.endpointRadius - 0.5, color, COLORS.outline, 1.5);
    }
  }
}

// The line itself. A long time gap starts a new segment (no fake straight line).
// In trail mode, each segment fades with age so the newest part is brightest.
function drawLine(ctx, pts, color, time, trailSeconds) {
  ctx.strokeStyle = color;
  ctx.lineWidth = PATH.width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (trailSeconds == null) {
    ctx.globalAlpha = PATH.alpha;
    ctx.beginPath();
    pts.forEach(([t, x, y], i) => {
      if (i === 0 || t - pts[i - 1][0] > PATH.gapBreakSeconds) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  } else {
    for (let i = 1; i < pts.length; i++) {
      const [t0, x0, y0] = pts[i - 1];
      const [t1, x1, y1] = pts[i];
      if (t1 - t0 > PATH.gapBreakSeconds) continue;
      const age = Math.min(1, (time - t1) / trailSeconds); // 0 = now, 1 = oldest
      ctx.globalAlpha = PATH.alpha * (1 - 0.8 * age);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

// Direction: chevrons every PATH.chevronSpacing screen pixels along the path.
// Distance is measured from the path's real start (not the visible part), so chevrons
// stay put during playback and in trail mode. Spacing is in screen pixels, so
// zooming in shows more of them.
function drawChevrons(ctx, pts, firstVisible, color) {
  const gap = PATH.chevronSpacing;
  let travelled = 0;          // screen distance from the path start
  let next = gap / 2;         // where the next chevron goes
  for (let i = 1; i < pts.length; i++) {
    const [t0, x0, y0] = pts[i - 1];
    const [t1, x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const jump = t1 - t0 > PATH.gapBreakSeconds; // no line here, so no chevron either
    while (next <= travelled + len) {
      if (!jump && i > firstVisible && len > 0) {
        const f = (next - travelled) / len;
        drawChevron(ctx, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, Math.atan2(y1 - y0, x1 - x0), color);
      }
      next += gap;
    }
    travelled += len;
  }
}

// ">" pointing along the direction of travel, dark underlay for contrast
function drawChevron(ctx, x, y, angle, color) {
  const s = PATH.chevronSize;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [stroke, width] of [[COLORS.outline, 4.5], [color, 2.2]]) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.8);
    ctx.lineTo(s * 0.5, 0);
    ctx.lineTo(-s * 0.5, s * 0.8);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.restore();
}
