// Maps the site can show. Images are the web copies made by pipeline/minimaps.py.
// Later this list will come from data/index.json instead of being typed here.
export const MAPS = [
  { id: "AmbroseValley", label: "Ambrose Valley" },
  { id: "GrandRift", label: "Grand Rift" },
  { id: "Lockdown", label: "Lockdown" },
];

export const minimapUrl = (mapId) => `/minimaps/${mapId}.jpg`;
