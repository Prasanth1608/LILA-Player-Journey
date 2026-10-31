# LILA Player Journeys --- Insights

This document separates quantified findings from further investigations.
The latter are not presented as confirmed results until validated in the
dashboard.

## Insight 1 --- Recorded player combat is overwhelmingly bot-focused

### Evidence

The dataset contains 796 matches.

  Match-level observation              Matches   Percentage
  ---------------------------------- --------- ------------
  Exactly 1 human participant file         794       99.75%
  2 human participant files                  2        0.25%
  No bot participant files                 744       93.47%
  Bot participant files present             52        6.53%

Recorded player kill events:

  Kill type                        Unique events   Percentage
  ------------------------------ --------------- ------------
  Player killed a bot                      2,204       99.86%
  Player killed another player                 3        0.14%
  **Total**                            **2,207**     **100%**

Match percentages use 796 matches; kill-event percentages use 2,207
unique recorded player kill events.

### Key finding

2,204 of 2,207 recorded player kill events were against bots. The
available kill telemetry therefore indicates that recorded player combat
is overwhelmingly bot-focused.

### Why a designer should care

If the intended experience is competitive PvP, this warrants
investigation. A high proportion of bot encounters may affect perceived
challenge, match variety, and player expectations. It may also be
intentional for the mode or dataset, so this is a signal to investigate
rather than proof that the balance is wrong.

### Potential design action

Review bot population and matchmaking composition against the intended
experience. Compare the pattern across modes, maps, and match phases
before changing bot density or matchmaking rules.

### Metrics affected

-   Player kills against bots
-   Player kills against other players
-   Bot presence by match
-   Human participant-file counts

### Data limitations

Participant files are only a partial sample of match participants. One
human participant file does not prove that a match contained only one
human player; absence of bot participant files does not prove that no
bots were present. Kill-event totals describe recorded events in the
available dataset, not necessarily every kill that occurred.

**Takeaway:** Recorded kill events are heavily bot-focused, but the
participant-file data is not sufficient to establish the full
human-versus-bot composition of every match.

------------------------------------------------------------------------

## Insight 2 --- AmbroseValley's centre is disproportionately associated with combat

### Evidence

Scope: all 566 available AmbroseValley matches, aggregated across the
included dates. The comparison uses the same central region for each
metric: a 20 × 20-cell area on the 64 × 64 heatmap grid (400 of 4,096
cells, or 9.77% of the map).

  Heatmap metric                        Total across map   Central region   Share in centre
  ----------------------------------- ------------------ ---------------- -----------------
  Combat (player kills + bot kills)                1,971            1,026         **52.0%**
  Loot                                             9,936            3,492         **35.1%**
  Player traffic                                  22,456            7,003         **31.2%**

The central region accounts for 52.0% of recorded combat despite
covering only 9.77% of the map. Its combat share is 16.9 percentage
points higher than its loot share and 20.8 points higher than its
traffic share.

### Key finding

Combat is more concentrated in AmbroseValley's central region than
either loot activity or player traffic. The centre appears to be a
significant engagement area beyond what general movement and loot
activity alone would suggest.

### Why a level designer should care

This identifies a repeat engagement hotspot worth inspecting. Layout,
sightlines, cover, choke points, rotation routes, and strategic position
may contribute to the concentration. Understanding the cause helps
determine whether the hotspot creates desirable encounters or an
unintended imbalance.

### Potential design action

Inspect the central region before making changes. Review sightlines,
cover, approach routes, and nearby loot distribution. Preserve the
hotspot if it supports intended gameplay; consider adjustments only if
it creates repetitive or unfair encounters.

### Metrics affected

-   Combat distribution (player kills + bot kills)
-   Player traffic distribution
-   Loot distribution

### Calculation notes and limitations

Combat counts player kills plus bot kills; deaths are not added,
avoiding double-counting the same engagements. Traffic represents
distinct players visiting each cell: a player is counted once per cell
per match. It does not measure time spent in an area. The figures
aggregate available matches and dates; the dataset's final day is marked
as partial.

**Takeaway:** A small central portion of AmbroseValley contains a
disproportionately large share of recorded combat. It is a strong
candidate for focused level-design review, not automatic redesign.

------------------------------------------------------------------------

## Insight 3 — Loot interactions frequently occur near combat locations

### Evidence

**Scope:** 566 available AmbroseValley matches.

- 9,936 recorded human Loot events were identified.
- 8,994 loot events occurred in matches containing at least one recorded player-caused kill.
- Each loot event was compared against the nearest player-caused kill event within the same match.
- The distance was calculated using the 64 × 64 heatmap grid.

| Distance from nearest kill | Loot events | Percentage |
|---|---:|---:|
| Same cell | 24 | 0.27% |
| Within 1 cell | 3,059 | 34.0% |
| Within 2 cells | 4,721 | 52.5% |
| Within 3 cells | 5,606 | 62.3% |
| Within 5 cells | 6,407 | 71.2% |
| Within 10 cells | 7,545 | 83.9% |

*Percentages are calculated using the 8,994 loot events from matches with recorded player-caused kills.*

### Key finding

Although loot interactions and kills rarely occur in the exact same grid cell, a substantial proportion of loot events occur within a short spatial distance of recorded combat locations. Approximately 52.5% of comparable loot events occurred within two grid cells of a player-caused kill.

This suggests that loot interactions frequently take place in areas surrounding recorded combat activity, rather than necessarily at the exact locations where kills occur.

### Why a level designer should care

This spatial relationship can help designers investigate how loot distribution and combat locations interact. Areas where loot activity occurs near combat hotspots may create opportunities for contested looting and potential risk-versus-reward situations.

### Potential design investigation

- Inspect loot hotspots surrounding combat-heavy areas.
- Review whether nearby loot locations provide sufficient cover and alternative approaches.
- Investigate whether loot placement encourages players to enter or remain near contested regions.
- Compare these patterns across individual matches and dates to determine whether they are persistent.

### Calculation notes and limitations

Each recorded human Loot event was compared with the nearest player-caused kill event (`Kill` or `BotKill`) from the same match. Distance was calculated using Euclidean distance between their positions on the 64 × 64 grid.

The analysis measures spatial proximity, not temporal proximity. It does not establish whether the loot interaction happened before or after the kill, whether the player collecting loot was involved in the combat, or whether the location was dangerous at the time.

Matches without recorded player-caused kills were excluded from the nearest-kill distance calculation.

**Takeaway:** Loot interactions frequently occur near recorded combat locations, providing designers with an opportunity to investigate the relationship between loot placement, combat hotspots, and potential risk-reward scenarios.
