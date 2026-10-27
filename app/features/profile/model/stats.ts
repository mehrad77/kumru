// The Profile's numbers, from the progress document: the streak, the answer totals and a drill's bar colour. Pure: the state is
// passed in.
import { dayKey } from "../../../lib/progress.ts";

/** Consecutive days with an answer, ending today (or yesterday while today has none yet). */
export function streakDays(days: Record<string, number>, now: Date = new Date()): number {
  let n = 0;
  const d = new Date(now);
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

interface Counts { a?: number; g?: number; e?: number; r?: number; w?: number }
export interface Totals { a: number; g: number; e: number; r: number; w: number; dr: number; dw: number }

/** Answers by kind over all cards (`a` asked, `g` good, `e` easy, `r` right, `w` wrong) and the drills' right and wrong. */
export function totals(stats: Record<string, Counts>, drill: Record<string, { r: number; w: number }>, drillKeys: string[]): Totals {
  let a = 0, g = 0, e = 0, r = 0, w = 0, dr = 0, dw = 0;
  for (const id in stats) { const s = stats[id]; a += s.a || 0; g += s.g || 0; e += s.e || 0; r += s.r || 0; w += s.w || 0; }
  for (const k of drillKeys) { const s = drill[k]; if (s) { dr += s.r; dw += s.w; } }
  return { a, g, e, r, w, dr, dw };
}

/** The colour of a drill's accuracy bar. */
export const barColor = (acc: number): string => (acc < 0.6 ? "var(--bad)" : acc < 0.8 ? "var(--false)" : "var(--good)");
