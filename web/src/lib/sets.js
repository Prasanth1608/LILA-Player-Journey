// Returns a NEW Set with `item` added or removed. Never changes `set` itself,
// so React sees a new value and re-renders.
export function toggleInSet(set, item) {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}
