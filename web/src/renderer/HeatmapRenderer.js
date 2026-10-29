// Heatmaps mode: the minimap with a static colour overlay. No clock, no animation:
// the overlay is rebuilt only when the counts or the canvas size change.
// Note: `image` belongs to MapSurface (the minimap); the heat overlay is `overlay`.
import { MapSurface } from "./MapSurface.js";
import { buildHeatmapImage, drawHeatmap } from "./layers/heatmap.js";

export class HeatmapRenderer extends MapSurface {
  heat = null;      // { counts, max } from lib/heatmap.js sumMetrics, or null
  grid = 64;
  overlay = null;   // cached coloured overlay for the current size

  setHeat(heat, grid) {
    this.heat = heat;
    this.grid = grid;
    this.overlay = null; // data changed: rebuild on next draw
    this.draw();
  }

  drawOverlay(ctx, view) {
    if (!this.heat) return;
    // Blob size is in screen pixels, so a resize also needs a rebuild
    const w = Math.max(1, Math.round(view.width));
    const h = Math.max(1, Math.round(view.height));
    if (!this.overlay || this.overlay.width !== w || this.overlay.height !== h) {
      this.overlay = buildHeatmapImage(this.heat.counts, this.heat.max, this.grid, view.width, view.height);
    }
    drawHeatmap(ctx, view, this.overlay);
  }
}
