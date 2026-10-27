// The Profile's activity calendar: 18 weeks of days, in the Jalali (weeks start on Saturday) or Gregorian (Monday) layout. Pure:
// the days and "now" are passed in.
import { dayKey } from "../../../lib/progress.ts";

export const WEEKS = 18;

export interface CalCell { n: number; level: number; today: boolean; title: string }
export interface CalWeek { label: string; cells: (CalCell | null)[] }
export interface Calendar { weekdays: string[]; weeks: CalWeek[]; total: number; active: number }

const level = (n: number): number => (n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 30 ? 3 : 4);

/** The grid: a label per weekday row, then per week its month label (on the week a month starts) and its seven cells (null after today). */
export function calendar(days: Record<string, number>, jalali: boolean, nowIn: Date = new Date()): Calendar {
  const now = new Date(nowIn);
  now.setHours(0, 0, 0, 0);
  const startDow = jalali ? 6 : 1;
  const start = new Date(now);
  start.setDate(start.getDate() - ((start.getDay() - startDow + 7) % 7) - (WEEKS - 1) * 7);
  let fmtM: Intl.DateTimeFormat, fmtD: Intl.DateTimeFormat;
  try { fmtM = new Intl.DateTimeFormat(jalali ? "en-u-ca-persian" : "en", { month: "short" }); fmtD = new Intl.DateTimeFormat(jalali ? "en-u-ca-persian" : "en", { day: "numeric" }); }
  catch { fmtM = new Intl.DateTimeFormat("en", { month: "short" }); fmtD = new Intl.DateTimeFormat("en", { day: "numeric" }); }
  const fG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
  let fJ: Intl.DateTimeFormat | null = null;
  try { fJ = new Intl.DateTimeFormat("en-u-ca-persian", { day: "numeric", month: "long", year: "numeric" }); } catch { /* no Persian calendar */ }
  const wd = new Intl.DateTimeFormat("en", { weekday: "short" });
  const at = (offset: number): Date => { const d = new Date(start); d.setDate(start.getDate() + offset); return d; };

  const weekdays: string[] = [];
  for (let r = 0; r < 7; r++) weekdays.push(r % 2 === 0 ? wd.format(at(r)) : "");

  const weeks: CalWeek[] = [];
  let total = 0, active = 0, lastLabel = -1;
  const today = dayKey(now);
  for (let w = 0; w < WEEKS; w++) {
    let label = "";
    for (let r = 0; r < 7; r++) {
      const d = at(w * 7 + r);
      if (d > now) break;
      if (fmtD.format(d).replace(/\D/g, "") === "1" || (w === 0 && r === 0)) { label = fmtM.format(d); break; }
    }
    // two month names closer than three weeks would overlap: keep the later one
    if (label && lastLabel >= 0 && w - lastLabel < 3) weeks[lastLabel].label = "";
    if (label) lastLabel = w;
    const cells: (CalCell | null)[] = [];
    for (let r = 0; r < 7; r++) {
      const d = at(w * 7 + r);
      if (d > now) { cells.push(null); continue; }
      const k = dayKey(d), n = days[k] || 0;
      total += n;
      if (n) active++;
      cells.push({ n, level: level(n), today: k === today, title: fG.format(d) + (fJ ? " · " + fJ.format(d) : "") + " — " + n + (n === 1 ? " answer" : " answers") });
    }
    weeks.push({ label, cells });
  }
  return { weekdays, weeks, total, active };
}
