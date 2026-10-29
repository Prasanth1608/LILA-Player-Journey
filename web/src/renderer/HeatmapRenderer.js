// Heatmaps mode: the minimap with a static colour overlay. No clock, no animation.
// Note: `image` belongs to MapSurface (the minimap); the heat overlays have other names.
//
// Sharp at any zoom: the overlay is painted at screen resolution for the current view.
// While zooming or dragging, the whole-map overlay is stretched (instant); shortly after
// the movement stops, a sharp one is painted for the new view.
import { MapSurface } from "./MapSurface.js";
import { HEATMAP } from "../theme/visual.js";
import { buildField, paintHeatCanvas } from "./layers/heatmap.js";

const viewKey = (v) => `${v.width}|${v.height}|${v.x}|${v.y}|${v.mapW}|${v.mapH}`;

export class HeatmapRenderer extends MapSurface {
  field = null;      // density field for the current selection (null = nothing to show)
  whole = null;      // { key, canvas } overlay of the whole map at the current canvas size
  sharp = null;      // { key, canvas } overlay painted for one zoomed/panned view
  timer = null;

  // heat: { counts, max } from lib/heatmap.js sumMetrics, or null
  setHeat(heat, grid) {
    this.field = heat ? buildField(heat.counts, heat.max, grid) : null;
    this.whole = this.sharp = null;
    this.draw();
  }

  drawOverlay(ctx, view) {
    if (!this.field) return;
    const ratio = Math.min(HEATMAP.maxPixelRatio, window.devicePixelRatio || 1);
    const key = viewKey(view);
    if (this.sharp?.key === key) {
      ctx.drawImage(this.sharp.canvas, 0, 0, view.width, view.height);
      return;
    }

    // Whole map, painted for the zoomed-out view at this canvas size
    const home = { width: view.width, height: view.height, x: 0, y: 0, mapW: view.width, mapH: view.height };
    if (this.whole?.key !== viewKey(home)) {
      this.whole = { key: viewKey(home), canvas: paintHeatCanvas(this.field, home, ratio) };
    }
    if (key === this.whole.key) { // zoomed out: the whole-map overlay is already sharp
      ctx.drawImage(this.whole.canvas, 0, 0, view.width, view.height);
      return;
    }

    // Zoomed in: stretch the whole-map overlay for now, paint a sharp one once movement stops
    ctx.drawImage(this.whole.canvas, view.x, view.y, view.mapW, view.mapH);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.field) return;
      this.sharp = { key: viewKey(this.view), canvas: paintHeatCanvas(this.field, this.view, ratio) };
      this.draw();
    }, HEATMAP.sharpDelayMs);
  }

  destroy() {
    clearTimeout(this.timer);
    super.destroy();
  }
}
