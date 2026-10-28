import { useEffect, useState } from "react";
import { loadMatch } from "../data/api.js";

// Loads one match file when a match is selected.
// Returns { match, loading, error }. With no selection, everything is empty.
export function useMatch(matchId) {
  const [state, setState] = useState({ id: null, match: null, error: null });

  useEffect(() => {
    if (!matchId) return;
    let active = true; // ignore a slow response if another match was picked meanwhile
    loadMatch(matchId)
      .then((match) => active && setState({ id: matchId, match, error: null }))
      .catch((err) => active && setState({ id: matchId, match: null, error: err.message }));
    return () => {
      active = false;
    };
  }, [matchId]);

  // Only report data that belongs to the match currently selected
  const current = matchId && state.id === matchId;
  return {
    match: current ? state.match : null,
    error: current ? state.error : null,
    loading: Boolean(matchId) && !current,
  };
}
