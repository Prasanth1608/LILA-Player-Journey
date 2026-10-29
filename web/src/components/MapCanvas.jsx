import { useEffect, useRef } from "react";
import { Renderer } from "../renderer/Renderer.js";

// Replay canvas: mounts the Replay renderer and hands it what to draw.
// React only says WHAT to show; the Renderer handles HOW (and redraws on every clock tick).
export function MapCanvas({ imageSrc, match, layers, trailSeconds, clock, label }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  // Create the renderer once, clean it up when the map area goes away
  useEffect(() => {
    const renderer = new Renderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current.setClock(clock);
  }, [clock]);

  useEffect(() => {
    rendererRef.current.setImage(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    rendererRef.current.setScene(match, layers, trailSeconds);
  }, [match, layers, trailSeconds]);

  return <canvas ref={canvasRef} className="map-canvas" role="img" aria-label={label} />;
}
