// Levels and units: the unit titles, the 0..17 unit index across the three levels, and a card's unit. Pure.

/** Unit titles, the same for every level; a card's ref is "<level>_<unit>" (e.g. A2_3). */
const UNITS = ["Ünite 1", "Ünite 2", "Ünite 3", "Ünite 4", "Ünite 5", "Ünite 6"];
export const UNIT_TITLES: Record<string, string[]> = { A1: UNITS, A2: UNITS, B1: UNITS };
export const LEVELS = ["A1", "A2", "B1"];
/** 0 for A1, 1 for A2, 2 for B1; 9 for anything else. */
export const levelRank = (l: string): number => {
  const i = LEVELS.indexOf(l);
  return i < 0 ? 9 : i;
};
/** The 0..17 unit index across levels. */
export const unitIdx = (lv: string, u: number): number => levelRank(lv) * 6 + (u - 1);
export const idxUnit = (i: number): { lv: string; u: number } => ({ lv: LEVELS[Math.max(0, Math.min(2, Math.floor(i / 6)))], u: Math.max(0, Math.min(17, i)) % 6 + 1 });
/** The level and unit of a card, from its `ref` ("A2_3"). */
export const refUnit = (c: { ref?: string } | null | undefined): { lv: string; u: number } | null => {
  const m = /^([A-Z]\d)_(\d+)$/.exec((c && c.ref) || "");
  return m ? { lv: m[1], u: +m[2] } : null;
};
export const unitTitle = (lv: string, u: number): string => (UNIT_TITLES[lv] || [])[u - 1] || "";
export const unitLabel = (lv: string, u: number): string => unitTitle(lv, u) || "Unit " + u;
