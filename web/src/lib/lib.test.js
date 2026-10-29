// Tests for the pure helpers. Run with `npm test`.
import { describe, expect, it } from "vitest";
import { filterMatches } from "./filterMatches.js";
import { formatDuration, mapLabel, matchSummary, plural } from "./format.js";

const match = (id, map, date, extra = {}) => ({
  id, map, date, duration: 300, humans: 1, bots: 0,
  counts: { kills: 0, deaths: 0, loot: 0, storm: 0 },
  ...extra,
});

describe("format", () => {
  it("formats durations as m:ss", () => {
    expect(formatDuration(372)).toBe("6:12");
    expect(formatDuration(5)).toBe("0:05");
  });
  it("splits map ids into words", () => {
    expect(mapLabel("AmbroseValley")).toBe("Ambrose Valley");
    expect(mapLabel("Lockdown")).toBe("Lockdown");
  });
  it("pluralises", () => {
    expect(plural(1, "bot", "bots")).toBe("1 bot");
    expect(plural(0, "bot", "bots")).toBe("0 bots");
  });
  it("summarises a match", () => {
    const m = match("fbbc5d02-dd79", "AmbroseValley", "February_10", { duration: 512, humans: 2, bots: 14 });
    expect(matchSummary(m, "Feb 10")).toBe("Match fbbc5d02 · Feb 10 · 8:32 · 2 humans, 14 bot paths");
  });
});

describe("filterMatches", () => {
  const all = [
    match("a", "AmbroseValley", "February_10", { bots: 3 }),
    match("b", "AmbroseValley", "February_11", { bots: 9 }),
    match("c", "Lockdown", "February_10", { bots: 20 }),
  ];

  it("keeps only the selected map and days", () => {
    const out = filterMatches(all, { mapId: "AmbroseValley", dates: new Set(["February_10"]), sortBy: "players" });
    expect(out.map((m) => m.id)).toEqual(["a"]);
  });
  it("sorts by most players", () => {
    const out = filterMatches(all, {
      mapId: "AmbroseValley", dates: new Set(["February_10", "February_11"]), sortBy: "players",
    });
    expect(out.map((m) => m.id)).toEqual(["b", "a"]);
  });
  it("returns nothing when no days are selected", () => {
    expect(filterMatches(all, { mapId: "AmbroseValley", dates: new Set(), sortBy: "players" })).toEqual([]);
  });
  it("does not change the original list", () => {
    const before = all.map((m) => m.id);
    filterMatches(all, { mapId: "AmbroseValley", dates: new Set(["February_10", "February_11"]), sortBy: "players" });
    expect(all.map((m) => m.id)).toEqual(before);
  });
});
