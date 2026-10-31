import { HEAT_GROUPS, HEAT_SIDES, selectionKey, sideAvailable } from "../config/heatmapMetrics.js";
import { heatLevelsFor } from "../theme/visual.js";

export function HeatmapPanel({ selections, totals, onToggleSelection }) {
  const selectedKeys = new Set(selections.map(selectionKey));
  return (
    <section className="heatmap-panel" aria-label="Heatmap metrics">
      <span className="label">Show · select one or more metrics</span>
      <table className="layers heat-grid">
        <thead><tr><th scope="col"><span className="visually-hidden">Metric</span></th>
          {HEAT_SIDES.map((s) => <th key={s.id} scope="col" className="label">{s.label}</th>)}
        </tr></thead>
        <tbody>
          {HEAT_GROUPS.map((group) => (
            <tr key={group.id}>
              <th scope="row" className="layer-group">{group.label}</th>
              {HEAT_SIDES.map((side) => {
                if (!sideAvailable(group, side.id)) return <td key={side.id}><span className="layer-none" title="Not available">—</span></td>;
                const ids = side.id === "both" ? Object.values(group.metrics) : [group.metrics[side.id]];
                const total = ids.reduce((sum, id) => sum + (totals?.[id] ?? 0), 0);
                const key = selectionKey({ group: group.id, side: side.id });
                const on = selectedKeys.has(key);
                const levels = heatLevelsFor(group.id, side.id);
                const rgb = levels[1].rgb.join(",");
                return <td key={side.id}><button type="button" className="layer-toggle heat-choice" aria-pressed={on}
                  data-empty={totals && total === 0 ? true : undefined}
                  style={{ "--heat-rgb": rgb }}
                  aria-label={`${group.label}, ${side.label}: ${total}`} title={group.notes?.[side.id]}
                  onClick={() => onToggleSelection(key)}>
                  <span className="heat-choice-dot" aria-hidden="true" />
                  <span className="layer-count">{total.toLocaleString("en-US")}</span>
                </button></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="heat-legend" aria-label="Selected heatmap colour scales">
        {selections.length === 0 ? <p className="heat-note">Select a metric to display its heatmap.</p> : (
          <>
            {selections.map((selection) => {
              const group = HEAT_GROUPS.find((g) => g.id === selection.group);
              const side = HEAT_SIDES.find((s) => s.id === selection.side);
              const levels = heatLevelsFor(selection.group, selection.side);
              return <div className="heat-legend-row" key={selectionKey(selection)}>
                <span className="heat-legend-label">{group?.label} · {side?.label}</span>
                <span className="heat-gradient-wrap">
                  <span className="heat-gradient" aria-hidden="true" style={{
                    background: `linear-gradient(90deg, rgb(${levels[0].rgb}), rgb(${levels[1].rgb}), rgb(${levels[2].rgb}))`,
                  }} />
                  <span className="heat-gradient-labels"><span>Low</span><span>Medium</span><span>High</span></span>
                </span>
              </div>;
            })}
            <p className="heat-note">Each metric is scaled to its own busiest cell. Colours distinguish metrics; hover for exact counts.</p>
          </>
        )}
      </div>
    </section>
  );
}
