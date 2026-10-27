// Writing practice: building a word from letter tiles. The tiles are the answer's letters plus a few look-alike or stray decoys.
import { shuffle } from "../../../lib/random.ts";

const LOOK: Record<string, string> = { i: "ı", ı: "i", o: "ö", ö: "o", u: "ü", ü: "u", s: "ş", ş: "s", c: "ç", ç: "c", g: "ğ", ğ: "g" };

export interface LetterPlan {
  /** Length of each word of the answer (the line shows one group of slots per word). */
  lens: number[];
  /** The answer's letters in order, spaces left out. */
  letters: string[];
  /** The tiles of the bank: the letters and the decoys, shuffled. */
  tiles: string[];
}

/** Longer words get more decoys: 2, 3 from 7 letters, 4 from 9, 5 from 12. */
export const decoyCount = (n: number): number => (n >= 12 ? 5 : n >= 9 ? 4 : n > 6 ? 3 : 2);

export function letterPlan(target: string, rng?: () => number): LetterPlan {
  const lens = target.split(" ").map((w) => [...w].length).filter(Boolean), letters = [...target.replace(/ /g, "")];
  const have = new Set(letters), decoy: string[] = [];
  for (const ch of shuffle([...have].filter((x) => LOOK[x] && !have.has(LOOK[x])), rng)) if (decoy.length < 2) decoy.push(LOOK[ch]);
  const pool = shuffle([..."abcdefghijklmnoprstuvyzçğıöşü"].filter((x) => !have.has(x) && !decoy.includes(x)), rng);
  while (decoy.length < decoyCount(letters.length)) decoy.push(pool.pop() as string);
  return { lens, letters, tiles: shuffle(letters.concat(decoy), rng) };
}

/** What the learner has built, as text: the chosen tiles (indexes into `plan.tiles`) cut into the answer's words. */
export function letterValue(plan: LetterPlan, chosen: readonly number[]): string {
  let at = 0;
  return plan.lens.map((n) => { const s = chosen.slice(at, at + n).map((i) => plan.tiles[i]).join(""); at += n; return s; }).filter(Boolean).join(" ");
}

/** The hint button: keep the correct start of what is built, then add the next letter. Returns the new chosen list. */
export function letterHint(plan: LetterPlan, chosen: readonly number[]): number[] {
  let k = 0;
  while (k < chosen.length && k < plan.letters.length && plan.tiles[chosen[k]] === plan.letters[k]) k++;
  const keep = chosen.slice(0, k), x = plan.tiles.findIndex((t, i) => t === plan.letters[k] && !keep.includes(i));
  return x >= 0 ? [...keep, x] : keep;
}
