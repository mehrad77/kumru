// Which words a session draws on: the new-word and catch-up queues, the next batch of new words, the review pool, a words node's
// five. Pure: the learner's state comes in as arguments (`QueueEnv`), nothing here reads the store.

export interface QCard { id: string; kind?: string; tr: string; en?: string; fa?: string; topic?: string; ref?: string; level?: string; core?: boolean; [field: string]: unknown }

/** What the queues need to know about the learner and the course; practice/env.ts builds it from the live state. */
export interface QueueEnv {
  /** Every live word card. */
  words(): QCard[];
  /** Every word card, retired ones too (the review pool has always included them). */
  wordCards(): QCard[];
  tries(id: string): number;
  isWeak(id: string): boolean;
  isKnown(c: QCard): boolean;
  refUnit(c: QCard): { lv: string; u: number } | null;
  isSkippedUnit(lv: string, u: number): boolean;
  unitIdx(lv: string, u: number): number;
  unitLabel(lv: string, u: number): string;
  levelDist(level: string): number;
  levelRank(level: string): number;
  /** The words the skill tree teaches by its skills (null without the tree). */
  treeWordIds(): Set<string> | null;
  /** The words of the skills the learner was placed past. */
  treePlacedWords(): QCard[];
}

/** The course's order of topics; a topic it does not list sorts last. */
export const TOPIC_ORDER = ["Greetings", "Pronouns and pointers", "Question words", "Numbers", "Days and time", "Months", "Weather and seasons", "Family", "People and jobs", "Countries and languages", "Home", "Food and drink", "Shopping", "Clothes and colours", "City and transport", "Body and health", "Everyday actions", "Describing", "Free time",
  "Travel and holidays", "Work and business", "Education", "Nature and environment", "Technology", "Media and communication", "Society", "Culture and arts", "Feelings and character", "Linking words", "General"];
export const topicRank = (t: string | undefined): number => { const i = TOPIC_ORDER.indexOf(t as string); return i < 0 ? 99 : i; };

/** Sorts by a list of keys (numbers or strings) computed once per item rather than inside the comparator. */
export function sortByKeys<T>(list: T[], keys: (x: T) => (number | string)[]): T[] {
  return list.map((x) => [keys(x), x] as const).sort(([a], [b]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return typeof a[i] === "string" ? (a[i] as string).localeCompare(b[i] as string) : (a[i] as number) - (b[i] as number);
    return 0;
  }).map((p) => p[1]);
}

const unitNo = (env: QueueEnv, c: QCard): number => { const r = env.refUnit(c); return r ? r.u : 9; };
const placedPast = (env: QueueEnv, c: QCard): boolean => { const r = env.refUnit(c); return !!r && env.isSkippedUnit(r.lv, r.u); };
/** A word never answered that has a Turkish side and a meaning. */
export const freshWord = (env: QueueEnv, c: QCard): boolean => !env.tries(c.id) && !!c.tr && !!(c.fa || c.en);

/** New words from the learner's own level and above; words of placed-past units wait for Catch up. */
export function newWordQueue(env: QueueEnv): QCard[] {
  const tw = env.treeWordIds();
  return sortByKeys(env.words().filter((c) => freshWord(env, c) && !placedPast(env, c) && !(tw && tw.has(c.id))), (c) => [env.levelDist(c.level as string), env.levelRank(c.level as string), unitNo(env, c), topicRank(c.topic), String(c.id)]);
}

/** Unmet words of the units the learner was placed past, lowest unit first. With the tree, the words of its skills are taught by
 * their skills (Catch up offers those of placed skills first); only the other words follow the units. */
export function catchUpQueue(env: QueueEnv): QCard[] {
  const tw = env.treeWordIds();
  const legacy = sortByKeys(env.words().filter((c) => freshWord(env, c) && placedPast(env, c) && !(tw && tw.has(c.id))), (c) => { const r = env.refUnit(c) as { lv: string; u: number }; return [env.unitIdx(r.lv, r.u), topicRank(c.topic), String(c.id)]; });
  return tw ? [...env.treePlacedWords().filter((c) => freshWord(env, c)), ...legacy] : legacy;
}

/** The next batch of new words: one unit, one topic where possible. */
export function newBatch(env: QueueEnv, n: number, skip?: Set<string> | null, queue?: QCard[]): { words: QCard[]; label: string; ref?: string } {
  const words = (queue || newWordQueue(env)).filter((c) => !skip || !skip.has(c.id));
  if (!words.length) return { words: [], label: "" };
  const h = words[0], same = words.filter((c) => c.ref === h.ref);
  const out = same.filter((c) => c.topic === h.topic).slice(0, n);
  if (out.length < n) out.push(...same.filter((c) => !out.includes(c)).slice(0, n - out.length));
  if (out.length < n) out.push(...words.filter((c) => !out.includes(c)).slice(0, n - out.length));
  const r = env.refUnit(h);
  return { words: out, label: (r ? r.lv + " " + env.unitLabel(r.lv, r.u) : (h.level as string) || "") + (h.topic ? " · " + h.topic : ""), ref: h.ref || "" };
}

/** The words a review draws on: the weak ones when there are at least three, else every word met. */
export function reviewPool(env: QueueEnv): QCard[] {
  const pr = env.wordCards().filter((c) => c.kind === "word" && env.tries(c.id)), weak = pr.filter((c) => env.isWeak(c.id));
  return weak.length >= 3 ? weak : pr;
}

/** How many new words a words node teaches. */
export const NODE_WORDS = 5;
/** The next five words of a words node, from the unit's core words `ws`: ones you don't know yet, unseen first, one topic at a time. */
export function nodeWords(env: QueueEnv, ws: QCard[]): QCard[] {
  let pick = sortByKeys(ws.filter((c) => !env.isKnown(c)), (c) => [env.tries(c.id) ? 1 : 0, topicRank(c.topic), String(c.topic || ""), String(c.id)]).slice(0, NODE_WORDS);
  if (pick.length < NODE_WORDS) pick = pick.concat(sortByKeys(ws.filter((c) => !pick.includes(c)), (c) => [env.isWeak(c.id) ? 0 : 1, String(c.id)]).slice(0, NODE_WORDS - pick.length));
  return pick;
}
