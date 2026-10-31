// Replay mode: draws selected matches' paths, markers and moving players at the current
// playback time. Match records remain separate while sharing the same map and clock.
// Order: minimap → paths → markers → moving player dots.
import { LAYERS } from "../config/layers.js";
import { PATH, PLAYBACK, COLORS } from "../theme/visual.js";
import { MapSurface } from "./MapSurface.js";
import { drawPaths } from "./layers/paths.js";
import { drawPlayerHeads } from "./layers/players.js";
import { drawMarkers } from "./layers/markers.js";
import { drawShape } from "./shapes.js";

const DRAW_ORDER = [...LAYERS].sort((a, b) => a.z - b.z); // paths first, storm deaths last
const PATH_LAYERS = DRAW_ORDER.filter((l) => l.kind === "path");

export class Renderer extends MapSurface {
  matches = [];
  enabled = new Set();
  trailSeconds = null;   // null = whole path so far
  analysis = false;
  analysisData = null;
  clock = null;
  unsubscribe = null;

  setScene(matches, enabledLayers, trailSeconds, analysis = false) {
    const nextMatches = matches ?? [];
    this.matches = nextMatches;
    this.enabled = enabledLayers;
    this.trailSeconds = trailSeconds;
    this.analysis = analysis;
    // Comparisons are capped at three matches, so preserve exact source records
    // and original event icons rather than spatially clustering them.
    this.analysisData = null;
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
    if (this.matches.length === 0) return;
    if (this.analysis) {
      // Static multi-match comparison: draw precise paths and original event
      // markers from each selected match. No moving player heads or timeline.
      for (const layer of DRAW_ORDER) {
        if (!this.enabled.has(layer.id)) continue;
        if (layer.kind === "path") {
          for (const match of this.matches) {
            drawPaths(ctx, view, match.players.filter(layer.paths), layer.color,
                      { time: Infinity, trailSeconds: null });
          }
        } else {
          for (const match of this.matches) {
            drawMarkers(ctx, view, match.events.filter(layer.events), layer, { time: Infinity, pulseWindow: 0 });
          }
        }
      }
      return;
    }

    const time = this.clock?.time ?? Infinity;
    const playing = Boolean(this.clock?.playing);
    // Rings only while playing; their length is fixed in real time, so scale by speed
    const pulseWindow = playing ? PLAYBACK.pulseRealSeconds * this.clock.speed : 0;

    for (const layer of DRAW_ORDER) {
      if (!this.enabled.has(layer.id)) continue;
      if (layer.kind === "path") {
        for (const match of this.matches) {
          drawPaths(ctx, view, match.players.filter(layer.paths), layer.color,
                    { time, trailSeconds: this.trailSeconds });
        }
      } else {
        for (const match of this.matches) {
          drawMarkers(ctx, view, match.events.filter(layer.events), layer, { time, pulseWindow });
        }
      }
    }

    // Moving dots on top of everything, for path layers that are switched on
    for (const layer of PATH_LAYERS) {
      if (this.enabled.has(layer.id)) {
        for (const match of this.matches) {
          drawPlayerHeads(ctx, view, match.players.filter(layer.paths), layer.color, time);
        }
      }
    }
  }

  destroy() {
    this.unsubscribe?.();
    super.destroy();
  }
}


// Multi-match analysis deliberately reduces raw records to a bounded spatial
// representation. Paths become weighted grid-to-grid movement segments; events
// become per-layer grid clusters. Counts retain the full underlying totals.
// A deliberately coarse grid keeps the worst-case multi-match view bounded.
// 24×24 means at most 576 spatial buckets per event layer, regardless of match count.
const ANALYSIS_GRID = 24;
// Sample each player route sparsely before accumulating shared grid edges.
const MAX_PATH_SAMPLES = 12;

function cellOf(u, v) {
  return [
    Math.max(0, Math.min(ANALYSIS_GRID - 1, Math.floor(u * ANALYSIS_GRID))),
    Math.max(0, Math.min(ANALYSIS_GRID - 1, Math.floor((1 - v) * ANALYSIS_GRID))),
  ];
}

