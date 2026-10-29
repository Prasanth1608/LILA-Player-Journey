// Small display helpers. Pure functions: no React, easy to test.

// 372 → "6:12"
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// "AmbroseValley" → "Ambrose Valley"
export function mapLabel(mapId) {
  return mapId.replace(/([a-z])([A-Z])/g, "$1 $2");
}

// "fbbc5d02-dd79-42fb-…" → "fbbc5d02" (enough to tell matches apart)
export function shortId(id) {
  return id.slice(0, 8);
}

// 1 → "1 bot", 3 → "3 bots"
export function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

// One-line description of a match, shown above the map:
// "Match fbbc5d02 · Feb 10 · 8:32 · 2 humans, 14 bot paths"
// "bot paths" = bots whose own movement was recorded (not how many bots were in the match).
export function matchSummary(match, dateLabel) {
  return [
    `Match ${shortId(match.id)}`,
    dateLabel,
    formatDuration(match.duration),
    `${plural(match.humans, "human", "humans")}, ${plural(match.bots, "bot path", "bot paths")}`,
  ].join(" · ");
}
