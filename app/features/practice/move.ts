// "The word's confidence after this answer": what the progress feature recorded when it bumped a word, taken once.
import { confMove } from "../progress/index.ts";
import { confBand, confDots } from "../progress/index.ts";

/** The change of one word's confidence: the dots it had before, now, and the band it is in. */
export interface Move { from: number; to: number; dots: number; band: string }

/** Take (and forget) the confidence change of word `id` from the answer just given; null when it did not move. */
export function takeMove(id: string): Move | null {
  const m = confMove[id];
  delete confMove[id];
  if (!m || m.from === m.to) return null;
  return { from: m.from, to: m.to, dots: confDots(id), band: confBand(id) };
}
