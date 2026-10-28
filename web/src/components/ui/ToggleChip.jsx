// An on/off pill (used for dates now, map layers later). Any number can be on at once.
export function ToggleChip({ on, onToggle, children, title }) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onToggle} title={title}>
      {children}
    </button>
  );
}
