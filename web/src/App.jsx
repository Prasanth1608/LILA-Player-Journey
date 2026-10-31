import { useEffect, useMemo, useState } from "react";
import { useMatchIndex } from "./hooks/useMatchIndex.js";
import { filterMatches } from "./lib/filterMatches.js";
import { plural, shortId } from "./lib/format.js";
import { toggleInSet } from "./lib/sets.js";
import { DEFAULT_LAYERS, LAYERS } from "./config/layers.js";
import { DEFAULT_HEAT_SELECTION } from "./config/heatmapMetrics.js";
import { PlaybackClock } from "./renderer/PlaybackClock.js";
import { FilterBar } from "./components/FilterBar.jsx";
import { MatchList } from "./components/MatchList.jsx";
import { ReplayView } from "./components/ReplayView.jsx";
import { HeatmapView } from "./components/HeatmapView.jsx";
import { SegmentedControl } from "./components/ui/SegmentedControl.jsx";
import { EmptyState } from "./components/ui/EmptyState.jsx";
import { ThemeToggle } from "./components/ui/ThemeToggle.jsx";

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
  const [query, setQuery] = useState("");                  // match ID search
  const [selectedId, setSelectedId] = useState(null);

  // ---- Replay settings ----
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [trail, setTrail] = useState("full");              // "full" path so far, or "recent" only
  const [clock] = useState(() => new PlaybackClock());     // one clock for the whole session

  // ---- Heatmaps settings ----
  const [heatSelection, setHeatSelection] = useState(DEFAULT_HEAT_SELECTION); // one metric + side
  const [checked, setChecked] = useState(() => new Set()); // Heatmap comparison selection
  const [replayChecked, setReplayChecked] = useState(() => new Set()); // Replay comparison, capped at three
  const [replayChecksCleared, setReplayChecksCleared] = useState(false);

  // ---- Derived data (recomputed only when its inputs change) ----
  const dateLabels = useMemo(
    () => Object.fromEntries(index.dates.map((d) => [d.id, d.label])),
    [index.dates]
  );
  const matches = useMemo(
    () => filterMatches(index.matches, { mapId, dates: selectedDates, sortBy, query }),
    [index.matches, mapId, selectedDates, sortBy, query]
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
  const visibleReplayChecked = useMemo(
    () => matches.filter((m) => replayChecked.has(m.id)).map((m) => m.id),
    [matches, replayChecked]
  );
  const replayIds = useMemo(
    () => visibleReplayChecked.length > 0 ? visibleReplayChecked : replayChecksCleared ? [] : selected ? [selected.id] : [],
    [visibleReplayChecked, replayChecksCleared, selected]
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
  // Match checkbox selections belong to the current filtered match list.
  // Reset them whenever the list's map/date/sort/search criteria changes.
  const resetMatchSelections = () => {
    setChecked(new Set());
    setReplayChecked(new Set());
    setReplayChecksCleared(false);
  };
  const changeMap = (id) => {
    setMapId(id);
    resetMatchSelections(); // ticks belong to one map's comparison
  };
  const changeSort = (value) => {
    setSortBy(value);
    resetMatchSelections();
  };
  const changeQuery = (value) => {
    setQuery(value);
    resetMatchSelections();
  };
  const toggleDate = (id) => {
    setSelectedDates((prev) => toggleInSet(prev, id));
    resetMatchSelections();
  };
  const selectAllDates = () => {
    setSelectedDates(new Set(index.dates.map((d) => d.id)));
    resetMatchSelections();
  };
  const clearDates = () => {
    setSelectedDates(new Set());
    resetMatchSelections();
  };

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
            onToggleDate={toggleDate}
            onAllDates={selectAllDates}
            onClearDates={clearDates}
          />
          <MatchList
            matches={matches}
            dateLabels={dateLabels}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setReplayChecksCleared(false); }}
            sortBy={sortBy}
            onSortChange={changeSort}
            query={query}
            onQueryChange={changeQuery}
            checked={inHeatmaps ? checked : replayChecked}
            onToggleCheck={(id) => {
              if (inHeatmaps) {
                setChecked((prev) => toggleInSet(prev, id));
              } else {
                setReplayChecked((prev) => {
                  if (!prev.has(id) && prev.size >= 3) return prev;
                  return toggleInSet(prev, id);
                });
                setReplayChecksCleared(false);
              }
            }}
            onCheckAll={() => { setChecked(new Set(matches.map((m) => m.id))); }}
            onClearChecks={() => {
              if (inHeatmaps) setChecked(new Set());
              else { setReplayChecked(new Set()); setReplayChecksCleared(true); }
            }}
            checkLabel={inHeatmaps ? "Compare" : "Replay"}
            allowCheckAll={inHeatmaps}
            maxChecked={inHeatmaps ? null : 3}
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
            matches={matches.filter((m) => replayIds.includes(m.id))}
            dateLabels={dateLabels}
            layers={layers}
            onToggleLayer={(id) => setLayers((prev) => toggleInSet(prev, id))}
            onAllLayers={() => setLayers(new Set(LAYERS.map((l) => l.id)))}
            onClearLayers={() => setLayers(new Set())}
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
        <div className="topbar-actions">
          {actions}
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
