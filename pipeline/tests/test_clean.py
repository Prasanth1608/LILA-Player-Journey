"""Tests for the cleaning rules that were hardest to get right.

Run from the repo root:  python -m pytest pipeline/tests
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # import pipeline modules

from clean import (add_time, decode_events, drop_duplicate_rows,            # noqa: E402
                   tag_bots, unclear_files)
from transform import (add_uv, build_heatmaps, build_index,                 # noqa: E402
                       marker_events, short_match_id)


def rows(*events, user="u1", match="m1.nakama-0", ts=1_770_792_362, map_id="AmbroseValley"):
    """Small table: one row per event, all at the same time and place."""
    return pd.DataFrame({
        "user_id": user, "match_id": match, "map_id": map_id,
        "x": 0.0, "y": 0.0, "z": 0.0,
        "ts": pd.to_datetime([ts] * len(events), unit="ms"),   # seconds stored as "ms", like the real data
        "event": list(events),
    })


def test_decode_events_turns_bytes_into_text():
    df = decode_events(rows(b"Position", "Loot"))
    assert df["event"].tolist() == ["Position", "Loot"]


def test_duplicate_snapshots_and_deaths_are_dropped_but_loot_kept():
    df = rows("Position", "Position", "BotKilled", "BotKilled", "Loot", "Loot")
    out, dropped = drop_duplicate_rows(df)
    assert dropped == 2
    assert out["event"].tolist() == ["Position", "BotKilled", "Loot", "Loot"]


def test_bot_is_decided_by_events_not_id():
    numeric_human = rows("Position", "Loot", user="1429")
    real_bot = rows("BotPosition", user="1440")
    df = tag_bots(pd.concat([numeric_human, real_bot], ignore_index=True))
    assert df.groupby("user_id")["is_bot"].first().to_dict() == {"1429": False, "1440": True}


def test_files_with_neither_movement_event_are_flagged():
    clear_human = rows("Position", user="h1")
    clear_bot = rows("BotPosition", user="b1")
    only_loot = rows("Loot", user="x1")                       # neither Position nor BotPosition
    df = pd.concat([clear_human, clear_bot, only_loot], ignore_index=True)
    assert unclear_files(df) == 1


def test_ts_is_read_as_seconds_and_t_starts_at_match_start():
    a = rows("Position", user="a", ts=1_770_792_362)
    b = rows("Position", user="b", ts=1_770_792_372)   # joined 10 s later, same match
    df = add_time(pd.concat([a, b], ignore_index=True))
    assert df["time_utc"].iloc[0].year == 2026
    assert df["t"].tolist() == [0, 10]


def test_ts_in_real_milliseconds_is_also_handled():
    df = add_time(rows("Position", ts=1_770_792_362_000))   # a future, correctly labelled export
    assert df["time_utc"].iloc[0].year == 2026


def test_readme_coordinate_example():
    df = add_uv(pd.DataFrame({"map_id": ["AmbroseValley"], "x": [-301.45], "z": [-355.55]}))
    assert round(df["u"].iloc[0] * 1024) == 78
    assert round((1 - df["v"].iloc[0]) * 1024) == 890


def test_bot_storm_death_is_a_marker_but_not_a_player_death():
    human = rows("Position", "KilledByStorm", user="h1")
    bot = rows("BotPosition", "KilledByStorm", user="b1")
    df = pd.concat([human, bot], ignore_index=True)
    df["date"] = "February_10"
    df = add_uv(add_time(tag_bots(df)))
    events = marker_events(df)
    assert len(events) == 2                                     # both drawn as markers
    index = build_index(df, events)
    assert index["matches"][0]["counts"]["storm"] == 1          # only the human counted
    heat = dict(build_heatmaps(df, events))["AmbroseValley"]
    assert sum(c for _, c in heat["layers"]["deaths"]["February_10"]) == 1


def test_short_match_id_drops_server_suffix():
    assert short_match_id("b71aaad8-aa62.nakama-0") == "b71aaad8-aa62"
