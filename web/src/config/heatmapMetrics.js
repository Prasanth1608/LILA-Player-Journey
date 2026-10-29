// Heatmap choices: ONE metric at a time, for Players, Bots or Both.
// "Both" adds players + bots of the same metric (same unit, so the sum is meaningful).
// Metric ids match the pipeline's HEAT_METRICS (pipeline/config.py, DATA_CONTRACT.md).
export const HEAT_GROUPS = [
  {
    id: "traffic", label: "Traffic", one: "position sample", many: "position samples",
    metrics: { players: "traffic_players", bots: "traffic_bots" },
  },
  {
    id: "kills", label: "Kills", one: "kill", many: "kills",
    metrics: { players: "kills_players", bots: "kills_bots" },
    notes: { bots: "Where bots killed players (at the player's position)" },
  },
  {
    id: "deaths", label: "Deaths", one: "death", many: "deaths",
    metrics: { players: "deaths_players", bots: "deaths_bots" },
    notes: { bots: "Where players stood when killing bots" },
  },
  {
    id: "storm", label: "Storm deaths", one: "storm death", many: "storm deaths",
    metrics: { players: "storm_players", bots: "storm_bots" },
  },
  {
    id: "loot", label: "Loot", one: "loot", many: "loot",
    metrics: { players: "loot_players" },   // bots don't loot
  },
];

export const HEAT_SIDES = [
  { id: "players", label: "Players" },
  { id: "bots", label: "Bots" },
  { id: "both", label: "Both" },
];

export const DEFAULT_HEAT_SELECTION = { group: "traffic", side: "players" };

export const groupById = Object.fromEntries(HEAT_GROUPS.map((g) => [g.id, g]));

// Is this side available for this metric? (e.g. no "Bots" or "Both" for loot)
export function sideAvailable(group, side) {
  return side === "both" ? Object.keys(group.metrics).length === 2 : Boolean(group.metrics[side]);
}

// The pipeline metric ids behind a selection, e.g. kills + both → [kills_players, kills_bots]
export function metricIdsFor({ group, side }) {
  const g = groupById[group];
  if (!g || !sideAvailable(g, side)) return [];
  return side === "both" ? Object.values(g.metrics) : [g.metrics[side]];
}
