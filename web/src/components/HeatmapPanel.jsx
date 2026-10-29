import { HEAT_GROUPS, HEAT_SIDES, sideAvailable } from "../config/heatmapMetrics.js";
import { rampCss } from "../renderer/colormaps.js";

// Pick ONE metric (row) for Players, Bots or Both (column). Works like radio buttons.
// totals: counts per pipeline metric across the shown matches (null before data loads).
export function HeatmapPanel({ selection, totals, onSelect }) {
  return (
    <section className="heatmap-panel" aria-label="Heatmap metric">
      <span className="label">Show</span>

      <table className="layers heat-grid">
        <thead>
          <tr>
            <th scope="col"><span className="visually-hidden">Metric</span></th>
            {HEAT_SIDES.map((s) => <th key={s.id} scope="col" className="label">{s.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {HEAT_GROUPS.map((group) => (
            <tr key={group.id}>
              <th scope="row" className="layer-group">{group.label}</th>
              {HEAT_SIDES.map((side) => {
                if (!sideAvailable(group, side.id)) {
                  return <td key={side.id}><span className="layer-none" title="Bots don't loot">—</span></td>;
                }
                const ids = side.id === "both" ? Object.values(group.metrics) : [group.metrics[side.id]];
                const total = ids.reduce((sum, id) => sum + (totals?.[id] ?? 0), 0);
                const on = selection.group === group.id && selection.side === side.id;
                return (
                  <td key={side.id}>
                    <button type="button" className="layer-toggle heat-choice" aria-pressed={on}
                            data-empty={totals && total === 0 ? true : undefined}
                            aria-label={`${group.label}, ${side.label}: ${total}`}
                            title={group.notes?.[side.id]}
                            onClick={() => onSelect({ group: group.id, side: side.id })}>
                      <span className="layer-count">{total.toLocaleString("en-US")}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="heat-legend">
        <div className="heat-bar" style={{ background: rampCss() }} aria-hidden="true" />
        <div className="heat-scale"><span>fewer</span><span>more</span></div>
        <p className="heat-note">Hover the map for exact counts.</p>
      </div>
    </section>
  );
}
