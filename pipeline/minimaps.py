"""Make small web copies of the minimaps for the site.

The originals are large (up to 9000 x 9000 px), which loads slowly in a
browser. Positions are stored as fractions (u, v), so resizing is safe.

Usage (from the repo root):
    python pipeline/minimaps.py --input ../player_data/minimaps --output web/public/minimaps
"""

import argparse
from pathlib import Path

from PIL import Image

from config import MAPS, WEB_MINIMAP_SIZE


def make_web_minimaps(src_dir: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, cfg in MAPS.items():
        src = src_dir / cfg["img"]
        if not src.exists():
            print(f"  ! missing {src.name}, skipped")
            continue
        img = Image.open(src).convert("RGB")
        original = img.size
        img.thumbnail((WEB_MINIMAP_SIZE, WEB_MINIMAP_SIZE))   # keeps aspect ratio
        img.save(out_dir / f"{name}.jpg", quality=85, optimize=True)
        print(f"  {name}: {original[0]}x{original[1]} -> {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Make web-sized minimap copies.")
    parser.add_argument("--input", required=True, type=Path, help="folder with the original minimaps")
    parser.add_argument("--output", required=True, type=Path, help="web/public/minimaps")
    args = parser.parse_args()
    make_web_minimaps(args.input, args.output)
