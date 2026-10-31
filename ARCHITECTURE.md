# Architecture

LILA Player Journeys is a static web application for level designers to inspect player movement and match events on LILA: Black maps. The system has two main parts: an offline Python pipeline that converts raw Parquet telemetry into browser-ready JSON, and a React application that loads the generated data and renders it on minimaps with HTML Canvas.

## 1. Technology choices

| Area | Choice | Why it was chosen |
|---|---|---|
| Data preprocessing | Python, pandas, PyArrow, NumPy | The source data is Parquet. pandas makes it practical to load, clean, group and aggregate telemetry; PyArrow reads Parquet; NumPy supports efficient grid and coordinate calculations. The pipeline runs offline when the dataset changes. |
| Data format | Preprocessed, static JSON | The browser does not need a live Python service or database. The files are easy to host as static assets, and the website can request only the data needed for the current view. |
| Frontend | React 18 + Vite 5 | React is used for the interface, filters, panels and application state. Vite provides the development server and production build. |
| Map rendering | HTML Canvas 2D, outside React's component rendering | Paths, markers and heatmap overlays can contain many visual elements and update during playback. Canvas gives the renderer direct control over drawing without creating a DOM element for every point or marker. React manages the controls and state; renderer classes draw the map. |
| Hosting | Vercel static hosting | The built frontend and generated JSON/minimap assets can be served as static files. No application server or environment variables are required. |
| Quality checks | pytest and frontend unit tests | The pipeline and frontend contain focused tests for data rules, heatmap calculations, interpolation, playback timing and viewport maths. The submission guide also lists Vitest and ESLint; however, the current `web/package.json` does not declare their dependencies or test/lint scripts, so those commands should be verified before being presented as runnable setup steps. |

## 2. Data flow: Parquet to screen

The pipeline is run when the source dataset changes. It produces the files consumed by the website.

```text
player_data/
  <day>/*.nakama-0
        |
        v
  LOAD
  Find Parquet files recursively, skip duplicate filenames,
  read the files and attach the source day
        |
        v
  CLEAN
  Decode event names, remove duplicate snapshots/deaths,
  identify bot files, normalise timestamps and report unknown data
        |
        v
  TRANSFORM
  Convert world coordinates to minimap fractions,
  build match summaries, player paths, event markers and heatmap grids
        |
        v
  EXPORT
  web/public/data/
    index.json
    matches/<match-id>.json
    heatmaps/<map-id>.json
        |
        v
  REACT APP
  Load index on startup
    ├── Replay: fetch selected match JSON
    └── Heatmaps: fetch selected map's heatmap JSON
        |
        v
  CANVAS
  Draw minimap, paths, directional chevrons, event markers
  or the selected heatmap overlay
```

**What each exported file is for**

- `index.json` is loaded when the application starts. It contains available maps, dates and match summaries used by the filters and match list.
- `matches/<id>.json` is loaded when a match is selected in Replay. It contains each player's time-ordered path (`t`, `u`, `v`) and the match's event markers.
- `heatmaps/<map>.json` is loaded when Heatmaps mode opens a map. It stores metric counts per match and per grid cell, allowing the browser to combine any selected set of matches without downloading individual match paths.

The frontend caches each successfully fetched JSON request in memory. Replay does not request heatmap data, and Heatmaps does not request individual match files. Switching back to already loaded data reuses the cached request. Failed requests are removed from the cache so they can be retried.

## 3. World-to-minimap coordinate mapping

This is the key transformation: game-world positions must line up with the supplied top-down minimap images.

The source position uses world `x`, `y`, and `z`. The minimap is top-down, so `y` (height) is ignored. For each map, the pipeline uses a configured world-space scale and bottom-left origin:

\[
u = \frac{x - origin_x}{scale}
\qquad
v = \frac{z - origin_z}{scale}
\]

`u` and `v` are normalised minimap fractions. They are stored in the JSON rather than storing pixel coordinates, so the same telemetry works with different image dimensions and viewport sizes.

| Map | Scale | Origin X | Origin Z |
|---|---:|---:|---:|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

The renderer converts those fractions into canvas coordinates using the current map viewport:

\[
pixel_x = u \times image\_width
\qquad
pixel_y = (1-v) \times image\_height
\]

The vertical flip is intentional: game `v` increases upwards, while image and canvas Y coordinates increase downwards. The viewport then applies the current zoom and pan to every layer through the same conversion function, so paths, markers and heatmaps stay aligned.

For heatmaps, the normalised position is assigned to a 64 × 64 grid. The column is derived from `u`; the row is derived from `(1-v)` so row zero is at the top, matching the image. Cells are stored as `row × grid + column`. Positions outside the normalised map bounds are excluded from heatmap aggregation.

The map image's original aspect ratio is preserved when it is loaded. This matters for GrandRift, whose minimap is 2048 × 2046 rather than a perfect square. The coordinate conversion was checked with a worked unit-test example and by visually checking that paths follow roads on all three maps.

## 4. Assumptions and ambiguous data

