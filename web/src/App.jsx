import { useState } from "react";
import { MAPS, minimapUrl } from "./config/maps.js";

// Stage 1: map selector + minimap. Paths, events, playback and heatmaps
// are added on top of this in later stages (see ARCHITECTURE.md).
export default function App() {
  const [mapId, setMapId] = useState(MAPS[0].id);

  return (
    <div className="app">
      <header className="toolbar">
        <h1>LILA Player Journeys</h1>
        <label className="field">
          <span>Map</span>
          <select value={mapId} onChange={(e) => setMapId(e.target.value)}>
            {MAPS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
      </header>

      <main className="stage">
        <img className="minimap" src={minimapUrl(mapId)} alt={`${mapId} minimap`} />
      </main>
    </div>
  );
}
