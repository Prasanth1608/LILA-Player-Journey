import { useEffect, useMemo, useState } from "react";
import { useMatchIndex } from "./hooks/useMatchIndex.js";
import { filterMatches } from "./lib/filterMatches.js";
import { plural, shortId } from "./lib/format.js";
import { toggleInSet } from "./lib/sets.js";
import { DEFAULT_LAYERS } from "./config/layers.js";
import { DEFAULT_HEAT_SELECTION } from "./config/heatmapMetrics.js";
import { PlaybackClock } from "./renderer/PlaybackClock.js";
import { FilterBar } from "./components/FilterBar.jsx";
import { MatchList } from "./components/MatchList.jsx";
import { ReplayView } from "./components/ReplayView.jsx";
import { HeatmapView } from "./components/HeatmapView.jsx";
import { SegmentedControl } from "./components/ui/SegmentedControl.jsx";
import { EmptyState } from "./components/ui/EmptyState.jsx";

const MODES = [
  { value: "replay", label: "Replay" },
  { value: "heatmaps", label: "Heatmaps" },
];

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
// State lives here so it survives switching modes; each mode's view is only
// mounted while active, so the other mode loads and animates nothing.
function Explorer({ index }) {
  // ---- Shared: filters and the clicked match ----
  const [mode, setMode] = useState("replay");
  const [mapId, setMapId] = useState(index.maps[0].id);
  const [selectedDates, setSelectedDates] = useState(() => new Set(index.dates.map((d) => d.id)));
  const [sortBy, setSortBy] = useState("players");
  const [selectedId, setSelectedId] = useState(null);

  // ---- Replay settings ----
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [trail, setTrail] = useState("full");              // "full" path so far, or "recent" only
  const [clock] = useState(() => new PlaybackClock());     // one clock for the whole session

  // ---- Heatmaps settings ----
  const [heatSelection, setHeatSelection] = useState(DEFAULT_HEAT_SELECTION); // one metric + side
  const [checked, setChecked] = useState(() => new Set()); // ticked matches (start empty)

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

  // Ticked matches still visible under the current filters (hidden ticks are ignored)
  const visibleChecked = useMemo(
    () => matches.filter((m) => checked.has(m.id)).map((m) => m.id),
    [matches, checked]
  );
  // Heatmap source: the ticked matches; if none ticked, the clicked match
  const heatIds = useMemo(
    () => (visibleChecked.length > 0 ? visibleChecked : selected ? [selected.id] : []),
    [visibleChecked, selected]
  );
  const heatSource = visibleChecked.length > 0
    ? `${plural(visibleChecked.length, "match", "matches")} combined`
    : selected ? `Match ${shortId(selected.id)}` : "";

  // If the filters hide the clicked match, clear it
  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selectedId, selected]);

  // ---- Actions ----
  const changeMode = (next) => {
    clock.pause(); // nothing keeps animating in the background
    setMode(next);
  };
  const changeMap = (id) => {
    setMapId(id);
    setChecked(new Set()); // ticks belong to one map's comparison
  };
  const toggleAllDates = () =>
    setSelectedDates((prev) =>
      prev.size === index.dates.length ? new Set() : new Set(index.dates.map((d) => d.id))
    );

  const mapImage = index.maps.find((m) => m.id === mapId)?.image;
  const inHeatmaps = mode === "heatmaps";

  return (
    <Shell actions={<SegmentedControl label="View" options={MODES} value={mode} onChange={changeMode} />}>
      <div className="layout">
        <aside className="sidebar">
          <FilterBar
            maps={index.maps}
            dates={index.dates}
            mapId={mapId}
            selectedDates={selectedDates}
            onMapChange={changeMap}
            onToggleDate={(id) => setSelectedDates((prev) => toggleInSet(prev, id))}
            onAllDates={toggleAllDates}
          />
          <MatchList
            matches={matches}
            dateLabels={dateLabels}
            selectedId={selectedId}
            onSelect={setSelectedId}
            sortBy={sortBy}
            onSortChange={setSortBy}
            checked={inHeatmaps ? checked : null}
            onToggleCheck={(id) => setChecked((prev) => toggleInSet(prev, id))}
            onCheckAll={() => setChecked(new Set(matches.map((m) => m.id)))}
            onClearChecks={() => setChecked(new Set())}
          />
        </aside>

        {inHeatmaps ? (
          <HeatmapView
            mapId={mapId}
            mapImage={mapImage}
            matchIds={heatIds}
            sourceLabel={heatSource}
            selection={heatSelection}
            onSelect={setHeatSelection}
          />
        ) : (
          <ReplayView
            mapId={mapId}
            mapImage={mapImage}
            selected={selected}
            dateLabel={selected ? dateLabels[selected.date] : ""}
            layers={layers}
            onToggleLayer={(id) => setLayers((prev) => toggleInSet(prev, id))}
            trail={trail}
            onTrailChange={setTrail}
            clock={clock}
          />
        )}
      </div>
    </Shell>
  );
}

function Shell({ children, actions = null }) {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>LILA Player Journeys</h1>
          <span className="subtitle">Where players move, fight, loot and die</span>
        </div>
        {actions && <div className="topbar-actions">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
