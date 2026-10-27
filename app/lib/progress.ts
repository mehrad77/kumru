// Days, weeks and XP: the calendar arithmetic the progress document and the weekly leaderboard share. Pure; the confidence rules
// are below.

/** `2026-10-07`, in local time. */
export const dayKey = (d: Date): string => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

/** ISO week key such as 2026-W41; the weekly leaderboard counts XP per key. No argument means now. */
export function weekKey(date?: Date | number): string {
  const d = new Date(date || Date.now());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return d.getFullYear() + "-W" + String(1 + Math.round(((+d - +w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)).padStart(2, "0");
}

/** The XP earned in the week `key`, from the per-day totals (`{ "2026-10-07": 40 }`). */
export function xpInWeek(key: string, days: Record<string, number>): number {
  let n = 0;
  for (const k in days) {
    const [y, m, d] = k.split("-").map(Number);
    if (weekKey(new Date(y, m - 1, d)) === key) n += days[k] || 0;
  }
  return n;
}

// ---------- word confidence (docs/PROGRESS.md) ----------
// A score 0..15 per card: +2 right, +3 easy, −3 wrong, −1 a slip, +1 a forgiven typo; "claim" (I already know this) lifts
// it to confident. Known from 5, confident from 10.

export const CONF_STEP: Record<string, number> = { right: 2, easy: 3, wrong: -3, slip: -1, near: 1 };
export const CONF_MAX = 15, CONF_KNOWN = 5, CONF_SURE = 10;

/** The score after an event. A claim never lowers a score; everything else is clamped to 0..15. */
export const confAdd = (score: number | undefined, ev: string): number =>
  ev === "claim" ? Math.max(score || 0, CONF_SURE) : Math.max(0, Math.min(CONF_MAX, (score || 0) + (CONF_STEP[ev] || 0)));

/** Old-style box levels (0..5) become scores; level 3+ stays known. */
export function boxToConf(box: Record<string, number> | null | undefined): Record<string, number> {
  const o: Record<string, number> = {};
  for (const id in box || {}) {
    const v = Math.max(0, Math.min(5, +box![id] || 0));
    if (v) o[id] = v * 2;
  }
  return o;
}

/** A card's answer counters: `a` answered, `g` good, `e` easy, `r` right, `w` wrong, `l` the last one, `v` seen. */
export interface CardStats { a?: number; g?: number; e?: number; r?: number; w?: number; l?: number; v?: unknown }
export const cardTries = (s: CardStats | null | undefined): number => (s ? (s.a || 0) + (s.g || 0) + (s.e || 0) + (s.r || 0) + (s.w || 0) : 0);
export const cardGood = (s: CardStats | null | undefined): number => (s ? (s.g || 0) + (s.e || 0) + (s.r || 0) : 0);
/** Tried, and the last answer wrong or fewer than two in three good. */
export const isWeakStats = (s: CardStats | null | undefined): boolean => {
  const t = cardTries(s);
  return t > 0 && (s!.l === 0 || cardGood(s) / t < 0.67);
};
/** Where a card stands: new, learning, known or confident. */
export const confBand = (score: number, s: CardStats | null | undefined): "new" | "learning" | "known" | "confident" =>
  score >= CONF_SURE ? "confident" : score >= CONF_KNOWN ? "known" : score > 0 || cardTries(s) || (s && s.v) ? "learning" : "new";
