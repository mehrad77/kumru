// Invite links (follow, join a class, open a profile) open sheets; while the full-screen onboarding is up they would open beneath
// it, so they wait. The onboarding calls `flushLater` when it closes (ui/later.ts).

const waiting: (() => void)[] = [];

/** Run `fn` now, or after the onboarding closes. */
export function later(fn: () => void): void {
  if (document.querySelector(".onb-back")) waiting.push(fn);
  else fn();
}

export function flushLater(): void {
  while (waiting.length && !document.querySelector(".onb-back")) waiting.shift()!();
}
