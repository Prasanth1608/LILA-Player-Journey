import { describe, expect, it } from "vitest";
import { lastIndexAtOrBefore, positionAt } from "./interpolate.js";

const path = [
  [0, 0.0, 0.0],
  [10, 1.0, 0.5],
  [40, 1.0, 1.0],   // 30 s gap before this one
];

describe("positionAt", () => {
  it("is exact on a snapshot", () => {
    expect(positionAt(path, 10)).toEqual([1.0, 0.5]);
  });
  it("moves in a straight line between snapshots", () => {
    expect(positionAt(path, 5)).toEqual([0.5, 0.25]);
  });
  it("is null before the first and after the last snapshot", () => {
    expect(positionAt(path, -1)).toBeNull();
    expect(positionAt(path, 41)).toBeNull();
  });
  it("holds the last known spot across a long gap", () => {
    expect(positionAt(path, 25, 20)).toEqual([1.0, 0.5]);
  });
  it("handles an empty path", () => {
    expect(positionAt([], 0)).toBeNull();
  });
});

describe("lastIndexAtOrBefore", () => {
  it("finds the snapshot at or before a time", () => {
    expect(lastIndexAtOrBefore(path, -1)).toBe(-1);
    expect(lastIndexAtOrBefore(path, 0)).toBe(0);
    expect(lastIndexAtOrBefore(path, 39)).toBe(1);
    expect(lastIndexAtOrBefore(path, 100)).toBe(2);
  });
});
