import { useMemo } from "react";
import { useHeatmap } from "../hooks/useHeatmap.js";
import { metricArrays, sumMetrics } from "../lib/heatmap.js";
import { mapLabel } from "../lib/format.js";
import { HEAT_GROUPS, HEAT_SIDES, metricIdsFor, selectionKey } from "../config/heatmapMetrics.js";
import { HeatmapCanvas } from "./HeatmapCanvas.jsx";
import { HeatmapPanel } from "./HeatmapPanel.jsx";
import { StageHead } from "./ui/StageHead.jsx";
import { heatLevelsFor } from "../theme/visual.js";

export function HeatmapView({ mapId, mapImage, matchIds, sourceLabel, selections, onToggleSelection }) {
  const { heatmap, error } = useHeatmap(mapId);
  const summed = useMemo(() => (heatmap ? metricArrays(heatmap, matchIds) : null), [heatmap, matchIds]);

  const layers = useMemo(() => {
    if (!summed) return [];
    return selections.map((selection) => {
      const group = HEAT_GROUPS.find((g) => g.id === selection.group);
      const side = HEAT_SIDES.find((s) => s.id === selection.side);
      const metricIds = metricIdsFor(selection);
      const heat = sumMetrics(summed.arrays, metricIds);
      return {
        key: selectionKey(selection),
        selection,
        heat,
        levels: heatLevelsFor(selection.group, selection.side),
        readout: heat ? {
          side: `${group?.label ?? selection.group} · ${side?.label ?? selection.side}`,
          one: group?.one ?? "event",
          many: group?.many ?? "events",
          array: heat.counts,
        } : null,
      };
    }).filter((layer) => layer.heat);
  }, [summed, selections]);

  const readout = useMemo(() => layers.map((layer) => layer.readout), [layers]);
  const status = error ? error : !heatmap ? "Loading heatmap…" : matchIds.length === 0
    ? "Tick matches to compare, or click one to see its heatmap"
    : selections.length === 0 ? `${sourceLabel} · select one or more metrics`
      : layers.length === 0 ? `${sourceLabel} · nothing recorded for the selected metrics` : sourceLabel;

  return (
    <main className="stage">
      <StageHead title={`${mapLabel(mapId)} · Heatmap`} status={status} />
      <div className="stage-body">
        <div className="map-column">
          <HeatmapCanvas imageSrc={mapImage} heats={layers} grid={heatmap?.grid ?? 64} readout={readout}
            label={`${mapLabel(mapId)} heatmap, ${sourceLabel || "no matches selected"}`} />
        </div>
        <div className="side-panels">
          <HeatmapPanel selections={selections} totals={summed?.totals ?? null} onToggleSelection={onToggleSelection} />
        </div>
      </div>
    </main>
  );
}
