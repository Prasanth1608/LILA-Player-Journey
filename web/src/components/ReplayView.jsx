import { useEffect } from "react";
import { useMatch } from "../hooks/useMatch.js";
import { PLAYBACK } from "../theme/visual.js";
import { mapLabel, matchSummary } from "../lib/format.js";
import { MapCanvas } from "./MapCanvas.jsx";
import { Timeline } from "./Timeline.jsx";
import { LayerPanel } from "./LayerPanel.jsx";
import { StageHead } from "./ui/StageHead.jsx";

// Replay mode: one match's paths, markers and playback. Loads only that match's file;
// never touches heatmap data. Settings (layers, trail, clock) live in App so they
// survive switching modes.
export function ReplayView({ mapId, mapImage, selected, dateLabel, layers, onToggleLayer, trail, onTrailChange, clock }) {
  const { match, loading, error } = useMatch(selected?.id ?? null);

  // A newly opened match starts paused on its end state (everything visible)
  useEffect(() => {
    clock.load(match?.duration ?? 0);
  }, [clock, match]);

  const summary = selected ? matchSummary(selected, dateLabel) : null;
  const status = error
    ? `Couldn't load this match: ${error}`
    : loading
      ? "Loading match…"
      : summary ?? "Select a match to replay it";

  return (
    <main className="stage">
      <StageHead title={mapLabel(mapId)} status={status} />
      <div className="stage-body">
        <div className="map-column">
          <MapCanvas
            imageSrc={mapImage}
            match={match}
            layers={layers}
            trailSeconds={trail === "recent" ? PLAYBACK.trailSeconds : null}
            clock={clock}
            label={`${mapLabel(mapId)} minimap${summary ? `, ${summary}` : ""}`}
          />
          <Timeline clock={clock} match={match} layers={layers} trail={trail} onTrailChange={onTrailChange} />
        </div>
        <div className="side-panels">
          <LayerPanel match={match} enabled={layers} onToggle={onToggleLayer} />
        </div>
      </div>
    </main>
  );
}
