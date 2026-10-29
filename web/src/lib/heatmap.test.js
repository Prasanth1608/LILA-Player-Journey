import { describe, expect, it } from "vitest";
import { cellAt, metricArrays, sumMetrics } from "./heatmap.js";
import { metricIdsFor } from "../config/heatmapMetrics.js";
import { rampColor } from "../renderer/colormaps.js";
import { HEATMAP } from "../theme/visual.js";

const file = {
  grid: 2,
  metrics: ["traffic_players", "traffic_bots", "kills_players"],
  matches: {
    a: { traffic_players: [0, 100, 3, 50], traffic_bots: [3, 30], kills_players: [3, 1] },
    b: { traffic_players: [0, 20] },
  },
};

describe("metricArrays", () => {
  it("adds up only the ticked matches", () => {
    const { arrays, totals } = metricArrays(file, ["a", "b"]);
    expect([...arrays.traffic_players]).toEqual([120, 0, 0, 50]);
    expect(totals).toEqual({ traffic_players: 170, traffic_bots: 30, kills_players: 1 });
  });
  it("ignores unknown matches and is empty with none ticked", () => {
    expect(metricArrays(file, ["zzz"]).totals.traffic_players).toBe(0);
    expect(metricArrays(file, []).totals.kills_players).toBe(0);
  });
});

describe("sumMetrics", () => {
  const { arrays } = metricArrays(file, ["a"]);
  it("returns one metric as is", () => {
    const h = sumMetrics(arrays, ["traffic_players"]);
    expect([...h.counts]).toEqual([100, 0, 0, 50]);
    expect(h.max).toBe(100);
  });
  it("adds players + bots of the same metric (Both)", () => {
    const h = sumMetrics(arrays, ["traffic_players", "traffic_bots"]);
    expect([...h.counts]).toEqual([100, 0, 0, 80]);
  });
  it("returns null when there's nothing to show", () => {
    expect(sumMetrics(arrays, [])).toBeNull();
    expect(sumMetrics(metricArrays(file, []).arrays, ["kills_players"])).toBeNull();
  });
});

describe("metricIdsFor", () => {
  it("maps a selection to pipeline metric ids", () => {
    expect(metricIdsFor({ group: "kills", side: "players" })).toEqual(["kills_players"]);
    expect(metricIdsFor({ group: "traffic", side: "both" })).toEqual(["traffic_players", "traffic_bots"]);
  });
  it("has no bot loot", () => {
    expect(metricIdsFor({ group: "loot", side: "bots" })).toEqual([]);
    expect(metricIdsFor({ group: "loot", side: "both" })).toEqual([]);
  });
});

describe("cellAt", () => {
  it("maps image fractions to grid cells, clamped at the edges", () => {
    expect(cellAt(0, 0, 2)).toBe(0);
    expect(cellAt(0.99, 0.99, 2)).toBe(3);
    expect(cellAt(1, 1, 2)).toBe(3);
  });
});

describe("rampColor", () => {
  it("returns the first and last stops at the ends", () => {
    expect(rampColor(0)).toEqual(HEATMAP.stops[0][1]);
    expect(rampColor(1)).toEqual(HEATMAP.stops[HEATMAP.stops.length - 1][1]);
  });
});
