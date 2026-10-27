// "just now", "5 min ago", "yesterday", "3 weeks ago": how long ago something happened, for the Friends inbox, a friend's recent
// units and a class member's last book activity.

const DAY = 864e5;

export function relTime(at: number, now: number): string {
  const d = now - at;
  if (!(at > 0)) return "";
  if (d < 60e3) return "just now";
  if (d < 3600e3) return Math.floor(d / 60e3) + " min ago";
  if (d < DAY) return Math.floor(d / 3600e3) + " h ago";
  const days = Math.floor(d / DAY);
  return days === 1 ? "yesterday" : days < 14 ? days + " days ago" : Math.floor(days / 7) + " weeks ago";
}
