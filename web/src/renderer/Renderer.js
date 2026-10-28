// Draws the minimap and the enabled layers on a <canvas>.
// No React in here: React passes in what to show (image, match, layers),
// and the renderer decides how to draw it. Playback will add an animation
// loop here later without touching the React side.
import { LAYERS } from "../config/layers.js";
import { createViewport } from "./viewport.js";
import { drawPaths } from "./layers/paths.js";
import { drawMarkers } from "./layers/markers.js";

const DRAW_ORDER = [...LAYERS].sort((a, b) => a.z - b.z); // paths first, storm deaths last

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.image = null;
    this.imageSrc = null;
    this.match = null;
    this.enabled = new Set();
    this.view = createViewport(0, 0);

    // Redraw at the right sharpness whenever the canvas changes size
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

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

  setScene(match, enabledLayers) {
    this.match = match;
    this.enabled = enabledLayers;
    this.draw();
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;   // sharp lines on high-DPI screens
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels from here on
    this.view = createViewport(width, height);
    this.draw();
  }

  draw() {
    const { ctx, view } = this;
    ctx.clearRect(0, 0, view.width, view.height);
    if (!this.image) return;

    ctx.drawImage(this.image, 0, 0, view.width, view.height);
    if (!this.match) return;

    for (const layer of DRAW_ORDER) {
      if (!this.enabled.has(layer.id)) continue;
      if (layer.kind === "path") {
        drawPaths(ctx, view, this.match.players.filter(layer.paths), layer.color);
      } else {
        drawMarkers(ctx, view, this.match.events.filter(layer.events), layer);
      }
    }
  }

  destroy() {
    this.resizeObserver.disconnect();
  }
}
