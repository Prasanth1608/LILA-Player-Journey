import { useEffect, useState } from "react";
import { loadMatch } from "../data/api.js";

// Loads the selected match files together. loadMatch keeps its existing cache,
// and the active flag prevents an older selection from replacing newer data.
export function useMatches(matchIds) {
  const [state, setState] = useState({ ids: [], matches: [], error: null });
  const key = matchIds.join("\u0000");

  useEffect(() => {
    if (matchIds.length === 0) {
      setState({ ids: [], matches: [], error: null });
      return undefined;
    }

    let active = true;
    const ids = [...matchIds];
    // Avoid firing hundreds of requests at once when All is selected. A small
    // batch keeps network/decode pressure bounded while preserving the existing cache.
    const loadInBatches = async () => {
      const loaded = [];
      for (let i = 0; i < ids.length; i += 8) {
        const batch = await Promise.all(ids.slice(i, i + 8).map((id) => loadMatch(id)));
        if (!active) return;
        loaded.push(...batch);
      }
      if (active) setState({ ids, matches: loaded, error: null });
    };
    loadInBatches().catch((err) => active && setState({ ids, matches: [], error: err.message }));

    return () => {
      active = false;
    };
  // key represents the ordered selection; the array itself may be recreated by the parent.
  }, [key]);

  const current = state.ids.length === matchIds.length && state.ids.every((id, i) => id === matchIds[i]);
  return {
    matches: current ? state.matches : [],
    error: current ? state.error : null,
    loading: matchIds.length > 0 && !current,
  };
}
