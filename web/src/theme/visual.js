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

// Heatmap palette stops. These are colour/opacity keyframes, not separate zones:
// the renderer blends continuously between them, so no contour partitions are drawn.
// `from` = density position (0–1); `fill` = opacity at the start/end of its segment.
const HEAT_PALETTES = {
  traffic: {
    players: [
      [168, 216, 255],
      [39, 139, 234],
      [255, 227, 77],
    ],
    bots:  [
  [181, 243, 232], // Mild turquoise
  [32, 185, 154],  // Thick emerald
  [185, 245, 42],  // Dense lime
],
    both: [
      [216, 200, 255],
      [133, 85, 216],
      [255, 181, 46],
    ],
  },

  kills: {
  players: [
    [255, 177, 161],
    [220, 49, 89],
    [255, 212, 59],
  ],
  bots: [
    [255, 190, 165],
    [235, 91, 75],
    [255, 190, 45],
  ],
  both: [
    [255, 165, 175],
    [198, 45, 91],
    [255, 220, 75],
  ],
},

  deaths: {
    players: [
      [255, 192, 192],
      [228, 71, 85],
      [255, 181, 46],
    ],
    bots: [
      [255, 209, 194],
      [240, 107, 85],
      [233, 161, 27],
    ],
    both: [
      [245, 185, 213],
      [217, 75, 131],
      [255, 194, 71],
    ],
  },

  storm: {
    players: [
      [184, 240, 232],
      [53, 187, 170],
      [213, 240, 68],
    ],
    bots: [
      [200, 240, 193],
      [84, 185, 107],
      [229, 216, 60],
    ],
    both: [
      [174, 233, 208],
      [47, 175, 139],
      [201, 232, 61],
    ],
  },

  loot: {
    players: [
      [217, 197, 255],
      [160, 90, 232],
      [255, 211, 78],
    ],
    bots: [
      [240, 196, 255],
      [208, 90, 197],
      [255, 184, 77],
    ],
    both: [
      [200, 196, 255],
      [117, 102, 222],
      [255, 225, 106],
    ],
  },
};

export function heatLevelsFor(groupId, sideId = "both") {
  const groupPalettes = HEAT_PALETTES[groupId] ?? HEAT_PALETTES.traffic;
  const palette = groupPalettes[sideId] ?? groupPalettes.both ?? groupPalettes.players;
  return [
  {
    name: "Low",
    from: 0.10,
    rgb: palette[0],
    fill: [0.00, 0.10],
    edge: 0,
  },
  {
    name: "Medium",
    from: 0.30,
    rgb: palette[1],
    fill: [0.10, 0.30],
    edge: 0,
  },
  {
    name: "High",
    from: 0.68,
    rgb: palette[2],
    fill: [0.30, 0.72],
    edge: 0,
  },
];
}

export const HEATMAP = {
  levels: heatLevelsFor("traffic"),
  fieldSize: 512,
  radiusCells: 1.6,
  minRadius: 10,
  blobAlpha: 0.30,
  minWeight: 0.08,
  smooth: 3,
  sharpDelayMs: 120,
  maxPixelRatio: 2,
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
