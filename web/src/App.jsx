import { useEffect, useMemo, useState } from "react";
import { useMatchIndex } from "./hooks/useMatchIndex.js";
import { useMatch } from "./hooks/useMatch.js";
import { filterMatches } from "./lib/filterMatches.js";
import { mapLabel, matchSummary } from "./lib/format.js";
import { DEFAULT_LAYERS } from "./config/layers.js";
import { FilterBar } from "./components/FilterBar.jsx";
import { MatchList } from "./components/MatchList.jsx";
import { LayerPanel } from "./components/LayerPanel.jsx";
import { MapCanvas } from "./components/MapCanvas.jsx";
import { EmptyState } from "./components/ui/EmptyState.jsx";

export default function App() {
  const { index, error } = useMatchIndex();

  if (error) {
    return (
      <Shell>
        <EmptyState title="Couldn't load the data">
          {error}. Run the pipeline (see README) so web/public/data exists, then reload.
        </EmptyState>
      </Shell>
    );
  }
  if (!index) {
    return (
      <Shell>
        <EmptyState title="Loading matches…" />
      </Shell>
    );
  }
  if (index.maps.length === 0) {
    return (
      <Shell>
        <EmptyState title="No maps in the data">
          The pipeline found no rows on a known map. Check its summary for warnings.
        </EmptyState>
      </Shell>
    );
  }
  return <Explorer index={index} />;
}

// The main tool, rendered once index.json has loaded.
function Explorer({ index }) {
  // ---- App state: one place for everything the filters control ----
  const [mapId, setMapId] = useState(index.maps[0].id);
  const [selectedDates, setSelectedDates] = useState(() => new Set(index.dates.map((d) => d.id)));
  const [sortBy, setSortBy] = useState("players");
  const [selectedId, setSelectedId] = useState(null);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);   // which map layers are switched on

  const { match, loading, error: matchError } = useMatch(selectedId);

  // ---- Derived data (recomputed only when its inputs change) ----
  const dateLabels = useMemo(
    () => Object.fromEntries(index.dates.map((d) => [d.id, d.label])),
    [index.dates]
  );
  const matches = useMemo(
    () => filterMatches(index.matches, { mapId, dates: selectedDates, sortBy }),
    [index.matches, mapId, selectedDates, sortBy]
  );
  const selected = matches.find((m) => m.id === selectedId) ?? null;

  // If the filters hide the selected match, clear the selection
  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selectedId, selected]);

  // ---- Filter actions ----
  const toggleDate = (id) =>
    setSelectedDates((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAllDates = () =>
    setSelectedDates((prev) =>
      prev.size === index.dates.length ? new Set() : new Set(index.dates.map((d) => d.id))
    );
  const toggleLayer = (id) =>
    setLayers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const mapImage = index.maps.find((m) => m.id === mapId)?.image;
  const status = matchError
    ? `Couldn't load this match: ${matchError}`
    : loading
      ? "Loading match…"
      : selected
        ? matchSummary(selected, dateLabels[selected.date])
        : "Select a match to see it on the map";

  return (
    <Shell>
      <div className="layout">
        <aside className="sidebar">
          <FilterBar
            maps={index.maps}
            dates={index.dates}
            mapId={mapId}
            selectedDates={selectedDates}
            onMapChange={setMapId}
            onToggleDate={toggleDate}
            onAllDates={toggleAllDates}
          />
          <MatchList
            matches={matches}
            dateLabels={dateLabels}
            selectedId={selectedId}
            onSelect={setSelectedId}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </aside>

        <main className="stage">
          <div className="stage-head">
            <h2>{mapLabel(mapId)}</h2>
            <span className="stage-meta" role="status">{status}</span>
          </div>
          <div className="stage-body">
            <MapCanvas
              imageSrc={mapImage}
              match={match}
              layers={layers}
              label={`${mapLabel(mapId)} minimap${selected ? `, ${matchSummary(selected, dateLabels[selected.date])}` : ""}`}
            />
            <LayerPanel match={match} enabled={layers} onToggle={toggleLayer} />
          </div>
        </main>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="app">
      <header className="topbar">
        <h1>LILA Player Journeys</h1>
        <span className="subtitle">Where players move, fight, loot and die</span>
      </header>
      {children}
    </div>
  );
}
