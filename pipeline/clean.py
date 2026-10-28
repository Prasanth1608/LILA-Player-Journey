"""Step 2 of the pipeline: fix the problems found in the raw data.

Each rule is its own small function, so it's easy to read, test and change.
The `clean` function at the bottom runs them all in order.
(How each rule was found: see notebooks/explore.ipynb.)
"""

import pandas as pd

from config import DEDUPE_EVENTS, KNOWN_EVENTS, MAPS

FILE_KEY = ["user_id", "match_id"]   # one file = one player in one match


# ---------------------------------------------------------------------------
# 1. decode_events: bytes → text
# ---------------------------------------------------------------------------
def decode_events(df: pd.DataFrame) -> pd.DataFrame:
    """`event` is stored as bytes (b'Position'); turn it into text ('Position').

    Without this, checks like event == "Kill" silently never match.
    """
    df["event"] = df["event"].map(lambda v: v.decode("utf-8") if isinstance(v, bytes) else v)
    return df


# ---------------------------------------------------------------------------
# 2. drop_duplicate_rows: remove repeats that can only be a logging bug
# ---------------------------------------------------------------------------
def drop_duplicate_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Drop exact repeats of snapshots and deaths (same player, match, time, event, x, y, z).

    A snapshot can't fire twice in one second and a player can't die twice.
    Repeated Loot and BotKill rows are kept: x/z is the player's own position,
    so several pickups or kills in the same second from one spot look identical.

    Returns: (rows kept, number dropped)
    """
    cols = FILE_KEY + ["ts", "event", "x", "y", "z"]               # all 7 must match
    is_repeat = df.duplicated(subset=cols, keep="first")           # copies of an earlier row
    drop = is_repeat & df["event"].isin(DEDUPE_EVENTS)             # ...and a snapshot or death
    return df.loc[~drop].reset_index(drop=True), int(drop.sum())   # keep everything else


# ---------------------------------------------------------------------------
# 3. tag_bots: human or bot, decided by events
# ---------------------------------------------------------------------------
def tag_bots(df: pd.DataFrame) -> pd.DataFrame:
    """Mark each file as bot (True) if it contains any BotPosition event.

    The README rule (numeric user_id = bot) is wrong for 17 files: numeric-ID
    files with Position + Loot behave exactly like humans.
    """
    is_botpos = df["event"] == "BotPosition"
    # For each file (player + match): does ANY row say BotPosition? Copy that answer to all its rows.
    has_botpos = is_botpos.groupby([df[k] for k in FILE_KEY]).transform("any")
    df["is_bot"] = has_botpos.to_numpy()
    return df


def unclear_files(df: pd.DataFrame) -> int:
    """Files that break the human/bot assumption: both Position and BotPosition, or neither.

    In the February data every file has exactly one of them, so "not a bot" means human.
    New data could break that, so it's counted every run and printed as a warning.
    """
    keys = [df[k] for k in FILE_KEY]
    has_pos = (df["event"] == "Position").groupby(keys).any()
    has_botpos = (df["event"] == "BotPosition").groupby(keys).any()
    return int((has_pos == has_botpos).sum())   # equal = both True or both False


# ---------------------------------------------------------------------------
# 4. add_time: real time and seconds since match start
# ---------------------------------------------------------------------------
def _raw_seconds(ts: pd.Series) -> pd.Series:
    """Unix seconds from the `ts` column, whatever unit the number is really in.

    The data labels `ts` as milliseconds, but the numbers are seconds (10 digits).
    To keep working if a future export fixes the label, the unit is read from
    the size of the number: ~10 digits = s, 13 = ms, 16 = µs, 19 = ns.
    """
    raw = ts.astype("int64")                     # the plain number behind the date
    median = raw.median()
    for divisor, threshold in ((1_000_000_000, 1e17),   # nanoseconds
                               (1_000_000, 1e14),       # microseconds
                               (1_000, 1e11)):          # milliseconds
        if median > threshold:
            return raw // divisor
    return raw                                   # already seconds (our data)


def add_time(df: pd.DataFrame) -> pd.DataFrame:
    """Add `time_utc` (real date/time) and `t` (whole seconds since the match started).

    The match start is the earliest event of ANY player in that match,
    so every player in a match shares one clock during playback.
    """
    secs = _raw_seconds(df["ts"])
    df["time_utc"] = pd.to_datetime(secs, unit="s", utc=True)
    match_start = secs.groupby(df["match_id"]).transform("min")
    df["t"] = (secs - match_start).astype("int64")
    return df


# ---------------------------------------------------------------------------
# 5. check_unknowns: anything the pipeline doesn't recognise
# ---------------------------------------------------------------------------
def check_unknowns(df: pd.DataFrame) -> dict[str, list[str]]:
    """Event types or maps not listed in config.py (should be empty; printed as a warning)."""
    return {
        "events": sorted(set(df["event"].unique()) - KNOWN_EVENTS),
        "maps": sorted(set(df["map_id"].unique()) - MAPS.keys()),
    }


# ---------------------------------------------------------------------------
# 6. clean: run every rule, in order
# ---------------------------------------------------------------------------
def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Run all cleaning rules. Returns (clean rows, report for the summary)."""
    df = decode_events(df)                  # 1. must come first: later steps compare event text
    df, dropped = drop_duplicate_rows(df)   # 2.
    df = tag_bots(df)                       # 3.
    unclear = unclear_files(df)             # 3b. should be 0
    df = add_time(df)                       # 4.
    unknown = check_unknowns(df)            # 5.

    # Rows on a map we have no settings for can't be placed on a minimap: set aside.
    df = df[df["map_id"].isin(MAPS.keys())].reset_index(drop=True)

    # Sort by match, then time. "Stable" keeps same-second events in their file order.
    df = df.sort_values(["match_id", "t"], kind="stable").reset_index(drop=True)

    return df, {"duplicate_rows_dropped": dropped, "unclear_files": unclear, "unknown": unknown}
