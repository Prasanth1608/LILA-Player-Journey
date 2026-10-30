# LILA Player Journeys

Explore where players move, fight, loot, and die across **LILA: Black** matches. Built specifically for level designers, this web app turns game telemetry into clear, interactive visualisations so you can inspect player behaviour quickly and easily.

**Live demo:** [https://lila-player-journey-nine.vercel.app/](https://lila-player-journey-nine.vercel.app/) · No account, setup, or environment variables required.

<!-- Replace these paths with the final screenshots in the repository. -->
![Replay view](docs/images/replay.png)
![Heatmaps view](docs/images/heatmaps.png)

## How to use

- Choose a **map** and **day range**. Search for a match ID or sort the match list by players, newest, kills, loot, and other available fields.
- **Replay:** Select a match and press Play to follow player movement through the match. Toggle the available layers to inspect **Paths, Kills, Deaths, Storm deaths,** and **Loot**. Players are shown in blue and bots in orange.
- **Heatmaps:** Choose a metric — **Traffic, Kills, Deaths, Storm deaths,** or **Loot** — and select **Players, Bots,** or **Both** where available. Tick the checkboxes beside multiple matches to combine and compare their data in a single heatmap view. Hover over hotspots on the map to see exact counts.
- **Navigate the map:** Use the mouse wheel or the +/− controls to zoom, and drag to pan.
- **Switch themes:** Use the sun/moon control to switch between light and dark themes.

## Reading the data

The visualisations are built from match telemetry, including player positions and recorded in-game events.

- **Paths** show recorded player movement throughout a match.
- **Kills** show where eliminations occurred.
- **Deaths** show where players were eliminated.
- **Storm deaths** show where players were eliminated by the storm.
- **Loot** shows where loot events were recorded.
- **Traffic** represents the number of different players who visited an area. It measures how many players passed through an area, not how long they stayed there.
- **Heatmap intensity** is relative to the busiest location in the data currently displayed. Hover over a hotspot to inspect its exact count.
- **Time values** are displayed in UTC.

## Tech stack

- **Data pipeline:** Python 3, pandas, and PyArrow
- **Frontend:** JavaScript, React 18, and Vite 5
- **Map visualisation:** HTML Canvas
- **Testing and code quality:** pytest, Vitest, and ESLint
- **Hosting:** Vercel (static site)

## Data source

The pipeline processes the raw Parquet game dataset and Nakama files. The Nakama data provides match telemetry such as player positions, events, user IDs, match IDs, and timestamps. This data is cleaned, transformed, and exported as static JSON files for the web app to consume.

## Run locally

### Requirements

- Python 3.10+
- Node.js 18+
- Access to the raw Parquet dataset, including the game data and Nakama files (not included in this repository)

### Install dependencies and generate the data

```bash
pip install -r pipeline/requirements.txt

python pipeline/preprocess.py \
  --input "<path>/player_data" \
  --output web/public/data
```

### Start the web app

```bash
cd web
npm install
npm run dev
```

The app does not require environment variables.

### Run tests and lint

From the repository root:

```bash
python -m pytest pipeline/tests
```

From the `web/` directory:

```bash
npm test
npm run lint
```

## Repository structure

```text
pipeline/       Data loading, cleaning, transformation, and export
                Pipeline tests and DATA_CONTRACT.md

web/src/        React application
  components/   UI components
  renderer/     Canvas drawing
  lib/          Shared logic and unit tests
  config/       Layer and metric configuration
  theme/        Colours and sizing
  hooks/        React hooks
  data/         Data access

web/public/     Minimap images and generated data
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, data flow, coordinate mapping, assumptions, and trade-offs
- [INSIGHTS.md](INSIGHTS.md) — gameplay and level-design observations from the data
- [pipeline/DATA_CONTRACT.md](pipeline/DATA_CONTRACT.md) — data pipeline contract
