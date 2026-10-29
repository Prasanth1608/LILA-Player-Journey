import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlaybackClock } from "./PlaybackClock.js";

// Animation frames are driven by hand, so the tests don't depend on real time
let frames;
beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (fn) => frames.push(fn));
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
const runFrame = (now) => frames.shift()(now);

describe("PlaybackClock", () => {
  it("opens a match paused on its end state", () => {
    const c = new PlaybackClock();
    c.load(300);
    expect(c.time).toBe(300);
    expect(c.playing).toBe(false);
  });

  it("restarts from 0:00 when play is pressed at the end", () => {
    const c = new PlaybackClock();
    c.load(300);
    c.play();
    expect(c.time).toBe(0);
    expect(c.playing).toBe(true);
  });

  it("advances by real time × speed", () => {
    const c = new PlaybackClock();
    c.load(300);
    c.seek(0);
    c.setSpeed(10);
    vi.spyOn(performance, "now").mockReturnValue(1000);
    c.play();
    runFrame(1500);            // 0.5 real seconds later
    expect(c.time).toBe(5);    // 0.5 × 10
  });

  it("stops at the end", () => {
    const c = new PlaybackClock();
    c.load(10);
    c.seek(9);
    c.setSpeed(40);
    vi.spyOn(performance, "now").mockReturnValue(0);
    c.play();
    runFrame(1000);
    expect(c.time).toBe(10);
    expect(c.playing).toBe(false);
  });

  it("keeps seeks inside the match", () => {
    const c = new PlaybackClock();
    c.load(100);
    c.seek(-5);
    expect(c.time).toBe(0);
    c.seek(500);
    expect(c.time).toBe(100);
  });

  it("notifies subscribers and lets them unsubscribe", () => {
    const c = new PlaybackClock();
    const seen = [];
    const stop = c.subscribe((clock) => seen.push(clock.time));
    c.load(50);
    stop();
    c.seek(10);
    expect(seen).toEqual([50]);
  });
});
