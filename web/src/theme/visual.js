// All map styling in one place: colours, marker shapes and sizes.
// Visual language: COLOUR = who (blue players, orange bots), SHAPE = what happened.

export const COLORS = {
  players: "#4fa3ff",   // humans: paths and every player event
  bots: "#ff8a3d",      // bots: paths and every bot event
  loot: "#b7e34a",      // items (players only)
  outline: "rgba(8, 12, 16, 0.9)", // dark edge so markers stand out on any map colour
};

// Marker shape per kind of event (drawn by renderer/shapes.js)
export const SHAPES = {
  kill: "crosshair",    // ⌖ got a kill
  death: "cross",       // ✕ died
  storm: "bolt",        // ϟ died to the storm
  loot: "diamond",      // ◆ picked something up
};

export const MARKER = {
  size: { crosshair: 8, cross: 8, bolt: 10, diamond: 6 }, // radius in CSS pixels
  outlineWidth: 1.5,
};

// Heatmap "edges only" style: three stacked levels, each a thin smooth outline plus a
// fill that fades with density: almost clear just inside the outline, strongest at the
// busiest point. The map stays readable and red hotspots stand out.
// `from` = share of the busiest spot in the selection (0–1). Later levels draw on top.
// `fill` = [opacity where the level starts, opacity at its busiest].
export const HEATMAP = {
  levels: [
    { name: "Low", from: 0.12, rgb: [91, 229, 43], fill: [0.0, 0.28], edge: 0.75 },    // parrot green
    { name: "Medium", from: 0.4, rgb: [255, 214, 10], fill: [0.02, 0.38], edge: 0.9 }, // yellow
    { name: "High", from: 0.68, rgb: [255, 40, 40], fill: [0.05, 0.62], edge: 1.0 },   // bright red
  ],
  lineWidth: 1.4,     // outline thickness in CSS pixels, at any zoom

  // Density field: built once per selection in map space, then sampled for whatever is
  // on screen, so outlines stay sharp when zoomed and levels never change with the view.
  fieldSize: 512,     // field resolution across the whole map
  radiusCells: 1.6,   // each grid cell becomes a soft round blob this many cells wide (radius)…
  minRadius: 10,      // …at least this many field pixels, so single events stay visible
  blobAlpha: 0.3,     // busiest cell's blob strength; low so overlaps don't hit the 255 ceiling
  minWeight: 0.08,    // share of blobAlpha that even a 1-event cell gets
  smooth: 2,          // blur (field pixels) so outlines are smooth curves, no specks

  sharpDelayMs: 120,  // after zooming/dragging stops, redraw sharp at screen resolution
  maxPixelRatio: 2,   // cap for very high-DPI screens (cost grows with pixel count)
};

export const PLAYBACK = {
  speeds: [5, 10, 20, 40],     // × real time (matches are 5–15 minutes long)
  defaultSpeed: 10,
  trailSeconds: 30,            // "Last 30 s" trail mode
  pulseRealSeconds: 0.8,       // how long a new event's ring is visible, in real seconds
  headRadius: 5.5,             // the moving dot for each player
};

export const PATH = {
  width: 1.6,           // line thickness in CSS pixels
  alpha: 0.6,           // the line is quieter than the chevrons on it
  gapBreakSeconds: 20,  // snapshots further apart than this aren't joined (no fake straight line)
  chevronSpacing: 34,   // one direction chevron every N screen pixels along the path, so
                        // zooming in reveals more of them (≈ one per snapshot at high zoom)
  chevronSize: 5,
  endpointRadius: 4,    // start ● and end ■ markers
};

// Map zoom: limits and step sizes (shared by Replay and Heatmaps)
export const ZOOM = {
  min: 1,             // whole map fits the canvas; can't zoom out further
  max: 8,             // clamp: closer than this the 2048px minimap just gets blurry
  buttonStep: 1.5,    // each +/− click
  wheelSpeed: 0.0015, // mouse wheel / trackpad sensitivity
};
