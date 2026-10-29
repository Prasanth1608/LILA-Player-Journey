// Draws the minimap and the enabled layers on a <canvas>, at the current playback time.
// No React in here: React passes in what to show (image, match, layers, trail mode),
// and the playback clock tells the renderer when to redraw.
import { LAYERS } from "../config/layers.js";
import { PLAYBACK } from "../theme/visual.js";
import { createViewport } from "./viewport.js";
import { drawPaths } from "./layers/paths.js";
import { drawPlayerHeads } from "./layers/players.js";
import { drawMarkers } from "./layers/markers.js";

const DRAW_ORDER = [...LAYERS].sort((a, b) => a.z - b.z); // paths first, storm deaths last
const PATH_LAYERS = DRAW_ORDER.filter((l) => l.kind === "path");

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.image = null;
    this.imageSrc = null;
    this.match = null;
    this.enabled = new Set();
    this.trailSeconds = null;    // null = whole path so far
    this.clock = null;
    this.unsubscribe = null;
    this.view = createViewport(0, 0);

    // Redraw at the right sharpness whenever the canvas changes size
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  // ---- Inputs from React ----
  setImage(src) {
    if (src === this.imageSrc) return;
    this.imageSrc = src;
    const img = new Image();
    img.onload = () => {
      if (this.imageSrc !== src) return; // the map changed again while this was loading
      this.image = img;
      // Canvas keeps the image's shape (GrandRift is 2048 × 2046, not square)
      this.canvas.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      this.resize();
    };
    img.src = src;
  }

  setScene(match, enabledLayers, trailSeconds) {
    this.match = match;
    this.enabled = enabledLayers;
    this.trailSeconds = trailSeconds;
    this.draw();
  }

  // Redraw every time the clock ticks, seeks or changes speed
  setClock(clock) {
    this.unsubscribe?.();
    this.clock = clock;
    this.unsubscribe = clock.subscribe(() => this.draw());
    this.draw();
  }

  // ---- Size ----
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;   // sharp lines on high-DPI screens
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels from here on
    this.view = createViewport(width, height);
    this.draw();
  }

  // ---- Drawing ----
  draw() {
    const { ctx, view, match } = this;
    ctx.clearRect(0, 0, view.width, view.height);
    if (!this.image) return;
    ctx.drawImage(this.image, 0, 0, view.width, view.height);
    if (!match) return;

    const time = this.clock?.time ?? Infinity;
    const playing = Boolean(this.clock?.playing);
    // Rings only while playing; their length is fixed in real time, so scale by speed
    const pulseWindow = playing ? PLAYBACK.pulseRealSeconds * this.clock.speed : 0;

    for (const layer of DRAW_ORDER) {
      if (!this.enabled.has(layer.id)) continue;
      if (layer.kind === "path") {
        drawPaths(ctx, view, match.players.filter(layer.paths), layer.color,
                  { time, trailSeconds: this.trailSeconds });
      } else {
        drawMarkers(ctx, view, match.events.filter(layer.events), layer, { time, pulseWindow });
      }
    }

    // Moving dots on top of everything, for path layers that are switched on
    for (const layer of PATH_LAYERS) {
      if (this.enabled.has(layer.id)) {
        drawPlayerHeads(ctx, view, match.players.filter(layer.paths), layer.color, time);
      }
    }
  }

  destroy() {
    this.unsubscribe?.();
    this.resizeObserver.disconnect();
  }
}
