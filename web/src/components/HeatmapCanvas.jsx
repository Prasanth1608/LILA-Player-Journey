import { useEffect, useRef, useState } from "react";
import { HeatmapRenderer } from "../renderer/HeatmapRenderer.js";
import { cellAt } from "../lib/heatmap.js";
import { plural } from "../lib/format.js";

// Heatmaps canvas: static colours + a hover readout ("12 kills · players").
// heat: { counts, max } for the colours. readout: [{ label side, one, many, array }] for hover.
export function HeatmapCanvas({ imageSrc, heat, grid, readout, label }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const lastCell = useRef(-1);
  const [hover, setHover] = useState(null); // { x, y, lines } or null

  useEffect(() => {
    const renderer = new HeatmapRenderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current.setImage(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    rendererRef.current.setHeat(heat, grid);
    lastCell.current = -1; // data changed: the readout must be recomputed
    setHover(null);
  }, [heat, grid]);

  // Readout for the cell under the pointer. Only recomputed when the cell changes.
  const onPointerMove = (e) => {
    if (!heat) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell = cellAt(x / rect.width, y / rect.height, grid);
    if (cell !== lastCell.current) {
      lastCell.current = cell;
      const lines = readout
        .map((r) => [r, r.array[cell]])
        .filter(([, count]) => count > 0)
        .map(([r, count]) => `${plural(count, r.one, r.many)} · ${r.side}`);
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
    <div className="map-wrap">
      <canvas ref={canvasRef} className="map-canvas" role="img" aria-label={label}
              onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} />
      {hover && (
        <div className="heat-tooltip" style={{ left: hover.x, top: hover.y }} role="tooltip">
          {hover.lines.map((line) => <div key={line}>{line}</div>)}
        </div>
      )}
    </div>
  );
}
