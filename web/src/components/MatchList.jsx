import { EmptyState } from "./ui/EmptyState.jsx";
import { AllClearLinks } from "./ui/AllClearLinks.jsx";
import { SORTS } from "../lib/filterMatches.js";
import { formatLength, formatStartUtc, plural, shortId } from "../lib/format.js";

// The matches that pass the filters. Click one to select it.
// With `checked`, each row also gets a checkbox for selecting multiple matches;
// ticking never changes the clicked selection.
export function MatchList({ matches, dateLabels, selectedId, onSelect, sortBy, onSortChange, query, onQueryChange,
                            checked = null, onToggleCheck, onCheckAll, onClearChecks, checkLabel = "Compare",
                            allowCheckAll = true, maxChecked = null }) {
  const checkable = checked !== null;
  const tickedCount = checkable ? matches.filter((m) => checked.has(m.id)).length : 0;

  return (
    <section className="match-list" aria-label="Matches">
      {checkable && (
        <div className="list-actions">
          <span className="label">{tickedCount === 0 ? `Tick to ${checkLabel.toLowerCase()}` : `${tickedCount} selected`}</span>
          <span className="link-group">
            {allowCheckAll && (
              <AllClearLinks selected={tickedCount} total={matches.length} what="matches"
                             onAll={onCheckAll} onClear={onClearChecks} />
            )}
            {!allowCheckAll && tickedCount > 0 && (
              <button type="button" className="link-button" onClick={onClearChecks} aria-label="Clear selected matches">Clear</button>
            )}
          </span>
        </div>
      )}
      <div className="list-search">
        <label className="visually-hidden" htmlFor="match-search">Search by match ID</label>
        <input id="match-search" type="search" placeholder="Search match ID…" value={query}
               onChange={(e) => onQueryChange(e.target.value)} autoComplete="off" spellCheck="false" />
      </div>
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
        query ? (
          <EmptyState title="No match with that ID">Searched every day on this map. Check the map, or the ID.</EmptyState>
        ) : (
          <EmptyState title="No matches">Pick at least one day, or try another map.</EmptyState>
        )
      ) : (
        <ul className="rows">
          {matches.map((m) => (
            <li key={m.id} className="row-item">
              {checkable && (
                <input
                  type="checkbox"
                  className="row-check"
                  checked={checked.has(m.id)}
                  disabled={maxChecked !== null && !checked.has(m.id) && tickedCount >= maxChecked}
                  onChange={() => onToggleCheck(m.id)}
                  aria-label={`${checkLabel} match ${shortId(m.id)}`}
                  title={maxChecked !== null && !checked.has(m.id) && tickedCount >= maxChecked ? `Select up to ${maxChecked} matches` : undefined}
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
                  {/* Day · start time (UTC) · match length. Older data has no start time. */}
                  <span className="row-meta">
                    {dateLabels[m.date]}
                    {m.start != null && ` · ${formatStartUtc(m.start)}`}
                    {` · ${formatLength(m.duration)}`}
                  </span>
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
      {checkable && maxChecked !== null && (
        <div
          className={`selection-limit ${tickedCount >= maxChecked ? "selection-limit--reached" : "selection-limit--guidance"}`}
          role="status"
          aria-live="polite"
        >
          {tickedCount >= maxChecked
            ? `Maximum ${maxChecked} matches selected. Clear a selection to choose another.`
            : `Select up to ${maxChecked} matches for precise comparison.`}
        </div>
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
