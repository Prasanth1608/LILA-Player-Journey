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

    // Which snapshots are visible: all so far, or only the last `trailSeconds`
    const first = trailSeconds == null ? 0 : Math.max(0, lastIndexAtOrBefore(path, time - trailSeconds));
    const pts = path.slice(first, last + 1).map(([t, u, v]) => [t, ...view.toPx(u, v)]); // [t, x, y]

    // Extend the line to where the player is right now (between two snapshots)
    const head = positionAt(path, time, PATH.gapBreakSeconds);
    if (head && time > path[last][0]) pts.push([time, ...view.toPx(...head)]);

    drawLine(ctx, pts, color, time, trailSeconds);
    drawArrows(ctx, pts, color, first);

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

// Direction: an arrowhead on every Nth segment that actually moves.
// Counting from the path's real start (offset) keeps arrows in place while playback runs.
function drawArrows(ctx, pts, color, offset) {
  for (let i = 1; i < pts.length; i++) {
    const [t0, x0, y0] = pts[i - 1];
    const [t1, x1, y1] = pts[i];
    if (t1 - t0 > PATH.gapBreakSeconds || Math.hypot(x1 - x0, y1 - y0) < PATH.minMovePx) continue;
    if ((i + offset) % PATH.arrowEvery === 0) {
      drawArrowhead(ctx, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), color);
    }
  }
}

function drawArrowhead(ctx, x, y, angle, color) {
  const s = PATH.arrowSize;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.6, s * 0.6);
  ctx.lineTo(-s * 0.6, -s * 0.6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  ctx.restore();
}
