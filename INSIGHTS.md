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

### Insight 3 --- Recorded loot events closely align with human player movement

### Evidence

### Scope: all 566 available AmbroseValley matches.
- 9,936 recorded Loot events were found across 539 matches.
- Every recorded Loot event was tagged bot: false and included a player ID, timestamp (t), and map position (u, v).
- Every event's player ID matched a player record with a timestamped movement path.
- For each loot event, the closest movement-path sample for that same player was identified:
  - 9,528 of 9,936 events (95.9%) had a path sample within 5 seconds of the event timestamp.
  - The median positional distance between the loot event and its nearest path sample was approximately 0.00108 normalized map units (about 0.07 cells on the 64 × 64 grid).

### Key finding
The recorded loot events are strongly associated with human players' movement in both time and location. This supports treating the Loot layer as a useful indicator of where players are interacting with loot, rather than interpreting it as bot activity or loot-spawn locations.

### Why a level designer should care
This helps distinguish places players merely pass through from places where recorded loot interactions occur. Comparing these events with traffic, combat, and deaths can help designers investigate whether loot locations sit along common routes, draw players into particular areas, or expose them to nearby danger.
Potential design action
Use the loot-event positions alongside player paths and nearby combat/death events to inspect specific locations. Look for loot interactions that occur along established routes versus locations that appear to pull players away from those routes. Review the local cover, approach options, and nearby threats before changing loot placement.

### Calculation notes and limitations
The comparison matched each Loot event to the movement path of the player ID recorded on that event, then found that player's nearest path sample by timestamp. Movement paths are sampled at intervals, so the nearest sample is not necessarily exactly at the event time. The 5-second result means a path sample exists within that time window; it does not prove the player crossed a location first and looted exactly one second later. The positional comparison is also not proof of item collection success unless the source's Loot event definition confirms that semantic. The data supports a close time-and-location association, not a causal claim that loot attracted the player.

**Takeaway:**: In AmbroseValley, recorded loot events are human-tagged and closely match the recorded movement of the same players. This gives designers a stronger basis for investigating loot interaction locations, while avoiding claims about exact pickup timing or why players chose those locations.
