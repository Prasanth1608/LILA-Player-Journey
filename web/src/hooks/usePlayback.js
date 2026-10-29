import { useSyncExternalStore } from "react";

// Read one value from the playback clock and re-render when it changes.
// `select` must return a simple value (number, boolean): React compares it,
// so e.g. selecting whole seconds re-renders once a second, not 60 times.
export function useClockValue(clock, select) {
  return useSyncExternalStore(
    (onChange) => clock.subscribe(onChange),
    () => select(clock)
  );
}
