// Player/bot routes: lines joining each 5-second snapshot in time order.
import { COLORS, PATH } from "../../theme/visual.js";
import { drawShape } from "../shapes.js";

// players: [{ path: [[t, u, v], ...] }]
export function drawPaths(ctx, view, players, color) {
  for (const player of players) {
    const pts = player.path.map(([t, u, v]) => [t, ...view.toPx(u, v)]); // [t, x, y]
    if (pts.length === 0) continue;

    // 1. The line. A long time gap starts a new segment instead of drawing
    //    a straight line across the map that the player never walked.
    ctx.beginPath();
    pts.forEach(([t, x, y], i) => {
      const gap = i > 0 && t - pts[i - 1][0] > PATH.gapBreakSeconds;
      if (i === 0 || gap) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.globalAlpha = PATH.alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = PATH.width;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 2. Direction: a small arrowhead on every Nth segment that actually moves
    let moving = 0;
    for (let i = 1; i < pts.length; i++) {
      const [t0, x0, y0] = pts[i - 1];
      const [t1, x1, y1] = pts[i];
      if (t1 - t0 > PATH.gapBreakSeconds || Math.hypot(x1 - x0, y1 - y0) < PATH.minMovePx) continue;
      if (moving++ % PATH.arrowEvery === 0) {
        drawArrowhead(ctx, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), color);
      }
    }

    // 3. Start ● and end ■
    const [, sx, sy] = pts[0];
    const [, ex, ey] = pts[pts.length - 1];
    drawShape(ctx, "circle", sx, sy, PATH.endpointRadius, color, COLORS.outline, 1.5);
    drawShape(ctx, "square", ex, ey, PATH.endpointRadius - 0.5, color, COLORS.outline, 1.5);
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
