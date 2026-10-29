import { describe, expect, it } from "vitest";
import { HOME, clampCamera, createViewport, panBy, zoomAt } from "./viewport.js";

const LIMITS = { min: 1, max: 8 };

describe("viewport", () => {
  it("at home, maps u/v to the whole canvas (v flipped)", () => {
    const view = createViewport(200, 100);
    expect(view.toPx(0, 1)).toEqual([0, 0]);
    expect(view.toPx(1, 0)).toEqual([200, 100]);
    expect(view.toFraction(100, 50)).toEqual([0.5, 0.5]);
  });

  it("zooming keeps the point under the pointer fixed", () => {
    const cam = zoomAt(HOME, 2, 50, 50, 200, 200, LIMITS);
    const view = createViewport(200, 200, cam);
    expect(cam.zoom).toBe(2);
    expect(view.toFraction(50, 50)).toEqual([0.25, 0.25]);
  });

  it("clamps zoom to the limits", () => {
    expect(zoomAt(HOME, 0.5, 100, 100, 200, 200, LIMITS).zoom).toBe(1);
    expect(zoomAt(HOME, 100, 100, 100, 200, 200, LIMITS).zoom).toBe(8);
  });

  it("never pans past the map edge", () => {
    const zoomed = { zoom: 2, fx: 0.5, fy: 0.5 };
    const cam = panBy(zoomed, 10_000, -10_000, 200, 200, LIMITS);
    const view = createViewport(200, 200, cam);
    expect(view.x).toBe(0);                 // left edge pinned
    expect(view.y + view.mapH).toBe(200);   // bottom edge pinned
  });

  it("at zoom 1 the map cannot move", () => {
    expect(clampCamera({ zoom: 1, fx: 0.9, fy: 0.1 }, LIMITS)).toEqual(HOME);
  });
});
