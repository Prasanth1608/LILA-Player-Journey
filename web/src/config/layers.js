// The map layers a designer can switch on and off (any combination at once).
// Each layer says which paths or events it shows. Events come from the match
// file (pipeline/DATA_CONTRACT.md): combat and loot are recorded in HUMAN files,
// so "bot" layers are read from the human side of the same fights.
import { COLORS, SHAPES } from "../theme/visual.js";

const isType = (e, ...types) => types.includes(e.type);

export const LAYERS = [
  // ---- Paths (drawn first, underneath everything) ----
  {
    id: "playerPaths", group: "Paths", side: "players", kind: "path", z: 1, defaultOn: true,
    color: COLORS.players, paths: (p) => !p.bot,
  },
  {
    id: "botPaths", group: "Paths", side: "bots", kind: "path", z: 0, defaultOn: true,
    color: COLORS.bots, paths: (p) => p.bot,
  },

  // ---- Markers (drawn on top, in z order) ----
  {
    id: "loot", group: "Loot", side: "players", kind: "marker", z: 2, defaultOn: true,
    color: COLORS.loot, shape: SHAPES.loot,
    events: (e) => !e.bot && isType(e, "Loot"),
  },
  {
    id: "playerKills", group: "Kills", side: "players", kind: "marker", z: 3, defaultOn: true,
    color: COLORS.players, shape: SHAPES.kill,
    events: (e) => !e.bot && isType(e, "Kill", "BotKill"),
  },
  {
    // A bot killing a player is logged in the player's file, at the player's position.
    id: "botKills", group: "Kills", side: "bots", kind: "marker", z: 3, defaultOn: false,
    color: COLORS.bots, shape: SHAPES.kill,
    note: "Shown where the player died (same events as player deaths by bots)",
    events: (e) => !e.bot && isType(e, "BotKilled"),
  },
  {
    id: "playerDeaths", group: "Deaths", side: "players", kind: "marker", z: 4, defaultOn: true,
    color: COLORS.players, shape: SHAPES.death,
    events: (e) => !e.bot && isType(e, "Killed", "BotKilled"),
  },
  {
    // A player killing a bot is logged in the player's file, at the player's position.
    id: "botDeaths", group: "Deaths", side: "bots", kind: "marker", z: 4, defaultOn: false,
    color: COLORS.bots, shape: SHAPES.death,
    note: "Shown where the player stood when killing the bot (same events as player kills of bots)",
    events: (e) => !e.bot && isType(e, "BotKill"),
  },
  {
    id: "stormPlayers", group: "Storm deaths", side: "players", kind: "marker", z: 5, defaultOn: true,
    color: COLORS.storm, outlineColor: COLORS.players, shape: SHAPES.storm,
    events: (e) => !e.bot && isType(e, "KilledByStorm"),
  },
  {
    id: "stormBots", group: "Storm deaths", side: "bots", kind: "marker", z: 5, defaultOn: true,
    color: COLORS.storm, outlineColor: COLORS.bots, shape: SHAPES.storm,
    events: (e) => e.bot && isType(e, "KilledByStorm"),
  },
];

// Rows of the layer panel, top to bottom
export const LAYER_GROUPS = ["Paths", "Kills", "Deaths", "Storm deaths", "Loot"];

export const DEFAULT_LAYERS = new Set(LAYERS.filter((l) => l.defaultOn).map((l) => l.id));

// How many paths or markers a layer would draw for this match
export function countLayer(match, layer) {
  if (!match) return 0;
  return layer.kind === "path"
    ? match.players.filter(layer.paths).length
    : match.events.filter(layer.events).length;
}
