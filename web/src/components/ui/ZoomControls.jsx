import { ZOOM } from "../../theme/visual.js";

// +/−/reset buttons over the map corner. The renderer does the zooming;
// `zoom` is only used to show the level and disable buttons at the limits.
export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="zoom-controls" role="group" aria-label="Map zoom">
      <button type="button" onClick={onZoomIn} disabled={zoom >= ZOOM.max} aria-label="Zoom in">+</button>
      <button type="button" onClick={onZoomOut} disabled={zoom <= ZOOM.min} aria-label="Zoom out">−</button>
      <button type="button" onClick={onReset} disabled={zoom <= ZOOM.min} aria-label="Fit whole map"
              className="zoom-reset">{zoom.toFixed(1)}×</button>
    </div>
  );
}
