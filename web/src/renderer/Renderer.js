// Replay mode: draws one match's paths, markers and moving players at the current
// playback time. No React in here: React passes in what to show (match, layers,
// trail mode) and the playback clock tells the renderer when to redraw.
// Order: minimap → paths → markers → moving player dots.
import { LAYERS } from "../config/layers.js";
import { PLAYBACK } from "../theme/visual.js";
import { MapSurface } from "./MapSurface.js";
import { drawPaths } from "./layers/paths.js";
import { drawPlayerHeads } from "./layers/players.js";
import { drawMarkers } from "./layers/markers.js";

const DRAW_ORDER = [...LAYERS].sort((a, b) => a.z - b.z); // paths first, storm deaths last
const PATH_LAYERS = DRAW_ORDER.filter((l) => l.kind === "path");

export class Renderer extends MapSurface {
  match = null;
  enabled = new Set();
  trailSeconds = null;   // null = whole path so far
  clock = null;
  unsubscribe = null;

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

  drawOverlay(ctx, view) {
    const { match } = this;
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
    super.destroy();
  }
}
