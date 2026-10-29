import { describe, expect, it } from "vitest";
import { cellAt, metricArrays, sumMetrics } from "./heatmap.js";
import { metricIdsFor } from "../config/heatmapMetrics.js";
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


import { normaliseField, paintHeat } from "../renderer/contours.js";

describe("heatmap painting (renderer/contours.js)", () => {
  const LEVELS = [
    { from: 0.2, rgb: [0, 255, 0], fill: [0.1, 0.3], edge: 1 },
    { from: 0.6, rgb: [255, 0, 0], fill: [0.2, 0.6], edge: 1 },
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
    const px = paintHeat(field, size, view, 80, 80, 1, LEVELS, 1);
    expect(alphaAt(px, 80, 76, 40)).toBeGreaterThan(alphaAt(px, 80, 60, 40)); // both red; right is busier
  });

  it("leaves areas below the first level and off the map transparent", () => {
    const view = { x: 40, y: 0, mapW: 80, mapH: 80 };  // map shifted right: x < 40 is off the map
    const px = paintHeat(field, size, view, 80, 80, 1, LEVELS, 1);
    expect(alphaAt(px, 80, 10, 40)).toBe(0);            // off the map
    expect(alphaAt(px, 80, 42, 40)).toBe(0);            // on the map, density ≈ 0
  });

  it("gives the same colour at the same map point whatever the zoom (levels never shift)", () => {
    const whole = paintHeat(field, size, { x: 0, y: 0, mapW: 80, mapH: 80 }, 80, 80, 1, LEVELS, 1);
    const zoom4 = paintHeat(field, size, { x: -240, y: 0, mapW: 320, mapH: 320 }, 80, 80, 1, LEVELS, 1);
    // map point u = 0.9: x = 72 in the whole view; x = -240 + 0.9 × 320 = 48 in the zoomed view
    expect(Math.abs(alphaAt(whole, 80, 72, 10) - alphaAt(zoom4, 80, 48, 40))).toBeLessThan(8);
  });

  it("draws a thin outline where density crosses a level", () => {
    const view = { x: 0, y: 0, mapW: 700, mapH: 70 };   // stretched wide: ~100 px per field cell
    const px = paintHeat(field, size, view, 700, 70, 1, LEVELS, 2);
    // threshold 0.6 is at field x = 0.6 × 7 = 4.2 → screen x ≈ (4.2 + 0.5) / 8 × 700 ≈ 411
    let peak = 0, at = 0;
    for (let x = 380; x < 440; x++) if (alphaAt(px, 700, x, 35) > peak) { peak = alphaAt(px, 700, x, 35); at = x; }
    expect(peak).toBe(255);
    expect(Math.abs(at - 411)).toBeLessThan(3);
    expect(alphaAt(px, 700, at + 6, 35)).toBeLessThan(200); // a few px away it's just fill
  });
});
