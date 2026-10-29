import { EmptyState } from "./ui/EmptyState.jsx";
import { SORTS } from "../lib/filterMatches.js";
import { formatDuration, plural, shortId } from "../lib/format.js";

// The matches that pass the filters. Click one to select it.
// With `checked` (Heatmaps mode only), each row also gets a checkbox for comparing
// several matches; ticking never changes the clicked selection.
export function MatchList({ matches, dateLabels, selectedId, onSelect, sortBy, onSortChange,
                            checked = null, onToggleCheck, onCheckAll, onClearChecks }) {
  const checkable = checked !== null;
  const tickedCount = checkable ? matches.filter((m) => checked.has(m.id)).length : 0;

  return (
    <section className="match-list" aria-label="Matches">
      {checkable && (
        <div className="list-actions">
          <span className="label">{tickedCount === 0 ? "Tick to compare" : `${tickedCount} ticked`}</span>
          <span className="link-group">
            {tickedCount < matches.length && (
              <button type="button" className="link-button" onClick={onCheckAll}>Select all</button>
            )}
            {tickedCount > 0 && (
              <button type="button" className="link-button" onClick={onClearChecks}>Clear</button>
            )}
          </span>
        </div>
      )}
      <div className="list-head">
        <span className="label">{plural(matches.length, "match", "matches")}</span>
        <label className="sort">
          <span className="visually-hidden">Sort matches</span>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {matches.length === 0 ? (
        <EmptyState title="No matches">Pick at least one day, or try another map.</EmptyState>
      ) : (
        <ul className="rows">
          {matches.map((m) => (
            <li key={m.id} className="row-item">
              {checkable && (
                <input
                  type="checkbox"
                  className="row-check"
                  checked={checked.has(m.id)}
                  onChange={() => onToggleCheck(m.id)}
                  aria-label={`Compare match ${shortId(m.id)}`}
                />
              )}
              <button
                type="button"
                className="row"
                aria-pressed={m.id === selectedId}
                onClick={() => onSelect(m.id)}
              >
                <span className="row-top">
                  <span className="row-id">{shortId(m.id)}</span>
                  <span className="row-meta">{dateLabels[m.date]} · {formatDuration(m.duration)}</span>
                </span>
                <span className="row-stats">
                  <Stat value={m.humans} one="human" many="humans" />
                  {/* Bots whose own movement was recorded. Most matches have none,
                      even when the player killed bots (those come from the player's file). */}
                  <Stat value={m.bots} one="bot path" many="bot paths" />
                  <Stat value={m.counts.kills} one="kill" many="kills" />
                  <Stat value={m.counts.deaths} one="death" many="deaths" />
                  <Stat value={m.counts.loot} one="loot" many="loot" />
                  {m.counts.storm > 0 && <Stat value={m.counts.storm} one="storm death" many="storm deaths" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// "1 kill" / "3 kills"; zero values are dimmed so the eye lands on what happened.
function Stat({ value, one, many }) {
  const [count, ...words] = plural(value, one, many).split(" ");
  return (
    <span className={value === 0 ? "stat zero" : "stat"}>
      <b>{count}</b> {words.join(" ")}
    </span>
  );
}
