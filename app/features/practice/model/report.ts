// What a timed or Lab session's report says about the words: how many moved up and how many down. Pure.

/** The words whose confidence differs between two snapshots: how many moved at all, how many up, how many down. */
export function confMoved(before: Record<string, number>, after: Record<string, number>): { n: number; up: number; dn: number } {
  const moved = Object.keys({ ...before, ...after }).map((id) => (after[id] || 0) - (before[id] || 0)).filter((d) => d);
  const up = moved.filter((d) => d > 0).length;
  return { n: moved.length, up, dn: moved.length - up };
}
