import { SegmentedControl } from "./ui/SegmentedControl.jsx";
import { ToggleChip } from "./ui/ToggleChip.jsx";
import { AllClearLinks } from "./ui/AllClearLinks.jsx";
import { mapLabel } from "../lib/format.js";

// Map (pick one) and days (pick any). Everything comes from index.json,
// so new maps or days appear here without code changes.
export function FilterBar({ maps, dates, mapId, selectedDates, onMapChange, onToggleDate, onAllDates, onClearDates }) {
  return (
    <section className="filters" aria-label="Filters">
      <div className="field-group">
        <span className="label">Map</span>
        <SegmentedControl
          label="Map"
          options={maps.map((m) => ({ value: m.id, label: mapLabel(m.id) }))}
          value={mapId}
          onChange={onMapChange}
        />
      </div>

      <div className="field-group">
        <div className="label-row">
          <span className="label">Days</span>
          <AllClearLinks selected={selectedDates.size} total={dates.length} allLabel="All days" what="days"
                         onAll={onAllDates} onClear={onClearDates} />
        </div>
        <div className="chips">
          {dates.map((d) => (
            <ToggleChip
              key={d.id}
              on={selectedDates.has(d.id)}
              onToggle={() => onToggleDate(d.id)}
              title={d.partial ? "Data collection was still ongoing on this day" : undefined}
            >
              {d.label}
              {d.partial && <span className="chip-note"> (partial)</span>}
            </ToggleChip>
          ))}
        </div>
      </div>
    </section>
  );
}
