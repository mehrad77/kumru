// Small random helpers. `rng` is Math.random unless a test gives its own.

/** A shuffled copy. */
export function shuffle<T>(a: readonly T[], rng: () => number = Math.random): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** One element, chosen at random. */
export const pick = <T>(a: readonly T[], rng: () => number = Math.random): T => a[Math.floor(rng() * a.length)];
