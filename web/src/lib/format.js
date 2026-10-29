// Small display helpers. Pure functions: no React, easy to test.

// 372 → "6:12"
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Match start time of day, in UTC (the data's clock): 1739176680 → "08:38 UTC".
// UTC, not local time, so it always agrees with the day label (which comes from the data).
export function formatStartUtc(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

// Match length for lists: 518 → "8m 38s" (can't be mistaken for a time of day)
export function formatLength(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

// "AmbroseValley" → "Ambrose Valley"
export function mapLabel(mapId) {
  return mapId.replace(/([a-z])([A-Z])/g, "$1 $2");
}

// "fbbc5d02-dd79-42fb-…" → "fbbc5d02" (enough to tell matches apart)
export function shortId(id) {
  return id.slice(0, 8);
}

// 1 → "1 bot", 3 → "3 bots", 70412 → "70,412 bots"
export function plural(count, one, many) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
}

// One-line description of a match, shown above the map:
// "Match fbbc5d02 · Feb 10 · 8:32 · 2 humans, 14 bot paths"
// "bot paths" = bots whose own movement was recorded (not how many bots were in the match).
export function matchSummary(match, dateLabel) {
  return [
    `Match ${shortId(match.id)}`,
    dateLabel,
    ...(match.start != null ? [formatStartUtc(match.start)] : []),
    formatLength(match.duration),
    `${plural(match.humans, "human", "humans")}, ${plural(match.bots, "bot path", "bot paths")}`,
  ].join(" · ");
}
