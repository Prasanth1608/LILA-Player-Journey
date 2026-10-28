"""Step 3 of the pipeline: reshape the clean table into what the website reads.

Produces three kinds of output (exact shapes in DATA_CONTRACT.md):
  - index.json            → list of maps, dates and matches (filters + match list)
  - matches/<id>.json     → one match: player paths + event markers (map + playback)
  - heatmaps/<map>.json   → kill / death / traffic counts per grid cell, per day
"""

import re

import numpy as np
import pandas as pd

from config import (DATA_VERSION, DEATH_EVENTS, HEATMAP_GRID, KILL_EVENTS,
                    LOOT_EVENTS, MAPS, MOVEMENT_EVENTS, PARTIAL_DATES, UV_DECIMALS)

# Combat and loot markers come from human files only: in bot files their meaning
# is undocumented and they don't mirror human events (parked, see ARCHITECTURE.md).
HUMAN_ONLY_EVENTS = KILL_EVENTS | {"Killed", "BotKilled"} | LOOT_EVENTS
STORM_EVENT = "KilledByStorm"   # the victim can be human or bot, so taken from any file


# ---------------------------------------------------------------------------
# 1. add_uv: world position → position on the minimap (0 to 1)
# ---------------------------------------------------------------------------
def add_uv(df: pd.DataFrame) -> pd.DataFrame:
    """World (x, z) → u (fraction across the map) and v (fraction up). y is height, not used.

    Each row uses its own map's scale and origin from config.py.
    """
    scale = df["map_id"].map(lambda m: MAPS[m]["scale"])
    ox = df["map_id"].map(lambda m: MAPS[m]["ox"])
    oz = df["map_id"].map(lambda m: MAPS[m]["oz"])
    df["u"] = ((df["x"] - ox) / scale).round(UV_DECIMALS)
    df["v"] = ((df["z"] - oz) / scale).round(UV_DECIMALS)
    return df


# ---------------------------------------------------------------------------
# 2. Small helpers
# ---------------------------------------------------------------------------
def short_match_id(match_id: str) -> str:
    """Drop the server suffix: 'abc.nakama-0' → 'abc' (cleaner for filenames and links)."""
    return match_id.split(".")[0]


def date_label(folder: str) -> str:
    """Readable date for the filter: 'February_10' → 'Feb 10'. Other formats shown as they are."""
    m = re.fullmatch(r"([A-Za-z]+)_(\d+)", folder)
    return f"{m.group(1)[:3]} {int(m.group(2))}" if m else folder


def marker_events(df: pd.DataFrame) -> pd.DataFrame:
    """Rows drawn as markers: kills, deaths and loot from human files + storm deaths from any file."""
    human_rows = ~df["is_bot"] & df["event"].isin(HUMAN_ONLY_EVENTS)
    return df[human_rows | (df["event"] == STORM_EVENT)]


# ---------------------------------------------------------------------------
# 3. build_index: the summary the website loads first
# ---------------------------------------------------------------------------
def build_index(df: pd.DataFrame, events: pd.DataFrame) -> dict:
    """Maps, dates and one summary line per match, for the filters and the match list."""
    g = df.groupby("match_id")

    # Humans and bots per match: count files (one file = one player in one match)
    files = df.drop_duplicates(["user_id", "match_id"])
    players = files.groupby(["match_id", "is_bot"]).size().unstack(fill_value=0)

    # Counts describe PLAYERS (humans). A bot's storm death is still a marker in the
    # match file (tagged bot), but never inflates the human death/storm counts.
    human_events = events[~events["is_bot"]]

    def count(kind: set[str]) -> pd.Series:
        """How many human marker events of these types each match has."""
        return human_events[human_events["event"].isin(kind)].groupby("match_id").size()

    summary = pd.DataFrame({
        "map": g["map_id"].first(),
        "date": g["date"].first(),
        "duration": g["t"].max(),                 # last event time = match length in seconds
        "humans": players.get(False, 0),
        "bots": players.get(True, 0),
        "kills": count(KILL_EVENTS),
        "deaths": count(DEATH_EVENTS),
        "loot": count(LOOT_EVENTS),
        "storm": count({STORM_EVENT}),
    }).fillna(0)                                  # matches with no kills etc. → 0

    # r["map"], not r.map: on a pandas row, .map is a built-in method, not the column
    matches = [{
        "id": short_match_id(mid),
        "map": r["map"], "date": r["date"], "duration": int(r["duration"]),
        "humans": int(r["humans"]), "bots": int(r["bots"]),
        "counts": {k: int(r[k]) for k in ("kills", "deaths", "loot", "storm")},
    } for mid, r in summary.sort_values(["date", "map"]).iterrows()]

    # Dates in time order (by their earliest event), each flagged if partial
    dates = sorted(df["date"].unique(), key=lambda d: df.loc[df["date"] == d, "time_utc"].min())

    return {
        "version": DATA_VERSION,
        "maps": [{"id": m, "image": f"/minimaps/{m}.jpg"} for m in MAPS if m in set(df["map_id"])],
        "dates": [{"id": d, "label": date_label(d), "partial": d in PARTIAL_DATES} for d in dates],
        "matches": matches,
    }


