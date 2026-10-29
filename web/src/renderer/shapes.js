// Marker shapes, drawn centred on (x, y) with radius r.
// Each has a dark outline so it stays readable on any part of the map.
// Same shapes as the legend icons (components/ui/Swatch.jsx).

// Filled shapes: traced, then filled and outlined
const FILLED = {
  diamond(ctx, x, y, r) {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  },
  // Lightning bolt, from a 24-unit icon grid scaled to radius r
  bolt(ctx, x, y, r) {
    const k = r / 10;
    const pts = [[1, -10], [-7, 2], [-1, 2], [-2, 10], [7, -3], [1, -3]];
    pts.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x + px * k, y + py * k));
    ctx.closePath();
  },
  circle(ctx, x, y, r) {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  },
  square(ctx, x, y, r) {
    ctx.rect(x - r, y - r, r * 2, r * 2);
  },
};

// Line shapes: stroked twice, dark underlay first, colour on top
const STROKED = {
  cross: {
    width: (r) => r * 0.55,
    trace(ctx, x, y, r) {
      const d = r * 0.75;
      ctx.moveTo(x - d, y - d);
      ctx.lineTo(x + d, y + d);
      ctx.moveTo(x + d, y - d);
      ctx.lineTo(x - d, y + d);
    },
  },
  crosshair: {
    width: (r) => r * 0.3,
    trace(ctx, x, y, r) {
      const ring = r * 0.65;
      ctx.moveTo(x + ring, y);
      ctx.arc(x, y, ring, 0, Math.PI * 2);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        ctx.moveTo(x + dx * r * 0.35, y + dy * r * 0.35); // ticks cross the ring
        ctx.lineTo(x + dx * r * 1.15, y + dy * r * 1.15);
      }
    },
  },
};

export function drawShape(ctx, shape, x, y, r, fill, outline, outlineWidth) {
  const stroked = STROKED[shape];
  if (stroked) {
    const w = stroked.width(r);
    ctx.lineCap = "round";
    for (const [color, width] of [[outline, w + outlineWidth * 2], [fill, w]]) {
      ctx.beginPath();
      stroked.trace(ctx, x, y, r);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    return;
  }

  ctx.beginPath();
  (FILLED[shape] ?? FILLED.circle)(ctx, x, y, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outline;
  ctx.stroke();
}
