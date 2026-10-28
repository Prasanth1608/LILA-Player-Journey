import { LAYERS, LAYER_GROUPS, countLayer } from "../config/layers.js";
import { Swatch } from "./ui/Swatch.jsx";

const SIDES = [
  { id: "players", label: "Players" },
  { id: "bots", label: "Bots" },
];

// Players / Bots grid of on-off switches. Any combination can be on at once.
// Each switch shows its map symbol (doubles as the legend) and how many it would draw.
export function LayerPanel({ match, enabled, onToggle }) {
  return (
    <table className="layers" aria-label="Map layers">
      <thead>
        <tr>
          <th scope="col"><span className="visually-hidden">Layer</span></th>
          {SIDES.map((s) => <th key={s.id} scope="col" className="label">{s.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {LAYER_GROUPS.map((group) => (
          <tr key={group}>
            <th scope="row" className="layer-group">{group}</th>
            {SIDES.map((side) => {
              const layer = LAYERS.find((l) => l.group === group && l.side === side.id);
              return (
                <td key={side.id}>
                  {layer ? (
                    <LayerToggle layer={layer} count={countLayer(match, layer)} on={enabled.has(layer.id)}
                                 onToggle={() => onToggle(layer.id)} sideLabel={side.label} />
                  ) : (
                    <span className="layer-none" title="Bots don't loot">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LayerToggle({ layer, count, on, onToggle, sideLabel }) {
  const empty = count === 0;
  return (
    <button
      type="button"
      className="layer-toggle"
      aria-pressed={on}
      aria-label={`${sideLabel} ${layer.group.toLowerCase()}: ${count}`}
      title={layer.note}
      data-empty={empty || undefined}
      onClick={onToggle}
    >
      <Swatch kind={layer.kind} shape={layer.shape} color={layer.color} outlineColor={layer.outlineColor} />
      <span className="layer-count">{count}</span>
    </button>
  );
}
