// Where was a player at a given time? Positions are recorded every ~5 s,
// so between two snapshots we move in a straight line (linear interpolation).

// path: [[t, u, v], ...] sorted by t. Returns [u, v], or null if the player
// isn't on the map at that time (before their first or after their last snapshot).
export function positionAt(path, time, maxGap = Infinity) {
  if (path.length === 0 || time < path[0][0] || time > path[path.length - 1][0]) return null;

  // Binary search: the last snapshot at or before `time`
  let lo = 0;
  let hi = path.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (path[mid][0] <= time) lo = mid;
    else hi = mid - 1;
  }

  const [t0, u0, v0] = path[lo];
  const next = path[lo + 1];
  // At the last snapshot, or across a long gap: stay at the last known spot
  if (!next || next[0] - t0 > maxGap || next[0] === t0) return [u0, v0];

  const [t1, u1, v1] = next;
  const f = (time - t0) / (t1 - t0); // 0 → at t0, 1 → at t1
  return [u0 + (u1 - u0) * f, v0 + (v1 - v0) * f];
}

// Index of the last snapshot at or before `time` (-1 if none). Used to draw "path so far".
export function lastIndexAtOrBefore(path, time) {
  let lo = 0;
  let hi = path.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (path[mid][0] <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}
