import { useEffect, useState } from "react";
import { ZOOM } from "../theme/visual.js";

// Connects a MapSurface renderer (in a ref) to the zoom buttons.
// Returns the zoom level (for the buttons) and the button actions.
export function useMapZoom(rendererRef) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const renderer = rendererRef.current;
    renderer.onZoomChange = setZoom;
    return () => { renderer.onZoomChange = null; };
  }, [rendererRef]);

  return {
    zoom,
    onZoomIn: () => rendererRef.current.zoomBy(ZOOM.buttonStep),
    onZoomOut: () => rendererRef.current.zoomBy(1 / ZOOM.buttonStep),
    onReset: () => rendererRef.current.resetZoom(),
  };
}