function buildAnalysisData(matches) {
  const pathLayers = new Map();
  const eventLayers = new Map();

  for (const layer of DRAW_ORDER) {
    if (layer.kind === "path") pathLayers.set(layer.id, new Map());
    else eventLayers.set(layer.id, new Map());
  }

  for (const match of matches) {
    for (const layer of PATH_LAYERS) {
      const edges = pathLayers.get(layer.id);
      for (const player of match.players) {
        if (!layer.paths(player) || !player.path?.length) continue;
        const path = player.path;
        const stride = Math.max(1, Math.ceil((path.length - 1) / MAX_PATH_SAMPLES));
        let previous = null;
        for (let i = 0; i < path.length; i += stride) {
          const point = path[i];
          const cell = cellOf(point[1], point[2]);
          if (previous && point[0] - previous.t <= PATH.gapBreakSeconds) {
            const key = `${previous.cell[0]},${previous.cell[1]}:${cell[0]},${cell[1]}`;
            edges.set(key, (edges.get(key) ?? 0) + 1);
          }
          previous = { t: point[0], cell };
        }
        const last = path[path.length - 1];
        const lastCell = cellOf(last[1], last[2]);
        if (previous && last[0] - previous.t <= PATH.gapBreakSeconds &&
            (previous.cell[0] !== lastCell[0] || previous.cell[1] !== lastCell[1])) {
          const key = `${previous.cell[0]},${previous.cell[1]}:${lastCell[0]},${lastCell[1]}`;
          edges.set(key, (edges.get(key) ?? 0) + 1);
        }
      }
    }

    for (const layer of DRAW_ORDER.filter((item) => item.kind === "marker")) {
      const clusters = eventLayers.get(layer.id);
      for (const event of match.events) {
        if (!layer.events(event)) continue;
        const [x, y] = cellOf(event.u, event.v);
        const key = `${x},${y}`;
        const cluster = clusters.get(key) ?? { x, y, count: 0 };
        cluster.count += 1;
        clusters.set(key, cluster);
      }
    }
  }

  return {
    paths: new Map([...pathLayers].map(([id, edges]) => [id, [...edges].map(([key, count]) => {
      const [from, to] = key.split(":");
      const [x1, y1] = from.split(",").map(Number);
      const [x2, y2] = to.split(",").map(Number);
      return { x1, y1, x2, y2, count };
    })])),
    events: new Map([...eventLayers].map(([id, clusters]) => [id, [...clusters.values()]])),
  };
}

function drawAnalysis(ctx, view, data, enabled) {
  if (!data) return;

  for (const layer of DRAW_ORDER) {
    if (!enabled.has(layer.id)) continue;
    if (layer.kind === "path") {
      // Batch edges into a handful of strokes instead of issuing one Canvas stroke
      // per edge. This keeps draw calls low even when every match is selected.
      const edges = data.paths.get(layer.id) ?? [];
      const buckets = [[], [], [], []];
      for (const edge of edges) {
        const strength = Math.min(1, Math.log2(edge.count + 1) / 5);
        const bucket = Math.min(3, Math.floor(strength * 4));
        buckets[bucket].push(edge);
      }

      for (let bucket = 0; bucket < buckets.length; bucket++) {
        const batch = buckets[bucket];
        if (!batch.length) continue;
        ctx.beginPath();
        for (const edge of batch) {
          const x1 = view.x + ((edge.x1 + 0.5) / ANALYSIS_GRID) * view.mapW;
          const y1 = view.y + ((edge.y1 + 0.5) / ANALYSIS_GRID) * view.mapH;
          const x2 = view.x + ((edge.x2 + 0.5) / ANALYSIS_GRID) * view.mapW;
          const y2 = view.y + ((edge.y2 + 0.5) / ANALYSIS_GRID) * view.mapH;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        const strength = (bucket + 0.5) / buckets.length;
        ctx.strokeStyle = layer.color;
        ctx.globalAlpha = 0.12 + strength * 0.48;
        ctx.lineWidth = 1 + strength * 2.2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      continue;
    }

    // Preserve event identity: loot=diamond, kill=crosshair, death=cross,
    // storm=bolt. The count badge is separate so the number never replaces the icon.
    const clusters = data.events.get(layer.id) ?? [];
    for (const cluster of clusters) {
      const x = view.x + ((cluster.x + 0.5) / ANALYSIS_GRID) * view.mapW;
      const y = view.y + ((cluster.y + 0.5) / ANALYSIS_GRID) * view.mapH;
      const radius = Math.min(8.5, 5.2 + Math.log2(cluster.count) * 0.55);
      drawShape(ctx, layer.shape, x, y, radius, layer.color, COLORS.outline, 1.2);
      drawCountBadge(ctx, x + radius * 0.72, y + radius * 0.72, cluster.count);
    }
  }
}

function drawCountBadge(ctx, x, y, count) {
  const label = count > 999 ? "999+" : String(count);
  ctx.save();
  ctx.font = "700 8px system-ui, sans-serif";
  const width = Math.max(12, ctx.measureText(label).width + 5);
  const height = 11;
  ctx.fillStyle = "rgba(8, 12, 16, 0.96)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.rect(x - width / 2, y - height / 2, width, height);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 0.25);
  ctx.restore();
}
