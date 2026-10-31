// Heatmaps mode: one or more independently coloured overlays on the minimap.
// Each selected metric is normalised independently so its spatial pattern remains visible.

import { MapSurface } from "./MapSurface.js";
import { HEATMAP } from "../theme/visual.js";
import { buildField, paintHeatCanvas } from "./layers/heatmap.js";

// Map background darkening settings
const MAP_OVERLAY = {
  enabled: true,
  opacity: 0.40,
};

const viewKey = (v) =>
  `${v.width}|${v.height}|${v.x}|${v.y}|${v.mapW}|${v.mapH}`;

export class HeatmapRenderer extends MapSurface {
  fields = [];
  whole = null;
  sharp = null;
  timer = null;

  // heats: [{ heat: { counts, max }, levels }]
  setHeats(heats, grid) {
    clearTimeout(this.timer);

    this.fields = heats
      .filter((item) => item.heat)
      .map(({ heat, levels }) => ({
        field: buildField(heat.counts, heat.max, grid),
        levels: levels ?? HEATMAP.levels,
      }));

    this.whole = this.sharp = null;
    this.draw();
  }

  // Backwards-compatible single-layer entry point for any existing integrations.
  setHeat(heat, grid, levels = HEATMAP.levels) {
    this.setHeats(heat ? [{ heat, levels }] : [], grid);
  }

  paintComposite(view, ratio) {
    const width = Math.max(1, Math.round(view.width * ratio));
    const height = Math.max(1, Math.round(view.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    for (const item of this.fields) {
      const layer = paintHeatCanvas(item.field, view, ratio, item.levels);
      ctx.drawImage(layer, 0, 0, width, height);
    }

    return canvas;
  }

  drawOverlay(ctx, view) {
    // Darken the map background before drawing heatmap colours.
    if (MAP_OVERLAY.enabled) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${MAP_OVERLAY.opacity})`;
      ctx.fillRect(0, 0, view.width, view.height);
      ctx.restore();
    }

    if (this.fields.length === 0) return;

    const ratio = Math.min(
      HEATMAP.maxPixelRatio,
      window.devicePixelRatio || 1
    );

    const key = viewKey(view);

    if (this.sharp?.key === key) {
      ctx.drawImage(this.sharp.canvas, 0, 0, view.width, view.height);
      return;
    }

    const home = {
      width: view.width,
      height: view.height,
      x: 0,
      y: 0,
      mapW: view.width,
      mapH: view.height,
    };

    if (this.whole?.key !== viewKey(home)) {
      this.whole = {
        key: viewKey(home),
        canvas: this.paintComposite(home, ratio),
      };
    }

    if (key === this.whole.key) {
      ctx.drawImage(this.whole.canvas, 0, 0, view.width, view.height);
      return;
    }

    ctx.drawImage(
      this.whole.canvas,
      view.x,
      view.y,
      view.mapW,
      view.mapH
    );

    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      if (this.fields.length === 0) return;

      this.sharp = {
        key: viewKey(this.view),
        canvas: this.paintComposite(this.view, ratio),
      };

      this.draw();
    }, HEATMAP.sharpDelayMs);
  }

  destroy() {
    clearTimeout(this.timer);
    super.destroy();
  }
}
