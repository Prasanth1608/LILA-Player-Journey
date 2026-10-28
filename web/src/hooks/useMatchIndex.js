import { useEffect, useState } from "react";
import { loadIndex } from "../data/api.js";

// Loads index.json once when the app starts.
// Returns { index, error }: index is null while loading.
export function useMatchIndex() {
  const [state, setState] = useState({ index: null, error: null });

  useEffect(() => {
    let active = true; // ignore the result if the component is gone
    loadIndex()
      .then((index) => active && setState({ index, error: null }))
      .catch((err) => active && setState({ index: null, error: err.message }));
    return () => {
      active = false;
    };
  }, []);

  return state;
}
