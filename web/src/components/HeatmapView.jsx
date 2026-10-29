import { useMemo } from "react";
import { useHeatmap } from "../hooks/useHeatmap.js";
import { metricArrays, sumMetrics } from "../lib/heatmap.js";
import { mapLabel } from "../lib/format.js";
import { groupById, metricIdsFor } from "../config/heatmapMetrics.js";
import { HeatmapCanvas } from "./HeatmapCanvas.jsx";
import { HeatmapPanel } from "./HeatmapPanel.jsx";
import { StageHead } from "./ui/StageHead.jsx";

// Heatmaps mode: colours only, for the ticked matches (or the clicked one).
// Loads only the map's heatmap file; no match files, no playback, no animation.
export function HeatmapView({ mapId, mapImage, matchIds, sourceLabel, selection, onSelect }) {
  const { heatmap, error } = useHeatmap(mapId);

  // Add up the matches (only when the matches change)…
  const summed = useMemo(() => (heatmap ? metricArrays(heatmap, matchIds) : null), [heatmap, matchIds]);

  // …then pick the selected metric (players, bots, or both added together)
  const metricIds = useMemo(() => metricIdsFor(selection), [selection]);
  const heat = useMemo(() => (summed ? sumMetrics(summed.arrays, metricIds) : null), [summed, metricIds]);

  // Hover readout: one line per side shown (two lines for "Both")
  const readout = useMemo(() => {
    const group = groupById[selection.group];
    if (!summed || !group) return [];
    return Object.entries(group.metrics)
      .filter(([, id]) => metricIds.includes(id))
      .map(([side, id]) => ({ side, one: group.one, many: group.many, array: summed.arrays[id] }));
  }, [summed, selection, metricIds]);

  const status = error
    ? error
    : !heatmap
      ? "Loading heatmap…"
      : matchIds.length === 0
        ? "Tick matches to compare, or click one to see its heatmap"
        : !heat
          ? `${sourceLabel} · nothing recorded for this metric`
          : sourceLabel;

  return (
    <main className="stage">
      <StageHead title={`${mapLabel(mapId)} · Heatmap`} status={status} />
      <div className="stage-body">
        <div className="map-column">
          <HeatmapCanvas
            imageSrc={mapImage}
            heat={heat}
            grid={heatmap?.grid ?? 64}
            readout={readout}
            label={`${mapLabel(mapId)} heatmap, ${sourceLabel || "no matches selected"}`}
          />
        </div>
        <div className="side-panels">
          <HeatmapPanel selection={selection} totals={summed?.totals ?? null} onSelect={onSelect} />
        </div>
      </div>
    </main>
  );
}
