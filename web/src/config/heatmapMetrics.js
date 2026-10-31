// Heatmap choices. Existing pipeline metric ids are retained; new views combine them
// in the browser so the data pipeline and generated JSON do not need to change.
export const HEAT_GROUPS = [
  {
    id: "traffic", label: "Traffic", one: "visitor", many: "visitors",
    metrics: { players: "traffic_players", bots: "traffic_bots" },
  },
  {
    id: "kills", label: "Kill Zones", one: "kill", many: "kills",
    metrics: { players: "kills_players", bots: "kills_bots" },
    notes: { bots: "Where bots killed players (at the player's position)" },
  },
  {
    id: "deaths", label: "Death Zones", one: "death", many: "deaths",
    metrics: { players: "deaths_players", bots: "deaths_bots" },
    notes: { bots: "Where players stood when killing bots" },
  },
  {
    id: "storm", label: "Storm deaths", one: "storm death", many: "storm deaths",
    metrics: { players: "storm_players", bots: "storm_bots" },
  },
  {
    id: "loot", label: "Loot", one: "loot", many: "loot",
    metrics: { players: "loot_players" },
  },
];

export const HEAT_SIDES = [
  { id: "players", label: "Players" },
  { id: "bots", label: "Bots" },
  { id: "both", label: "Both" },
];

export const DEFAULT_HEAT_SELECTION = { group: "traffic", side: "both" };
export const DEFAULT_HEAT_SELECTIONS = ["traffic:both"];

export const selectionKey = ({ group, side }) => `${group}:${side}`;
export function selectionFromKey(key) {
  const [group, side] = String(key).split(":");
  return { group, side };
}

// "Both" includes the player and bot arrays, so it must not be shown alongside
// either constituent layer for the same metric group (which would double-render it).
export function toggleHeatSelection(current, key) {
  const { group, side } = selectionFromKey(key);
  const next = new Set(current);
  if (next.has(key)) {
    next.delete(key);
    return next;
  }
  if (side === "both") {
    next.delete(`${group}:players`);
    next.delete(`${group}:bots`);
  } else {
    next.delete(`${group}:both`);
  }
  next.add(key);
  return next;
}
export const groupById = Object.fromEntries(HEAT_GROUPS.map((g) => [g.id, g]));

export function sideAvailable(group, side) {
  if (group.sides) return group.sides.includes(side);
  return side === "both" ? Object.keys(group.metrics ?? {}).length === 2 : Boolean(group.metrics?.[side]);
}

export function metricIdsFor({ group, side }) {
  const g = groupById[group];
  if (!g || !sideAvailable(g, side)) return [];
  return side === "both" ? Object.values(g.metrics) : [g.metrics[side]];
}
