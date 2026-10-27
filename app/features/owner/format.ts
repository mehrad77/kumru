// How the Owner dashboard words times and sizes. Pure.

/** "just now", "5 h ago" up to two days, then "3 days ago". */
export function relTime(t: number, now: number): string {
  const h = Math.round((now - t) / 36e5);
  return h < 1 ? "just now" : h < 48 ? h + " h ago" : Math.round(h / 24) + " days ago";
}

/** 512 B, 40 KB, 1.2 MB. */
export const bytesLabel = (n: number): string => (n > 1e6 ? (n / 1e6).toFixed(1) + " MB" : n > 1e3 ? Math.round(n / 1e3) + " KB" : n + " B");
