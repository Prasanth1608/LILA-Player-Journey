// Shared base for anything drawn on the minimap canvas: loads the map image,
// keeps the canvas sharp and sized, converts u/v to pixels (viewport).
// Subclasses only implement drawOverlay(ctx, view) — what goes on top of the map.
//   Renderer        → Replay: paths, markers, moving players (with a playback clock)
//   HeatmapRenderer → Heatmaps: colours only, no animation
import { createViewport } from "./viewport.js";

export class MapSurface {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.image = null;
    this.imageSrc = null;
    this.view = createViewport(0, 0);
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
    this.drawOverlay(ctx, view);
  }

  // Overridden by subclasses
  drawOverlay() {}

  destroy() {
    this.resizeObserver.disconnect();
  }
}
