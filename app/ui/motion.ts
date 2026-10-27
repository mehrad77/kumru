// Motion helpers: slide an element from where it was to where it is now (the practice tiles do FLIP with it).
export const reduceMotion = (): boolean => matchMedia("(prefers-reduced-motion:reduce)").matches;

/** Slide `e` from where it was (`from`) to where it is now. Returns the animation, or null if there is nothing to animate. */
export function fly(e: HTMLElement, from: DOMRect | null | undefined, ms?: number): Animation | null {
  if (!from || reduceMotion()) return null;
  const b = e.getBoundingClientRect(), dx = from.left - b.left, dy = from.top - b.top;
  return dx || dy ? e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: ms || 240, easing: "cubic-bezier(.22,1,.36,1)" }) : null;
}
