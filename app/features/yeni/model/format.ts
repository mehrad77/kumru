// How the Connections sheet words a date. Pure.

/** "today", "yesterday", else the date (with the year when it is not this one). */
export function dayLabel(t: number | string, now: Date = new Date()): string {
  const d = new Date(t);
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5);
  return days <= 0 ? "today" : days === 1 ? "yesterday"
    : d.toLocaleDateString(undefined, d.getFullYear() === now.getFullYear() ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}
