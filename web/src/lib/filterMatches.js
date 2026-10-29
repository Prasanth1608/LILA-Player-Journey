// Which matches to show in the list, and in what order. Pure function, easy to test.

// Older data files have no `start`; fall back to 0 so sorting still works (by day order).
const startOf = (m) => m.start ?? 0;

// Sort options shown in the match list. `compare` orders two matches.
export const SORTS = {
  players: { label: "Most players", compare: (a, b) => b.humans + b.bots - (a.humans + a.bots) },
  newest: { label: "Newest first", compare: (a, b) => startOf(b) - startOf(a) },
  oldest: { label: "Oldest first", compare: (a, b) => startOf(a) - startOf(b) },
  kills: { label: "Most kills", compare: (a, b) => b.counts.kills - a.counts.kills },
  deaths: { label: "Most deaths", compare: (a, b) => b.counts.deaths - a.counts.deaths },
  loot: { label: "Most loot", compare: (a, b) => b.counts.loot - a.counts.loot },
  longest: { label: "Longest", compare: (a, b) => b.duration - a.duration },
};

// "B355-02 " → "b35502": search ignores case, dashes and spaces
const normalise = (s) => s.toLowerCase().replace(/[\s-]/g, "");

// Search matches from the START of the ID: "b" → IDs starting with b, "b3" narrows further.
// Map always applies. A search looks across ALL days (so a match ID from the notes
// is found even if its day is switched off); without a search, the day filter applies.
// Ties are broken by duration, so the order never jumps around between renders.
export function filterMatches(matches, { mapId, dates, sortBy, query = "" }) {
  const compare = SORTS[sortBy]?.compare ?? SORTS.players.compare;
  const q = normalise(query);
  return matches
    .filter((m) => m.map === mapId && (q ? normalise(m.id).startsWith(q) : dates.has(m.date)))
    .sort((a, b) => compare(a, b) || b.duration - a.duration);
}
