// The daily-goal ring: an arc of how much of `max` is done, a check once it is met. The Path's stats pill and the practice report draw it.
export function Ring({ v, max, small }: { v: number; max: number; small?: boolean }) {
  const circ = 2 * Math.PI * 34, p = Math.min(1, v / max), w = small ? 10 : 8;
  return (
    <svg class={"ring" + (small ? " sm" : "") + (p >= 1 ? " met" : "")} viewBox="0 0 84 84" role="img" aria-label={v + " of " + max + " XP today"}>
      <circle cx="42" cy="42" r="34" fill="none" stroke-width={w} class="track" />
      <circle cx="42" cy="42" r="34" fill="none" stroke-width={w} stroke-linecap="round" class="val" stroke-dasharray={circ} stroke-dashoffset={circ * (1 - p)} transform="rotate(-90 42 42)" />
      {p >= 1 ? <path class="ck" d="M30 43l8 8 16-17" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" /> : small ? null : <text x="42" y="48" text-anchor="middle">{Math.round(p * 100) + "%"}</text>}
    </svg>
  );
}
