"""Run the whole pipeline: raw .nakama-0 files → JSON for the website.

Usage (from the repo root):
    python pipeline/preprocess.py --input ../player_data --output web/public/data

Works with any folder layout under --input: every .nakama-0 file is found,
whatever the day folders are called. Each step lives in its own file:
    load.py → clean.py → transform.py → export.py
"""

import argparse
from pathlib import Path

from clean import clean
from export import reset_output, write_json
from load import find_files, read_files
from transform import add_uv, build_heatmaps, build_index, build_matches, marker_events


# ---------------------------------------------------------------------------
# 1. run: every step, in order
# ---------------------------------------------------------------------------
def run(input_dir: Path, out_dir: Path) -> None:
    # Load: find every data file (duplicates skipped) and read them into one table
    files, skipped = find_files(input_dir)
    raw, failed = read_files(files)

    # Clean: decode, drop bug duplicates, tag bots, fix time
    df, report = clean(raw)

    # Transform: positions → minimap fractions, pick the rows drawn as markers
    df = add_uv(df)
    events = marker_events(df)

    # Export: empty the output folder, then write index, matches and heatmaps
    reset_output(out_dir)
    index = build_index(df, events)
    size = write_json(out_dir / "index.json", index)
    for mid, match in build_matches(df, events):
        size += write_json(out_dir / "matches" / f"{mid}.json", match)
    for map_id, heat in build_heatmaps(df, events):
        size += write_json(out_dir / "heatmaps" / f"{map_id}.json", heat)

    print_summary(files, skipped, failed, raw, df, report, index, out_dir, size)


# ---------------------------------------------------------------------------
# 2. print_summary: the quickest way to spot a problem with new data
# ---------------------------------------------------------------------------
def print_summary(files, skipped, failed, raw, df, report, index, out_dir, size) -> None:
    print(f"Files read: {len(files)} | failed: {len(failed)} | duplicate files skipped: {len(skipped)}")
    for name, err in failed[:5]:
        print(f"  ! failed {name}: {err}")

    print(f"Rows: {len(raw):,} raw -> {len(df):,} clean "
          f"({report['duplicate_rows_dropped']} duplicate rows dropped)")

    humans = df.loc[~df["is_bot"], "user_id"].nunique()
    bots = df.loc[df["is_bot"], "user_id"].nunique()
    print(f"Matches: {len(index['matches'])} | humans: {humans} | bots: {bots}")
    print("Matches per map:", df.groupby("map_id")["match_id"].nunique().to_dict())
    print("Dates:", [d["label"] + (" (partial)" if d["partial"] else "") for d in index["dates"]])

    # Warnings: only printed when something needs attention
    if report["unclear_files"]:
        print(f"  ! {report['unclear_files']} file(s) have both or neither Position/BotPosition "
              f"(treated as human; check them)")
    for kind, names in report["unknown"].items():
        if names:
            print(f"  ! unknown {kind} (not shown in the tool): {names}")

    print(f"Wrote {out_dir} ({size / 1e6:.1f} MB)")


# ---------------------------------------------------------------------------
# 3. Command line: read --input and --output, then run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert raw .nakama-0 files to web JSON.")
    parser.add_argument("--input", required=True, type=Path, help="folder containing the day folders")
    parser.add_argument("--output", required=True, type=Path, help="usually web/public/data")
    args = parser.parse_args()
    run(args.input, args.output)
