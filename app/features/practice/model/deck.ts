// Which card a question asks, which cards are wrong options, and how a sentence is cut into tiles. Pure: the learner's state
// (confidence, tries, weak words) is passed in as functions.
import { shuffle } from "../../../lib/random.ts";
import { type Card, meaningClash } from "./gloss.ts";

/** How likely a card is to be asked: weak and unseen words first, sure ones (confidence 10+) rarely. */
export const weightOf = (conf: number, sure: number, weak: boolean, tried: boolean): number =>
  conf >= sure ? 0.15 : 1 + (sure - conf) * 0.8 + (weak ? 3 : 0) + (tried ? 0 : 1.5);

/** One of `pool` chosen by weight, avoiding the ids in `avoid` while others remain; null for an empty pool. */
export function pickWeighted<T extends { id?: string }>(pool: readonly T[], avoid: ReadonlySet<string> | null | undefined, weight: (c: T) => number, rng: () => number = Math.random): T | null {
  let p = pool.filter((c) => !avoid || !avoid.has(c.id as string));
  if (!p.length) p = pool.slice();
  if (!p.length) return null;
  const total = p.reduce((a, c) => a + weight(c), 0);
  let r = rng() * total;
  for (const c of p) { r -= weight(c); if (r <= 0) return c; }
  return p[0];
}

/** The card plus up to three distractors taken in order from `pool`, each with a different label. */
export function pickOptions<T>(c: T, pool: readonly T[], label: (x: T) => string): T[] {
  const opts = [c], seen = new Set([label(c)]);
  for (const x of pool) {
    const v = label(x);
    if (!seen.has(v)) { seen.add(v); opts.push(x); }
    if (opts.length >= 4) break;
  }
  return opts;
}

/** The wrong options of a multiple-choice question: the lesson's own words first, then the same topic, then any card; never one that means the same. */
export function distractors(c: Card, same: Card[], near: Card[], label: (x: Card) => string, rng?: () => number): Card[] {
  const pref = shuffle(near, rng).concat(shuffle(same.filter((x) => c.topic && x.topic === c.topic), rng), shuffle(same, rng));
  return pickOptions(c, pref.filter((x) => !meaningClash(c, x)), label);
}

/** A Persian prompt that is plain Persian (no Latin letters), so it can ask for a built sentence. */
export const plainFa = (fa: string): boolean => !/[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]/.test(fa);

/** A sentence can be a Build item when its Persian prompt is plain Persian («kalem» یعنی چه؟ asks about a Turkish word) and it has 2 to 9 words. */
export const buildable = (tr: string | undefined, fa: string | undefined): boolean =>
  !!(tr && fa && !tr.includes(",") && plainFa(fa) && ((n) => n >= 2 && n <= 9)(tr.split(/\s+/).length));

const clean = (t: string): string => t.replace(/[.,!?;:"«»]/g, "");

/** The words of a sentence without its punctuation. */
export const sentenceWords = (tr: string): string[] => tr.split(/\s+/).map(clean).filter(Boolean);

/** A tile shows lower case, so the first one does not give the sentence start away; a capital stays on proper nouns and on any word that is not first. */
export const tileText = (t: string, j: number, proper: (t: string) => boolean): string =>
  /^[A-ZÇĞİÖŞÜ]/.test(t) && (j > 0 || proper(t)) ? t : t.toLocaleLowerCase("tr");

/** Decoy tiles: words of other sentences of the pool that no accepted form uses, so a variant can never be marked wrong by a decoy. */
export function decoyTiles(pool: readonly { id?: string; tr: string }[], self: { id?: string }, accepted: ReadonlySet<string>, count: number, proper: (t: string) => boolean, rng?: () => number): string[] {
  const words = pool.filter((x) => x.id !== self.id).flatMap((x) => sentenceWords(x.tr).map((t, j) => (t && !accepted.has(t.toLocaleLowerCase("tr")) ? tileText(t, j, proper) : ""))).filter(Boolean);
  return shuffle([...new Set(words)], rng).slice(0, count);
}
