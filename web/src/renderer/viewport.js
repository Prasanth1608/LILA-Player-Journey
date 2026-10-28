// Converts minimap fractions (u across, v up, 0–1) to canvas pixels.
// Every layer goes through this, so zoom/pan can be added here later
// and all layers get it for free.
export function createViewport(width, height) {
  return {
    width,
    height,
    // v is flipped: game "up" is the top of the image, where canvas y = 0
    toPx: (u, v) => [u * width, (1 - v) * height],
  };
}