| Data issue | Handling |
|---|---|
| Timestamp unit is unclear | The source labels `ts` as milliseconds, but the observed values are Unix seconds. The pipeline detects seconds, milliseconds, microseconds or nanoseconds from the magnitude of the values, converts to UTC, and derives match time as whole seconds since the earliest event in that match. |
| Human or bot identity is not reliable from `user_id` alone | A player/match file is tagged as a bot if it contains a `BotPosition` event. Numeric IDs were not used as the rule because some numeric-ID files contain normal human `Position` and `Loot` events. Files containing both or neither position type are counted and reported as unclear. |
| Some matches have bot kills but no bot movement files | The tool reports recorded bot paths, not a guessed total number of bots. |
| Event meaning differs between human and bot files | Combat and loot markers/metrics are taken from human files. `KilledByStorm` is taken from either human or bot files because the victim can be either. A bot storm death can appear as a bot marker but does not inflate the human death count. |
| Duplicate files and repeated events | The source contained 1,243 files but 1,242 unique user + match combinations. One file (`cfa03e9f..._ac049b28...`) appeared in both February 10 and February 11 with identical content (88 rows, February 10 23:51:05–23:56:37 UTC). The February 10 copy was retained because its timestamps match that date; the February 11 copy was skipped. This duplicate also explained one of the three files initially showing double deaths. Separately, exact repeated movement snapshots and death rows are dropped, while repeated Loot and BotKill rows are retained because they can represent legitimate events. |
| Folder date vs. event date | 436 rows (0.5%) decode to a UTC date different from their folder date. They affect only 5 matches; every mismatched row is at UTC hour 23 and appears in the following day's folder (14 rows in `Feb_10` are dated February 9; 422 rows in `Feb_11` are dated February 10). Three of the five matches cross midnight UTC. This is a day-boundary effect: files may be assigned by a later time, such as match end or export time, or by a time zone ahead of UTC. It is harmless for this analysis, so the folder date is retained for date filtering. |
| “Traffic” could mean time spent or number of visitors | Traffic counts different players visiting a cell: each player is counted once per cell per match. It is not dwell time or the number of position samples. This makes a busy area represent a crowd rather than one player camping there. |
| Missing position samples could create misleading straight paths | Path segments with gaps greater than 20 seconds are not connected. This avoids drawing movement that was not recorded. |
| The final day is incomplete | February 14 is explicitly flagged as a partial day in the index and UI. |
| Unknown event types or maps may appear in future data | They are reported in the pipeline summary rather than causing the whole run to fail. Rows on maps without configured coordinate settings cannot be mapped and are excluded from the supported-map output. |

## 5. Product and UX decisions

These are product decisions implemented to make the telemetry useful and approachable for level designers, not just a raw data viewer.

1. **Replay and Heatmaps are separate modes.** Replay answers “what happened in this match?” Heatmaps answer “where do patterns appear across one or more matches?” Keeping them separate also means each mode loads only the data it needs.
2. **Multiple-match comparison in Heatmaps/Replay.** Designers can tick several matches and combine their per-match cell counts into one map. If no matches are ticked, the selected match is used. Changing maps clears the current comparison selection.
3. **Dark and light themes.** A theme toggle supports different viewing preferences and environments.
4. **Map navigation.** Mouse-wheel zoom, drag-to-pan and zoom controls share one viewport across all drawing layers. The camera is stored as map fractions so resizing the canvas preserves the viewed area. Canvas backing resolution uses the device pixel ratio for crisp rendering. Direction chevrons are positioned and oriented along the path in screen space, so their spacing responds to zoom.
5. **Variable-speed replay and event animation.** Replay supports 5×, 10×, 20× and 40× playback. A playback clock advances independently of React's normal component rendering; the Canvas renderer redraws the moving players, paths and event effects as time advances. Users can also seek and choose a full path or a recent 30-second trail.
6. **Focused filters and readable heatmaps.** Heatmaps support displaying multiple metrics simultaneously for side-by-side comparison, with Players, Bots, or Both selectable. Each metric is visualised using transparent fills, three relative intensity levels, and thin outlines to keep the minimap visible. Hovering over a hotspot reveals the underlying counts for that metric.

## 6. Major trade-offs

| Decision | Chosen | Considered alternative | Reason and consequence |
|---|---|---|---|
| Where to compute | Offline Python pipeline → static JSON | Live API and database | Simple deployment, fast static hosting and no running backend. The dataset must be reprocessed and redeployed when source data changes. |
| When to load data | Load the index first; fetch a match or map heatmap only when opened; cache it | Preload every match and heatmap | Keeps the initial screen light and avoids downloading data for an unused mode. The first visit to a match/map incurs its file download. |
| How to draw the map | Canvas renderer outside React | SVG or individual DOM elements | Better suited to many path points, markers and animated updates. The trade-off is that hit-testing and drawing behaviour must be implemented explicitly. |
| How to organise analysis | Separate Replay and Heatmaps modes | One combined view | A single-match timeline and cross-match spatial patterns answer different design questions. Separate modes keep their controls and data loading focused. |
| Heatmap metric selection | One metric at a time, with Players/Bots/Both | Blend multiple metrics together | Kills, deaths, loot and traffic have different meanings and units; adding them together would produce an ambiguous result. |
| Traffic definition | Unique players per cell per match | Count position samples or time spent | Measures how many different players visit an area. It does not measure dwell time; a separate time-spent metric would be needed for that. |
| Heatmap appearance | Three relative levels, thin outlines and density-faded transparent fills | A continuous opaque colour gradient | Hotspots remain easy to spot while the map stays readable; hover provides exact counts. Intensity is relative to the busiest cell in the current selection, not an absolute cross-map scale. |
| Initial scope | Desktop-first, focused feature set | Mobile layout and additional metrics | Prioritises the level-design inspection workflow and finishing the core tool. Mobile support and further metrics remain possible future work. |
