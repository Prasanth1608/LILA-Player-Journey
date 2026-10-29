// Shared base for anything drawn on the minimap canvas: loads the map image,
// keeps the canvas sharp and sized, converts u/v to pixels (viewport), and handles
// zoom and pan (mouse wheel, drag, and the +/− buttons via zoomBy/resetZoom).
// Subclasses only implement drawOverlay(ctx, view) — what goes on top of the map.
//   Renderer        → Replay: paths, markers, moving players (with a playback clock)
//   HeatmapRenderer → Heatmaps: colours only, no animation
import { HOME, createViewport, panBy, zoomAt } from "./viewport.js";
import { ZOOM } from "../theme/visual.js";

export class MapSurface {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.image = null;
    this.imageSrc = null;
    this.size = { width: 0, height: 0 };   // canvas size in CSS pixels
    this.camera = HOME;
    this.view = createViewport(0, 0);
    this.drag = null;                      // { id, x, y } while the map is being dragged
    this.onZoomChange = null;              // set by React to update the buttons

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    // Listeners kept as fields so destroy() can remove them
    this.handlers = {
      wheel: (e) => this.onWheel(e),
      pointerdown: (e) => this.onPointerDown(e),
      pointermove: (e) => this.onPointerMove(e),
      pointerup: (e) => this.onPointerUp(e),
      pointercancel: (e) => this.onPointerUp(e),
    };
    for (const [type, fn] of Object.entries(this.handlers)) {
      // passive: false so the wheel can zoom instead of scrolling the page
      canvas.addEventListener(type, fn, type === "wheel" ? { passive: false } : undefined);
    }
    this.updateCursor();
  }

  setImage(src) {
    if (src === this.imageSrc) return;
    this.imageSrc = src;
    this.setCamera(HOME); // new map: start fully zoomed out
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
    this.size = { width, height };
    this.view = createViewport(width, height, this.camera);
    this.draw();
  }

  // ---- Zoom / pan ----
  setCamera(camera) {
    const zoomChanged = camera.zoom !== this.camera.zoom;
    this.camera = camera;
    this.view = createViewport(this.size.width, this.size.height, camera);
    if (zoomChanged) {
      this.updateCursor();
      this.onZoomChange?.(camera.zoom);
    }
    this.draw();
  }

  // Buttons: zoom around the canvas centre
  zoomBy(factor) {
    const { width, height } = this.size;
    this.setCamera(zoomAt(this.camera, factor, width / 2, height / 2, width, height));
  }

  resetZoom() {
    this.setCamera(HOME);
  }

  onWheel(e) {
    const factor = Math.exp(-e.deltaY * ZOOM.wheelSpeed);
    // Fully zoomed out and scrolling out: let the page scroll as normal
    if (factor < 1 && this.camera.zoom <= ZOOM.min) return;
    e.preventDefault();
    const { x, y } = this.localPoint(e);
    const { width, height } = this.size;
    this.setCamera(zoomAt(this.camera, factor, x, y, width, height));
  }

  onPointerDown(e) {
    if (e.button !== 0 || this.camera.zoom <= ZOOM.min) return; // nothing to pan at zoom 1
    this.canvas.setPointerCapture(e.pointerId);
    this.drag = { id: e.pointerId, ...this.localPoint(e) };
    this.updateCursor();
  }

  onPointerMove(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const { x, y } = this.localPoint(e);
    const { width, height } = this.size;
    const camera = panBy(this.camera, x - this.drag.x, y - this.drag.y, width, height);
    this.drag = { ...this.drag, x, y };
    this.setCamera(camera);
  }

  onPointerUp(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    this.drag = null;
    this.updateCursor();
  }

  get dragging() {
    return this.drag !== null;
  }

  // Screen pixel → image fractions (top-left = 0,0), or null if off the map
  fractionAt(x, y) {
    const [fx, fy] = this.view.toFraction(x, y);
    return fx >= 0 && fx < 1 && fy >= 0 && fy < 1 ? [fx, fy] : null;
  }

  localPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  updateCursor() {
    const zoomed = this.camera.zoom > ZOOM.min;
    this.canvas.style.cursor = this.drag ? "grabbing" : zoomed ? "grab" : "";
    // Touch: drag pans the map when zoomed, otherwise scrolls the page
    this.canvas.style.touchAction = zoomed ? "none" : "";
  }

  // ---- Drawing ----
  draw() {
    const { ctx, view } = this;
    ctx.clearRect(0, 0, view.width, view.height);
    if (!this.image) return;
    ctx.drawImage(this.image, view.x, view.y, view.mapW, view.mapH);
    this.drawOverlay(ctx, view);
  }

  // Overridden by subclasses
  drawOverlay() {}

  destroy() {
    this.resizeObserver.disconnect();
    for (const [type, fn] of Object.entries(this.handlers)) {
      this.canvas.removeEventListener(type, fn);
    }
  }
}
