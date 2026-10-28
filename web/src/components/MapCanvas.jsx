import { useEffect, useRef } from "react";
import { Renderer } from "../renderer/Renderer.js";

// Mounts the canvas renderer and hands it what to draw.
// React only says WHAT to show; the Renderer handles HOW.
export function MapCanvas({ imageSrc, match, layers, label }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  // Create the renderer once, clean it up when the map area goes away
  useEffect(() => {
    const renderer = new Renderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current.setImage(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    rendererRef.current.setScene(match, layers);
  }, [match, layers]);

  return <canvas ref={canvasRef} className="map-canvas" role="img" aria-label={label} />;
}
