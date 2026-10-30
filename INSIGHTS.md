# LILA Player Journeys — Insights

This document outlines three gameplay and level-design insights to investigate using the telemetry visualisations.

> **Validation note:** These are hypotheses from the submission guide, not confirmed findings. Validate each one in the live tool using the real dataset. Record the observed values, keep only insights supported by the data, and remove or replace anything that is not confirmed.

## Insight A — Are matches mostly solo players against bots?

**What to investigate**

Check the match list and identify how many matches contain only one human player. Then, in Heatmaps, select all matches and compare player kills with kills on bots.

**How to check**

1. In the match list, inspect the human-player count for each match.
2. In Heatmaps, select all matches.
3. Compare `Kills · Players` with bot kills represented by `Deaths · Bots`.
4. Check whether player-versus-player kills are relatively uncommon.

**Evidence to record**

- Percentage of matches containing exactly one human player.
- Number of player kills attributed to bots, out of the total player kills.

Use the observed values to complete:

> **[X]% of matches have 1 human; [Y] of [Z] player kills were bots.**

**Potential design action**

If the data confirms that most encounters are against bots, bot placement and difficulty may shape the experience more than PvP balance. Review bot spawn locations and density.

**Metrics to investigate**

- Kills per match
- Time to first fight
- Deaths to bots

**Why level designers should care**

The placement of bots influences where fights happen and therefore helps determine the pacing of a match.

---

## Insight B — Where are the hotspots and dead zones?

**What to investigate**

Identify areas that receive frequent player visits and large areas that receive little or no traffic.

**How to check**

1. Open Heatmaps.
2. Select `Traffic` and `Both`.
3. Select all matches for each map.
4. Identify two or three prominent hotspots and name the locations using the sectors they fall within.
5. Identify large regions with little or no recorded traffic.

**Evidence to record**

For each map, record the number of different players who visited a notable hotspot and compare it with a low-traffic region.

Use the observed values to complete:

> **[Area] was visited by [N] different players; [region] by almost none ([n]).**

**Potential design action**

- Consider moving loot or objectives into underused areas, or reducing those areas.
- Consider adding cover or alternative routes around overcrowded areas.

**Metrics to investigate**

- Map coverage
- Traffic spread
- Loot pickups per area

**Why level designers should care**

Unused space may represent level-design effort that players rarely experience. Overcrowded areas can also make matches feel repetitive if players repeatedly follow the same routes.

**Traffic definition**

Traffic represents the number of different players who visited an area, not how long they stayed there. A player is counted once per cell per match.

---

## Insight C — Where do players loot, fight, and die?

**What to investigate**

Compare loot locations with player deaths and kills to understand the relationship between reward and risk. Determine whether valuable loot areas are also dangerous, or whether players can collect loot with little risk.

**How to check**

1. Open Heatmaps and use the same map and match selection for each comparison.
2. Compare `Loot · Players` with `Deaths · Players`.
3. Compare those locations with `Kills` to understand where combat occurs.
4. As an alternative, inspect storm deaths and determine whether they cluster in particular areas, such as the far edges of the map.

**Evidence to record**

Record loot pickups and deaths for notable areas, or record the total number and distribution of storm deaths.

Use the observed values to complete one of these:

> **[Area] has [N] loot pickups but only [n] deaths.**

or

> **Storm deaths: [N] total, mostly in [sector].**

**Potential design action**

- If an area has high loot and low risk, consider increasing the risk or reducing the reward.
- If storm deaths cluster near map edges, investigate whether players are being trapped by distance, extraction routes, or storm timing.

**Metrics to investigate**

- Deaths per loot pickup
- Storm deaths per match

**Why level designers should care**

The balance between risk and reward, along with fair storm pressure, influences how engaging and fair a match feels.

---

## Supporting example — 38-kill match

The submission guide highlights match `b3550292`, which has 38 kills, as a useful supporting example.

Replay this match to inspect where the kills happen and how quickly they occur. Use it as a concrete example alongside the broader heatmap findings; do not treat one match as proof of a map-wide pattern.

---

## Reporting checklist

Before presenting an insight as a finding:

- [ ] Validate it in the live tool using the real dataset.
- [ ] Record the actual counts, percentages, map, and relevant area or sector.
- [ ] State what caught your attention.
- [ ] Include the supporting statistic.
- [ ] Explain the possible design action and the metric it affects.
- [ ] Explain why the finding matters to a level designer.
- [ ] Remove or replace the insight if the data does not support it.
