"""Step 1 of the pipeline: find the raw .nakama-0 files and read them into one table."""

from pathlib import Path

import pandas as pd


# ---------------------------------------------------------------------------
# 1. find_files: make a list of every data file
# ---------------------------------------------------------------------------
def find_files(input_dir: Path) -> tuple[list[Path], list[Path]]:
    """Every .nakama-0 file under input_dir, at any depth and with any folder names.

    The same filename in two folders is the same player in the same match,
    exported twice (we found one in February_10 and February_11), so only the
    first copy is kept. Sorting makes "first" the earlier day folder, every run.

    Returns: (files to read, duplicate copies skipped)
    """
    keep, skipped = [], []
    seen = set()                                        # filenames already taken

    for f in sorted(input_dir.rglob("*.nakama-0")):     # rglob = search all subfolders
        if f.name in seen:
            skipped.append(f)                           # same file again → skip it
        else:
            seen.add(f.name)
            keep.append(f)

    return keep, skipped


# ---------------------------------------------------------------------------
# 2. read_files: read every file into one big table
# ---------------------------------------------------------------------------
def read_files(files: list[Path]) -> tuple[pd.DataFrame, list[tuple[str, str]]]:
    """Read every file and stack them into one table.

    - Adds a `date` column from the folder name (e.g. "February_10"),
      because the ts column's label can't be trusted for dates.
    - A file that can't be opened is listed as failed; the rest still load.

    Returns: (all rows, [(filename, error), ...])
    """
    frames, failed = [], []

    for f in files:
        try:
            df = pd.read_parquet(f)          # .nakama-0 files are normal Parquet files
            df["date"] = f.parent.name       # folder name, e.g. "February_10"
            frames.append(df)
        except Exception as e:               # broken file: note it and carry on
            failed.append((f.name, str(e)))

    if not frames:                           # nothing could be read: stop with a clear message
        raise SystemExit("No readable .nakama-0 files found.")

    return pd.concat(frames, ignore_index=True), failed   # stack all files into one table
