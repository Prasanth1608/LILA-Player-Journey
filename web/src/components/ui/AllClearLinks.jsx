// "All" / "Clear" links for any multi-select (days, layers, ticked matches).
// All on → only "Clear". Some on → both. None on → only "All".
export function AllClearLinks({ selected, total, onAll, onClear, allLabel = "All", what }) {
  return (
    <span className="link-group">
      {selected < total && (
        <button type="button" className="link-button" onClick={onAll} aria-label={`Select all ${what}`}>
          {allLabel}
        </button>
      )}
      {selected > 0 && (
        <button type="button" className="link-button" onClick={onClear} aria-label={`Clear ${what}`}>
          Clear
        </button>
      )}
    </span>
  );
}
