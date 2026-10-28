# Data contract (pipeline → web)

The pipeline writes these files to `web/public/data/`. The web app reads only these.
Every file carries `"version"`; bump it when a shape changes, and update both sides.

Positions are **fractions of the minimap** (`u` across, `v` up, 0–1), not pixels.
Pixel = `u × width`, `(1 − v) × height` of whatever size the map is drawn at.
Times are **seconds since the match started** (`t`).

## `index.json` — loaded when the page opens
```json
{
  "version": 1,
  "maps":  [{ "id": "AmbroseValley", "image": "/minimaps/AmbroseValley.jpg" }],
  "dates": [{ "id": "February_14", "label": "Feb 14", "partial": true }],
  "matches": [{
    "id": "fbbc5d02-dd79-42fb-bba5-d768023891c8",
    "map": "AmbroseValley",
    "date": "February_10",
    "duration": 512,
    "humans": 2, "bots": 14,
    "counts": { "kills": 12, "deaths": 1, "loot": 30, "storm": 0 }
  }]
}
```

## `matches/<id>.json` — loaded when a match is selected
```json
{
  "version": 1,
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

## `heatmaps/<map>.json` — loaded when a heatmap is turned on
```json
{
  "version": 1, "map": "AmbroseValley", "grid": 64,
  "layers": {
    "kills":   { "February_10": [[cell, count], …] },
    "deaths":  { "February_10": [[cell, count], …] },
    "traffic": { "February_10": [[cell, count], …] }
  }
}
```
- The map is split into `grid × grid` cells; `cell = row × grid + col`, row 0 at the **top**.
- Lists are sparse: only cells with a count > 0.
- The web app adds up the selected days.
- `kills` = Kill + BotKill · `deaths` = Killed + BotKilled + KilledByStorm · `traffic` = Position + BotPosition snapshots.
- `kills` and `deaths` count **humans only** ("where players get kills / die"). `traffic` includes bots.
- In `index.json`, `counts` are also human-only. A bot's storm death still appears as a marker in its match file, with `"bot": true`.
