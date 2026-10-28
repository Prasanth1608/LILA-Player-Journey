// Marker shapes, drawn centred on (x, y) with radius r.
// Each has a dark outline so it stays readable on any part of the map.

const TRACE = {
  triangle(ctx, x, y, r) {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.9, y + r * 0.7);
    ctx.lineTo(x - r * 0.9, y + r * 0.7);
    ctx.closePath();
  },
  diamond(ctx, x, y, r) {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  },
  star(ctx, x, y, r) {
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  },
  circle(ctx, x, y, r) {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  },
  square(ctx, x, y, r) {
    ctx.rect(x - r, y - r, r * 2, r * 2);
  },
};

export function drawShape(ctx, shape, x, y, r, fill, outline, outlineWidth) {
  // ✕ is drawn as two thick strokes: dark underlay first, colour on top
  if (shape === "cross") {
    const d = r * 0.75;
    ctx.lineCap = "round";
    for (const [color, width] of [[outline, r * 0.55 + outlineWidth * 2], [fill, r * 0.55]]) {
      ctx.beginPath();
      ctx.moveTo(x - d, y - d);
      ctx.lineTo(x + d, y + d);
      ctx.moveTo(x + d, y - d);
      ctx.lineTo(x - d, y + d);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    return;
  }

  ctx.beginPath();
  (TRACE[shape] ?? TRACE.circle)(ctx, x, y, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outline;
  ctx.stroke();
}
