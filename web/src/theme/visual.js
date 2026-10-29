// All map styling in one place: colours, marker shapes and sizes.
// Visual language: COLOUR = who (blue players, orange bots), SHAPE = what happened.

export const COLORS = {
  players: "#4cc3ff",   // humans: paths, kills, deaths
  bots: "#ff8a3d",      // bots: paths, kills, deaths
  loot: "#d4f06b",      // items (players only)
  storm: "#c08bff",     // storm deaths
  outline: "rgba(8, 12, 16, 0.9)", // dark edge so markers stand out on any map colour
};

// Marker shape per kind of event (drawn by renderer/shapes.js)
export const SHAPES = {
  kill: "triangle",     // ▲ got a kill
  death: "cross",       // ✕ died
  storm: "star",        // ★ died to the storm
  loot: "diamond",      // ◆ picked something up
};

export const MARKER = {
  size: { triangle: 9, cross: 8, star: 11, diamond: 6 }, // radius in CSS pixels
  outlineWidth: 1.5,
};

// Heatmap colour ramp: few → many, green → yellow → red.
// Starts transparent so quiet areas show the map. The green leans teal and the red
// leans crimson so the ramp still reads for red/green colour-blind viewers.
export const HEATMAP = {
  stops: [
    [0.0, [32, 178, 150, 0.0]],
    [0.12, [32, 178, 150, 0.5]],
    [0.45, [240, 212, 58, 0.72]],
    [0.75, [245, 130, 40, 0.85]],
    [1.0, [214, 34, 70, 0.92]],
  ],
  // Blob rendering: each grid cell becomes a soft round blob; overlapping blobs add up.
  radiusCells: 1.6,   // blob radius in grid cells (each cell = 1/64 of the map)…
  minRadiusPx: 14,    // …but never smaller than this on screen, so single events stay visible
  blobAlpha: 0.6,     // strength of the busiest cell's blob; overlaps build up from there
  minWeight: 0.08,    // share of blobAlpha that even a 1-event cell gets, so it stays visible
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
  alpha: 0.85,
  gapBreakSeconds: 20,  // snapshots further apart than this aren't joined (no fake straight line)
  arrowEvery: 6,        // an arrowhead on every 6th moving segment
  arrowSize: 6,
  minMovePx: 6,         // ignore tiny moves (standing still, looting) when placing arrows
  endpointRadius: 4,    // start ● and end ■ markers
};

// Map zoom: limits and step sizes (shared by Replay and Heatmaps)
export const ZOOM = {
  min: 1,             // whole map fits the canvas; can't zoom out further
  max: 8,             // clamp: closer than this the 2048px minimap just gets blurry
  buttonStep: 1.5,    // each +/− click
  wheelSpeed: 0.0015, // mouse wheel / trackpad sensitivity
};
