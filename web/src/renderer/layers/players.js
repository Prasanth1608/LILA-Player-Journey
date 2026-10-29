// The moving dot for each player during playback: where they are right now,
// smoothly placed between their 5-second snapshots.
import { COLORS, PATH, PLAYBACK } from "../../theme/visual.js";
import { positionAt } from "../../lib/interpolate.js";

export function drawPlayerHeads(ctx, view, players, color, time) {
  for (const { path } of players) {
    if (path.length === 0 || time >= path[path.length - 1][0]) continue; // finished: the end ■ shows instead
    const pos = positionAt(path, time, PATH.gapBreakSeconds);
    if (!pos) continue; // not on the map yet
    const [x, y] = view.toPx(...pos);

    ctx.beginPath();
    ctx.arc(x, y, PLAYBACK.headRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";     // white ring: "this is where they are now"
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.outline;
    ctx.beginPath();
    ctx.arc(x, y, PLAYBACK.headRadius + 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}