# ---------------------------------------------------------------------------
# 4. build_matches: one file per match, for drawing and playback
# ---------------------------------------------------------------------------
def build_matches(df: pd.DataFrame, events: pd.DataFrame):
    """For each match: every player's path [t, u, v] + every marker event.

    Grouping is done once up front (dict lookups) instead of filtering the
    whole table again for each of the ~800 matches.
    Yields (short match id, match data) one match at a time.
    """
    moves = df[df["event"].isin(MOVEMENT_EVENTS)]
    moves_by_match = dict(tuple(moves.groupby("match_id")))
    events_by_match = dict(tuple(events.groupby("match_id")))
    info = df.groupby("match_id").agg(map=("map_id", "first"), date=("date", "first"),
                                      duration=("t", "max"))
    no_rows_moves, no_rows_events = moves.iloc[0:0], events.iloc[0:0]   # empty fallbacks

    for mid, meta in info.iterrows():
        # One path per player, already in time order (the table was sorted in clean.py)
        players = [{"id": str(uid), "bot": bool(bot), "path": p[["t", "u", "v"]].to_numpy().tolist()}
                   for (uid, bot), p in moves_by_match.get(mid, no_rows_moves).groupby(["user_id", "is_bot"])]

        ev = events_by_match.get(mid, no_rows_events)
        yield short_match_id(mid), {
            "version": DATA_VERSION, "id": short_match_id(mid),
            "map": meta["map"], "date": meta["date"], "duration": int(meta["duration"]),
            "players": players,
            "events": [{"t": int(r.t), "type": r.event, "player": str(r.user_id),
                        "bot": bool(r.is_bot), "u": r.u, "v": r.v}
                       for r in ev.itertuples(index=False)],
        }


# ---------------------------------------------------------------------------
# 5. build_heatmaps: counts per grid cell, per day, per map
# ---------------------------------------------------------------------------
def _grid_counts(rows: pd.DataFrame) -> dict[str, list[list[int]]]:
    """Count rows per heatmap cell, separately for each day.

    The map is split into HEATMAP_GRID × HEATMAP_GRID cells (invisible; used only
    for counting). Cell number = row × grid + column, with row 0 at the TOP,
    matching the image. Only cells with a count are kept: [[cell, count], ...].
    """
    n = HEATMAP_GRID
    on_map = rows[rows["u"].between(0, 1) & rows["v"].between(0, 1)]
    col = np.minimum((on_map["u"] * n).astype(int), n - 1)          # 0 .. n-1 across
    row = np.minimum(((1 - on_map["v"]) * n).astype(int), n - 1)    # 0 .. n-1 down (flipped)
    cells = (row * n + col).rename("cell")
    counts = cells.groupby([on_map["date"], cells]).size()          # (day, cell) → count
    return {day: [[int(c), int(k)] for c, k in s.droplevel(0).items()]
            for day, s in counts.groupby(level=0)}


def build_heatmaps(df: pd.DataFrame, events: pd.DataFrame):
    """For each map: kill, death and traffic counts per cell, per day.

    Split by day so the website can add up only the days selected in the date filter.
    kills = Kill + BotKill · deaths = Killed + BotKilled + KilledByStorm · traffic = snapshots
    Kills and deaths are HUMAN only ("where players get kills / die"); traffic includes bots.
    """
    human_events = events[~events["is_bot"]]   # keeps a bot storm death out of the death heatmap
    for map_id in MAPS:
        m_rows = df[df["map_id"] == map_id]
        m_events = human_events[human_events["map_id"] == map_id]
        if m_rows.empty:
            continue
        yield map_id, {
            "version": DATA_VERSION, "map": map_id, "grid": HEATMAP_GRID,
            "layers": {
                "kills":   _grid_counts(m_events[m_events["event"].isin(KILL_EVENTS)]),
                "deaths":  _grid_counts(m_events[m_events["event"].isin(DEATH_EVENTS)]),
                "traffic": _grid_counts(m_rows[m_rows["event"].isin(MOVEMENT_EVENTS)]),
            },
        }
