// The book summary a class member shares with their teacher (shared/yeni.ts BookDoc) as the numbers the class pages show. Pure.
import type { BookDoc } from "../../../../shared/yeni.ts";
import { relTime as frRelTime } from "../../../lib/reltime.ts";

export interface ClassBookUnit { r: string; lv: string; n: number; d: boolean; p: number; s: number[] }
export interface ClassBookCount { units: ClassBookUnit[]; done: number; solved: number; total: number }

const REF = /^[A-Z]\d_\d+$/;

/** One entry per unit the learner has opened: done, else the share of pages read; with the exercises [tried, solved, total]. */
export function classBookUnits(b: BookDoc | null | undefined): ClassBookUnit[] {
  return Object.keys((b && b.units) || {}).filter((r) => REF.test(r)).sort().map((r) => {
    const u = b!.units[r], [lv, n] = r.split("_");
    return { r, lv, n: +n, d: !!u.d, p: Math.max(0, Math.min(1, +u.p || 0)), s: Array.isArray(u.s) ? u.s : [0, 0, 0] };
  }).filter((u) => u.d || u.p > 0 || u.s[0] > 0);
}

export function classBookCount(b: BookDoc | null | undefined): ClassBookCount {
  const units = classBookUnits(b);
  return { units, done: units.filter((u) => u.d).length, solved: units.reduce((a, u) => a + (+u.s[1] || 0), 0), total: units.reduce((a, u) => a + (+u.s[2] || 0), 0) };
}

/** "A1 · Ünite 3, 2 days ago" for where they were last, "" when the summary has none. */
export const classBookLast = (b: BookDoc | null | undefined, now: number): string =>
  b && b.last && REF.test(b.last.ref) ? b.last.ref.split("_")[0] + " · Ünite " + b.last.ref.split("_")[1] + (b.last.at > 0 ? ", " + frRelTime(b.last.at, now) : "") : "";
