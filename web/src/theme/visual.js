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

export const PATH = {
  width: 1.6,           // line thickness in CSS pixels
  alpha: 0.85,
  gapBreakSeconds: 20,  // snapshots further apart than this aren't joined (no fake straight line)
  arrowEvery: 6,        // an arrowhead on every 6th moving segment
  arrowSize: 6,
  minMovePx: 6,         // ignore tiny moves (standing still, looting) when placing arrows
  endpointRadius: 4,    // start ● and end ■ markers
};
