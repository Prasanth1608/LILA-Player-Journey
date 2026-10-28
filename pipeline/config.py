"""Shared settings for the data pipeline.

No logic here, only values the other files use. Anything that might change
(a new map, a new event type, output sizes) lives in this one file.
"""

# ---------------------------------------------------------------------------
# 1. Data version
# ---------------------------------------------------------------------------
# Written into every JSON file. Bump it when the shape of the JSON changes
# (see DATA_CONTRACT.md), so the website knows which format it is reading.
DATA_VERSION = 1


# ---------------------------------------------------------------------------
# 2. Maps: world → minimap settings (from the dataset README)
# ---------------------------------------------------------------------------
#   scale  = world units the minimap covers, edge to edge
#   ox, oz = origin: the world (x, z) at the minimap's bottom-left corner
#   img    = original minimap filename in player_data/minimaps/
# A new map = one new line here.
MAPS = {
    "AmbroseValley": {"scale": 900,  "ox": -370, "oz": -473, "img": "AmbroseValley_Minimap.png"},
    "GrandRift":     {"scale": 581,  "ox": -290, "oz": -290, "img": "GrandRift_Minimap.png"},
    "Lockdown":      {"scale": 1000, "ox": -500, "oz": -500, "img": "Lockdown_Minimap.jpg"},
}


# ---------------------------------------------------------------------------
# 3. Event groups: the 8 event types, sorted by what the tool does with them
# ---------------------------------------------------------------------------
MOVEMENT_EVENTS = {"Position", "BotPosition"}             # paths + traffic heatmap
KILL_EVENTS = {"Kill", "BotKill"}                         # file owner got a kill → kill heatmap
DEATH_EVENTS = {"Killed", "BotKilled", "KilledByStorm"}   # file owner died → death heatmap
LOOT_EVENTS = {"Loot"}                                    # loot markers

# All 8 together ("|" combines sets). Anything outside this set triggers a warning.
KNOWN_EVENTS = MOVEMENT_EVENTS | KILL_EVENTS | DEATH_EVENTS | LOOT_EVENTS


# ---------------------------------------------------------------------------
# 4. Duplicate rows that can only be a logging bug
# ---------------------------------------------------------------------------
# A 5-second snapshot can't fire twice in the same second, and a player can't
# die twice, so identical repeats of these are dropped.
# Repeated Loot/BotKill rows are kept: multi-pickups and multi-kills are real.
DEDUPE_EVENTS = MOVEMENT_EVENTS | DEATH_EVENTS


# ---------------------------------------------------------------------------
# 5. Partial days
# ---------------------------------------------------------------------------
# Day folders the README marks as incomplete; shown as "(partial)" on the site.
PARTIAL_DATES = {"February_14"}


# ---------------------------------------------------------------------------
# 6. Output tuning
# ---------------------------------------------------------------------------
UV_DECIMALS = 4          # u, v rounded to 4 decimals: 0.0001 of the map ≈ 0.2 px on a 2048 px minimap
HEATMAP_GRID = 64        # each map split into 64 × 64 cells for heatmaps (higher = finer, bigger files)
WEB_MINIMAP_SIZE = 2048  # longest side of the web minimap copies, in px (used by minimaps.py)
