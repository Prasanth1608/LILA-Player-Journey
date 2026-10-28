// Loads the JSON written by pipeline/preprocess.py (shapes: pipeline/DATA_CONTRACT.md).
// Each file is downloaded once and kept in memory, so switching back to a
// match or map is instant.

const cache = new Map(); // path → Promise of parsed JSON

function getJson(path) {
  if (!cache.has(path)) {
    const request = fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Couldn't load ${path} (HTTP ${res.status})`);
      return res.json();
    });
    request.catch(() => cache.delete(path)); // a failed load can be retried later
    cache.set(path, request);
  }
  return cache.get(path);
}

export const loadIndex = () => getJson("/data/index.json");
export const loadMatch = (matchId) => getJson(`/data/matches/${matchId}.json`);
export const loadHeatmap = (mapId) => getJson(`/data/heatmaps/${mapId}.json`);
