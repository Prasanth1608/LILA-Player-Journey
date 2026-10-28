# LILA Player Journeys

A browser tool for Level Designers to explore how players move, fight, loot and die on LILA BLACK's maps.

**Live tool:** _add Vercel link_ · **Walkthrough video:** _add link_

## Tech stack
- **Data pipeline:** Python (pandas, pyarrow, Pillow), run locally
- **Web app:** React + Vite, drawing on HTML Canvas
- **Hosting:** Vercel (static site, no backend)

## Repo layout
```
pipeline/    Python: raw .nakama-0 files -> JSON + web minimaps
notebooks/   Data exploration and verification
web/         React + Vite site (deployed to Vercel)
```

## Setup

### Web app
```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

### Data pipeline
```bash
pip install -r pipeline/requirements.txt
python pipeline/minimaps.py --input <path-to>/player_data/minimaps --output web/public/minimaps
```

## Environment variables
None. The site is static and needs no keys or secrets.

## Docs
- [ARCHITECTURE.md](ARCHITECTURE.md): design decisions, data flow, coordinate mapping, trade-offs
- [INSIGHTS.md](INSIGHTS.md): three findings about the game
