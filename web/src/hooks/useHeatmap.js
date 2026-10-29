import { useEffect, useState } from "react";
import { loadHeatmap } from "../data/api.js";

// Loads a map's heatmap file (cached after the first time).
// Only used inside Heatmaps mode, so Replay never requests it.
// Returns { heatmap, error }; heatmap is null while loading.
export function useHeatmap(mapId) {
  const [state, setState] = useState({ mapId: null, heatmap: null, error: null });

  useEffect(() => {
    let active = true; // ignore a slow response if the map changed meanwhile
    loadHeatmap(mapId)
      .then((heatmap) => active && setState({ mapId, heatmap, error: null }))
      .catch((err) => active && setState({ mapId, heatmap: null, error: err.message }));
    return () => {
      active = false;
    };
  }, [mapId]);

  const current = state.mapId === mapId;
  return { heatmap: current ? state.heatmap : null, error: current ? state.error : null };
}
