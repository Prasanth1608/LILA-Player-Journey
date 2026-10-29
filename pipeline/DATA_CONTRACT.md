# Data contract (pipeline → web)

The pipeline writes these files to `web/public/data/`. The web app reads only these.
Every file carries `"version"`; bump it when a shape changes, and update both sides.

Positions are **fractions of the minimap** (`u` across, `v` up, 0–1), not pixels.
Pixel = `u × width`, `(1 − v) × height` of whatever size the map is drawn at.
Times are **seconds since the match started** (`t`).

## `index.json` — loaded when the page opens
```json
{
  "version": 3,
  "maps":  [{ "id": "AmbroseValley", "image": "/minimaps/AmbroseValley.jpg" }],
  "dates": [{ "id": "February_14", "label": "Feb 14", "partial": true }],
  "matches": [{
    "id": "fbbc5d02-dd79-42fb-bba5-d768023891c8",
    "map": "AmbroseValley",
    "date": "February_10",
    "duration": 512, "start": 1739176320,
    "humans": 2, "bots": 14,
    "counts": { "kills": 12, "deaths": 1, "loot": 30, "storm": 0 }
  }]
}
```

## `matches/<id>.json` — loaded when a match is selected
```json
{
  "version": 3,
  "id": "fbbc5d02-…", "map": "AmbroseValley", "date": "February_10", "duration": 512,
  "players": [
    { "id": "f4e072fa-…", "bot": false, "path": [[0, 0.0762, 0.1305], [5, 0.0790, 0.1350]] }
  ],
  "events": [
    { "t": 120, "type": "BotKill", "player": "f4e072fa-…", "bot": false, "u": 0.41, "v": 0.62 }
  ]
}
```
- `path` rows are `[t, u, v]`, sorted by `t`.
- `events.type` is the raw event name: `Kill`, `BotKill`, `Killed`, `BotKilled`, `KilledByStorm`, `Loot`.
- Combat and loot events come from **human files only**; `KilledByStorm` from any file.

## `heatmaps/<map>.json` — loaded when Heatmaps mode opens a map
```json
{
  "version": 3, "map": "AmbroseValley", "grid": 64,
  "metrics": ["traffic_players", "traffic_bots", "kills_players", "kills_bots", "deaths_players",
              "deaths_bots", "storm_players", "storm_bots", "loot_players"],
  "matches": {
    "fbbc5d02-…": { "traffic_players": [cell, count, cell, count, …], "kills_players": [ … ] }
  }
}
```
- Stored **per match**, so the website can add up any set of ticked matches.
- The map is split into `grid × grid` cells; `cell = row × grid + col`, row 0 at the **top**.
- Each list is flat `[cell, count, cell, count, …]`, only cells with a count. Metrics with no data are omitted.
- Metric rules (pipeline/config.py `HEAT_METRICS`), mirroring the Replay layer grid:

| Metric | Rows |
|---|---|
| traffic_players / traffic_bots | Position (human files) / BotPosition (bot files); counts **different players** per cell (each player once per cell per match), not samples |
| kills_players | Kill + BotKill (human files) |
| kills_bots | BotKilled (human files): a bot killed a player, at the player's position |
| deaths_players | Killed + BotKilled (human files) |
| deaths_bots | BotKill (human files): a player killed a bot, at the player's position |
| storm_players / storm_bots | KilledByStorm in human / bot files |
| loot_players | Loot (human files) |

In `index.json`, match `counts` are human-only. A bot's storm death still appears as a marker in its match file, with `"bot": true`.

**`start`** (index matches): Unix seconds (UTC) of the match's first recorded event. Used to sort newest/oldest. Added after version 2; the web app still works without it (falls back to day order).
