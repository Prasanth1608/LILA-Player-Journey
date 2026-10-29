// Tests that each map layer picks exactly the right paths and events.
import { describe, expect, it } from "vitest";
import { DEFAULT_LAYERS, LAYERS, countLayer } from "./layers.js";

const ev = (type, bot = false) => ({ type, bot, u: 0.5, v: 0.5, t: 0, player: "p" });

// One match with one of everything, from the human file's point of view
const match = {
  players: [{ bot: false, path: [] }, { bot: true, path: [] }, { bot: true, path: [] }],
  events: [
    ev("Kill"), ev("BotKill"), ev("BotKill"),   // player kills: 3 (1 human, 2 bots)
    ev("Killed"), ev("BotKilled"),              // player deaths: 2 (1 by human, 1 by bot)
    ev("KilledByStorm"), ev("KilledByStorm", true),
    ev("Loot"), ev("Loot"),
  ],
};
const count = (id) => countLayer(match, LAYERS.find((l) => l.id === id));

describe("map layers", () => {
  it("counts paths by side", () => {
    expect(count("playerPaths")).toBe(1);
    expect(count("botPaths")).toBe(2);
  });
  it("reads kills and deaths from the human side of each fight", () => {
    expect(count("playerKills")).toBe(3);
    expect(count("botDeaths")).toBe(2);   // = player kills of bots
    expect(count("playerDeaths")).toBe(2);
    expect(count("botKills")).toBe(1);    // = player deaths by bots
  });
  it("splits storm deaths by victim", () => {
    expect(count("stormPlayers")).toBe(1);
    expect(count("stormBots")).toBe(1);
  });
  it("counts loot", () => {
    expect(count("loot")).toBe(2);
  });
  it("returns 0 with no match selected", () => {
    expect(countLayer(null, LAYERS[0])).toBe(0);
  });
  it("starts with every layer on (designers see everything, then switch off)", () => {
    expect(DEFAULT_LAYERS.size).toBe(LAYERS.length);
  });
  it("has 9 layers with unique ids", () => {
    expect(new Set(LAYERS.map((l) => l.id)).size).toBe(9);
  });
});
