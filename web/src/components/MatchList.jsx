import { EmptyState } from "./ui/EmptyState.jsx";
import { SORTS } from "../lib/filterMatches.js";
import { formatDuration, plural, shortId } from "../lib/format.js";

// The matches that pass the filters. Click one to select it.
export function MatchList({ matches, dateLabels, selectedId, onSelect, sortBy, onSortChange }) {
  return (
    <section className="match-list" aria-label="Matches">
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
            <li key={m.id}>
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
                  <Stat value={m.bots} one="bot" many="bots" />
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
