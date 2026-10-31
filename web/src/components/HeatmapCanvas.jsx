import { useEffect, useRef, useState } from "react";
import { HeatmapRenderer } from "../renderer/HeatmapRenderer.js";
import { cellAt } from "../lib/heatmap.js";
import { plural } from "../lib/format.js";
import { useMapZoom } from "../hooks/useMapZoom.js";
import { ZoomControls } from "./ui/ZoomControls.jsx";

// Heatmaps canvas: static colours + a hover readout ("12 kills · players").
// heat: { counts, max } for the colours. readout: [{ label side, one, many, array }] for hover.
export function HeatmapCanvas({ imageSrc, heat, grid, readout, label, heatLevels }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const lastCell = useRef(-1);
  const [hover, setHover] = useState(null); // { x, y, lines } or null

  useEffect(() => {
    const renderer = new HeatmapRenderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);
  const zoom = useMapZoom(rendererRef); // after the renderer exists

  useEffect(() => {
    rendererRef.current.setImage(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    rendererRef.current.setHeat(heat, grid, heatLevels);
    lastCell.current = -1; // data changed: the readout must be recomputed
    setHover(null);
  }, [heat, grid, heatLevels]);

  // Readout for the cell under the pointer. Only recomputed when the cell changes.
  // Hidden while dragging the map, and off the map's edge.
  const onPointerMove = (e) => {
    const renderer = rendererRef.current;
    if (!heat || renderer.dragging) return onPointerLeave();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const at = renderer.fractionAt(x, y); // accounts for zoom and pan
    if (!at) return onPointerLeave();
    const cell = cellAt(at[0], at[1], grid);
    if (cell !== lastCell.current) {
      lastCell.current = cell;
      const lines = readout
        .map((r) => [r, r.array[cell]])
        .filter(([, count]) => count > 0)
        .map(([r, count]) => r.format ? r.format(count) : `${plural(count, r.one, r.many)} · ${r.side}`);
      setHover(lines.length ? { x, y, lines } : null);
      return;
    }
    setHover((h) => (h ? { ...h, x, y } : h)); // same cell: just follow the pointer
  };

  const onPointerLeave = () => {
    lastCell.current = -1;
    setHover(null);
  };

  return (
    // map-area: the space available; map-wrap: the square map itself (canvas + overlays)
    <div className="map-area">
      <div className="map-wrap">
        <canvas ref={canvasRef} className="map-canvas" role="img" aria-label={label}
                onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} />
        <ZoomControls {...zoom} />
        {hover && (
          <div className="heat-tooltip" style={{ left: hover.x, top: hover.y }} role="tooltip">
            {hover.lines.map((line) => <div key={line}>{line}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
