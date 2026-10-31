import { useEffect } from "react";
import { useMatches } from "../hooks/useMatches.js";
import { PLAYBACK } from "../theme/visual.js";
import { mapLabel, matchSummary, plural } from "../lib/format.js";
import { MapCanvas } from "./MapCanvas.jsx";
import { Timeline } from "./Timeline.jsx";
import { LayerPanel } from "./LayerPanel.jsx";
import { StageHead } from "./ui/StageHead.jsx";

// Replay renders one or more selected matches together. Settings (layers, trail,
// clock) live in App so they survive switching modes.
export function ReplayView({ mapId, mapImage, selected, matches: selectedMatches, dateLabels, layers,
                            onToggleLayer, onAllLayers, onClearLayers, trail, onTrailChange, clock }) {
  const matchIds = selectedMatches.map((match) => match.id);
  const { matches, loading, error } = useMatches(matchIds);
  const analysis = selectedMatches.length > 1;
  const duration = !analysis && matches.length ? Math.max(...matches.map((match) => match.duration ?? 0)) : 0;

  // Multi-match selection is static analysis, never full replay animation.
  useEffect(() => {
    if (analysis) {
      clock.pause();
      clock.load(0);
    } else {
      clock.load(duration);
    }
  }, [clock, duration, analysis, matchIds.join("\u0000")]);

  // The index entries (selectedMatches) contain summary counts such as humans
  // and bots. The downloaded match files contain only the detailed players/events.
  // Keep those two data shapes separate: use index metadata for the heading and
  // loaded match JSON for rendering, counts and playback.
  const summary = selectedMatches.length === 1
    ? matchSummary(selectedMatches[0], dateLabels[selectedMatches[0].date] ?? "")
    : selectedMatches.length > 1
      ? `${plural(selectedMatches.length, "match", "matches")} combined · ${plural(selectedMatches.reduce((n, m) => n + m.humans, 0), "human", "humans")} · ${plural(selectedMatches.reduce((n, m) => n + m.bots, 0), "bot path", "bot paths")}`
      : null;
  const status = error
    ? `Couldn't load selected matches: ${error}`
    : loading
      ? `Loading ${plural(matchIds.length, "match", "matches")}…`
      : summary ?? (selected ? "No matches selected — tick matches to replay" : "Select a match to replay it");

  return (
    <main className="stage">
      <StageHead title={mapLabel(mapId)} status={status} />
      <div className="stage-body">
        <div className="map-column">
          <MapCanvas
            imageSrc={mapImage}
            matches={matches}
            layers={layers}
            trailSeconds={trail === "recent" ? PLAYBACK.trailSeconds : null}
            clock={clock}
            analysis={analysis}
            label={`${mapLabel(mapId)} minimap${summary ? `, ${summary}` : ""}`}
          />
          {analysis ? (
            <div className="timeline analysis-timeline" aria-label="Multi-match analysis">
              <span className="analysis-mode-label">Multi-match analysis</span>
              <span>Static aggregated view · select one match for animated replay</span>
            </div>
          ) : (
            <Timeline clock={clock} matches={matches} layers={layers} trail={trail} onTrailChange={onTrailChange} />
          )}
        </div>
        <div className="side-panels">
          <LayerPanel matches={matches} enabled={layers} onToggle={onToggleLayer} onAll={onAllLayers} onClear={onClearLayers} />
        </div>
      </div>
    </main>
  );
}
