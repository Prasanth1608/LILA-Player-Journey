"""Step 4 of the pipeline: write the JSON files the website reads."""

import json
import shutil
from pathlib import Path


# ---------------------------------------------------------------------------
# 1. reset_output: start from an empty output folder
# ---------------------------------------------------------------------------
def reset_output(out_dir: Path) -> None:
    """Delete the old output and recreate it empty, with matches/ and heatmaps/ inside.

    So files from an older dataset (e.g. February matches after switching to March)
    can never linger and show up on the website.
    """
    if out_dir.exists():
        shutil.rmtree(out_dir)                   # remove the folder and everything in it
    (out_dir / "matches").mkdir(parents=True)    # parents=True also creates out_dir itself
    (out_dir / "heatmaps").mkdir(parents=True)


# ---------------------------------------------------------------------------
# 2. write_json: save one file
# ---------------------------------------------------------------------------
def write_json(path: Path, data) -> int:
    """Save data as compact JSON (no spaces) to keep downloads small. Returns size in bytes."""
    text = json.dumps(data, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")
    return len(text)
