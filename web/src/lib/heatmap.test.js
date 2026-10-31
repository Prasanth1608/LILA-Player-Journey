import { describe, expect, it } from "vitest";
import { cellAt, metricArrays, sumMetrics } from "./heatmap.js";
import { metricIdsFor, selectionFromKey, selectionKey, toggleHeatSelection } from "../config/heatmapMetrics.js";
import { HEATMAP, heatLevelsFor } from "../theme/visual.js";

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

describe("multi-metric selection and palettes", () => {
  it("round-trips independent metric selections", () => {
    const selection = { group: "kills", side: "players" };
    expect(selectionFromKey(selectionKey(selection))).toEqual(selection);
  });
  it("keeps Both exclusive with its Players and Bots constituent selections", () => {
    const players = toggleHeatSelection(new Set(["traffic:both"]), "traffic:players");
    expect([...players]).toEqual(["traffic:players"]);
    const both = toggleHeatSelection(new Set(["traffic:players", "traffic:bots"]), "traffic:both");
    expect([...both]).toEqual(["traffic:both"]);
  });
  it("provides distinct three-shade palettes for each metric family", () => {
    const groups = ["traffic", "kills", "deaths", "storm", "loot"];
    const palettes = groups.map((group) => heatLevelsFor(group).map((level) => level.rgb.join(",")));
    expect(palettes.every((palette) => palette.length === 3)).toBe(true);
    expect(new Set(palettes.map((palette) => palette[1])).size).toBe(groups.length);
    expect(heatLevelsFor("traffic", "players")[1].rgb).not.toEqual(heatLevelsFor("traffic", "bots")[1].rgb);
    expect(HEATMAP.levels).toHaveLength(3);
    for (const group of groups) {
      const levels = heatLevelsFor(group);
      expect(levels[2].fill[1]).toBeGreaterThan(levels[1].fill[1]);
      expect(levels[2].fill[1]).toBeGreaterThanOrEqual(0.8);
    }
    expect(HEATMAP.smooth).toBe(3);
  });
});

describe("cellAt", () => {
  it("maps image fractions to grid cells, clamped at the edges", () => {
    expect(cellAt(0, 0, 2)).toBe(0);
    expect(cellAt(0.99, 0.99, 2)).toBe(3);
    expect(cellAt(1, 1, 2)).toBe(3);
  });
});


import { normaliseField, paintHeat } from "../renderer/contours.js";

describe("heatmap painting (renderer/contours.js)", () => {
  const LEVELS = [
    { from: 0.2, rgb: [0, 255, 0], fill: [0.0, 0.3], edge: 0 },
    { from: 0.6, rgb: [255, 0, 0], fill: [0.3, 0.7], edge: 0 },
  ];
  // 8×8 field rising from 0 (left) to 1 (right)
  const size = 8;
  const field = Float32Array.from({ length: size * size }, (_, i) => (i % size) / (size - 1));
  const alphaAt = (px, w, x, y) => px[(y * w + x) * 4 + 3];

  it("scales the field so the busiest spot is 1", () => {
    const f = normaliseField(new Uint8Array([0, 50, 100, 200]), 2);
    expect(Math.max(...f)).toBe(1);
    expect(f[1]).toBeCloseTo(0.25);
  });

  it("deepens the fill with density inside a level", () => {
    const view = { x: 0, y: 0, mapW: 80, mapH: 80 };
    const px = paintHeat(field, size, view, 80, 80, 1, LEVELS);
    expect(alphaAt(px, 80, 76, 40)).toBeGreaterThan(alphaAt(px, 80, 60, 40)); // both red; right is busier
  });

  it("leaves areas below the first level and off the map transparent", () => {
    const view = { x: 40, y: 0, mapW: 80, mapH: 80 };  // map shifted right: x < 40 is off the map
    const px = paintHeat(field, size, view, 80, 80, 1, LEVELS);
    expect(alphaAt(px, 80, 10, 40)).toBe(0);            // off the map
    expect(alphaAt(px, 80, 42, 40)).toBe(0);            // on the map, density ≈ 0
  });

  it("gives the same colour at the same map point whatever the zoom (levels never shift)", () => {
    const whole = paintHeat(field, size, { x: 0, y: 0, mapW: 80, mapH: 80 }, 80, 80, 1, LEVELS);
    const zoom4 = paintHeat(field, size, { x: -240, y: 0, mapW: 320, mapH: 320 }, 80, 80, 1, LEVELS);
    // map point u = 0.9: x = 72 in the whole view; x = -240 + 0.9 × 320 = 48 in the zoomed view
    expect(Math.abs(alphaAt(whole, 80, 72, 10) - alphaAt(zoom4, 80, 48, 40))).toBeLessThan(8);
  });

  it("blends colours and opacity continuously without drawing contour partitions", () => {
    const view = { x: 0, y: 0, mapW: 80, mapH: 80 };
    const px = paintHeat(field, size, view, 80, 80, 1, LEVELS);
    const samplePixel = (x) => {
      const offset = (40 * 80 + x) * 4;
      return [...px.slice(offset, offset + 4)];
    };
    const before = samplePixel(43);
    const at = samplePixel(44);
    const after = samplePixel(45);
    expect(before[3]).toBeGreaterThan(0);
    expect(at[3]).toBeGreaterThan(before[3]);
    expect(after[3]).toBeGreaterThan(at[3]);
    // Colour changes gradually across the former 0.6 boundary.
    expect(Math.abs(after[0] - at[0])).toBeLessThan(20);
    expect(Math.abs(at[0] - before[0])).toBeLessThan(20);
  });
});

describe("unvisitedCells", () => {
  it("marks a cell unvisited only when both human and bot traffic are zero", async () => {
    const { unvisitedCells } = await import("./heatmap.js");
    const result = unvisitedCells({
      traffic_players: Float32Array.from([0, 1, 0, 0]),
      traffic_bots: Float32Array.from([0, 0, 1, 0]),
    });
    expect([...result.counts]).toEqual([1, 0, 0, 1]);
    expect(result.total).toBe(2);
  });
  it("returns null when every cell has at least one human or bot visit", async () => {
    const { unvisitedCells } = await import("./heatmap.js");
    expect(unvisitedCells({
      traffic_players: Float32Array.from([1, 0]),
      traffic_bots: Float32Array.from([0, 1]),
    })).toBeNull();
  });
});
