// Which matches to show in the list, and in what order. Pure function, easy to test.

// Sort options shown in the match list. `compare` orders two matches.
export const SORTS = {
  players: { label: "Most players", compare: (a, b) => b.humans + b.bots - (a.humans + a.bots) },
  kills: { label: "Most kills", compare: (a, b) => b.counts.kills - a.counts.kills },
  deaths: { label: "Most deaths", compare: (a, b) => b.counts.deaths - a.counts.deaths },
  longest: { label: "Longest", compare: (a, b) => b.duration - a.duration },
};

// Ties are broken by duration, so the order never jumps around between renders.
export function filterMatches(matches, { mapId, dates, sortBy }) {
  const compare = SORTS[sortBy]?.compare ?? SORTS.players.compare;
  return matches
    .filter((m) => m.map === mapId && dates.has(m.date))
    .sort((a, b) => compare(a, b) || b.duration - a.duration);
}
