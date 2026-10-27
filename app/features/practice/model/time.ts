// Clock text for timed sessions and their reports.

/** Milliseconds as 4:05, or 1:04:05 from an hour. */
export const fmtClock = (ms: number): string => {
  ms = Math.max(0, ms);
  const t = Math.ceil(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0");
};

/** Minutes as 25 min, 1 hour, 2 hours or 1 h 30 min. */
export const fmtMin = (m: number): string => (m >= 60 ? (m % 60 ? Math.floor(m / 60) + " h " + m % 60 + " min" : (m / 60) + (m === 60 ? " hour" : " hours")) : m + " min");
