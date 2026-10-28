"""Shared settings for the data pipeline.

Everything map- or event-specific lives here, so new maps or event types
are one entry, not a code hunt.
"""

# World → minimap settings, from the dataset README.
# origin = world (x, z) at the minimap's bottom-left corner
# scale  = world units the minimap spans, edge to edge
# img    = original minimap filename in player_data/minimaps/
MAPS = {
    "AmbroseValley": {"scale": 900,  "ox": -370, "oz": -473, "img": "AmbroseValley_Minimap.png"},
    "GrandRift":     {"scale": 581,  "ox": -290, "oz": -290, "img": "GrandRift_Minimap.png"},
    "Lockdown":      {"scale": 1000, "ox": -500, "oz": -500, "img": "Lockdown_Minimap.jpg"},
}

# The 8 event types in the data, grouped by what the tool does with them.
MOVEMENT_EVENTS = {"Position", "BotPosition"}
KILL_EVENTS = {"Kill", "BotKill"}                         # file owner got a kill
DEATH_EVENTS = {"Killed", "BotKilled", "KilledByStorm"}   # file owner died
LOOT_EVENTS = {"Loot"}
KNOWN_EVENTS = MOVEMENT_EVENTS | KILL_EVENTS | DEATH_EVENTS | LOOT_EVENTS

# Web copies of the minimaps: longest side in pixels.
# Positions are stored as fractions (u, v), so any size works.
WEB_MINIMAP_SIZE = 2048
