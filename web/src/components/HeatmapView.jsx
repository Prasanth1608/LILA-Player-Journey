import { useMemo } from "react";
import { useHeatmap } from "../hooks/useHeatmap.js";
import { metricArrays, sumMetrics } from "../lib/heatmap.js";
import { mapLabel } from "../lib/format.js";
import { groupById, metricIdsFor } from "../config/heatmapMetrics.js";
import { HeatmapCanvas } from "./HeatmapCanvas.jsx";
import { HeatmapPanel } from "./HeatmapPanel.jsx";
import { StageHead } from "./ui/StageHead.jsx";
import { HEATMAP } from "../theme/visual.js";

export function HeatmapView({ mapId, mapImage, matchIds, sourceLabel, selection, onSelect }) {
  const { heatmap, error } = useHeatmap(mapId);
  const summed = useMemo(() => (heatmap ? metricArrays(heatmap, matchIds) : null), [heatmap, matchIds]);
  const metricIds = useMemo(() => metricIdsFor(selection), [selection]);
  const group = groupById[selection.group];

  const heat = useMemo(() => {
    if (!summed) return null;
    return sumMetrics(summed.arrays, metricIds);
  }, [summed, metricIds]);

  const readout = useMemo(() => {
    if (!summed || !group || !heat) return [];
    return [{
      side: `Total ${group.label.toLowerCase()}`,
      one: group.one,
      many: group.many,
      array: heat.counts,
    }];
  }, [summed, group, heat]);

  const status = error ? error : !heatmap ? "Loading heatmap…" : matchIds.length === 0
    ? "Tick matches to compare, or click one to see its heatmap"
    : !heat ? `${sourceLabel} · nothing recorded for this metric` : sourceLabel;

  return (
    <main className="stage">
      <StageHead title={`${mapLabel(mapId)} · Heatmap`} status={status} />
      <div className="stage-body">
        <div className="map-column">
          <HeatmapCanvas imageSrc={mapImage} heat={heat} grid={heatmap?.grid ?? 64} readout={readout} heatLevels={HEATMAP.levels}
            label={`${mapLabel(mapId)} heatmap, ${sourceLabel || "no matches selected"}`} />
        </div>
        <div className="side-panels">
          <HeatmapPanel selection={selection} totals={summed?.totals ?? null} onSelect={onSelect} />
        </div>
      </div>
    </main>
  );
}
