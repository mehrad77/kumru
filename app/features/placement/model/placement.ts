// Placement: an adaptive check of words and suffixes, unit by unit. The climb is a binary search; the probes and the screen are
// in ../items.ts and ../Climb.tsx. Pure.
import { unitIdx } from "../../../lib/units.ts";

/** What a learner says about themselves: [key, label, the unit index they start from]. */
export const PL_SELF: [string, string, number][] = [["new", "Brand new", 0], ["basics", "Some basics", 1], ["a1", "Finished A1", 6], ["a2", "Finished A2", 12], ["b1", "B1 or above", 15]];

/** A probe's result: words [right, asked] and suffix items [right, asked]. */
export interface ProbeResult { w: [number, number]; g: [number, number] }

/** A probe passes with 5/6 of its words and 3/4 of its suffix items (nothing asked counts as passed). */
export const plPass = (r: ProbeResult): boolean => (!r.w[1] || r.w[0] >= Math.ceil(r.w[1] * 5 / 6)) && (!r.g[1] || r.g[0] >= r.g[1] * 0.75);

export interface Climb { lo: number; hi: number; p: number; n?: number }

/**
 * Binary-search style climb: lo = highest unit passed, hi = lowest failed. With a pass we start at lo+1 (never higher);
 * with only fails, one below the lowest fail. `done` when the next probe is not needed (a bound reached, five probes, or
 * past either end up to `max`); `idx` is then the unit index to place the learner at.
 */
export function plNext(st: Climb, pass: boolean, max = 17): { lo: number; hi: number; p: number; n: number; done: boolean; idx: number | null } {
  const n = (st.n || 0) + 1;
  let lo = st.lo, hi = st.hi;
  if (pass) lo = Math.max(lo, st.p);
  else hi = Math.min(hi, st.p);
  const nx = pass ? st.p + 1 : st.p - 1, done = nx <= lo || nx >= hi || n >= 5 || nx < 0 || nx > max;
  return { lo, hi, p: done ? st.p : nx, n, done, idx: done ? Math.max(0, Math.min(max, lo >= 0 ? lo + 1 : hi - 1)) : null };
}

/** The writing sample's level (`ai`: language, level, unit) may lower the placement by up to three units, never raise it. */
export const plNudge = (idx: number, ai: { language?: string; level?: string; unit?: number } | null | undefined): number =>
  ai && ai.language === "tr" && ai.level ? Math.max(idx - 3, Math.min(idx, unitIdx(ai.level, ai.unit as number))) : idx;

/** Up to four answer options for `c`: itself first, then the first of `pool` whose `label` differs from those already taken. */
export function pickOptions<T>(c: T, pool: readonly T[], label: (x: T) => string): T[] {
  const opts = [c], seen = new Set([label(c)]);
  for (const x of pool) {
    const v = label(x);
    if (!seen.has(v)) { seen.add(v); opts.push(x); }
    if (opts.length >= 4) break;
  }
  return opts;
}
