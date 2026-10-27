// Prove it: check the words the learner said they already know. A claimed word is confident (10+) without ever having been
// answered: the "I already know this" lift. Answering it, right or wrong, gives it answer counts, so it leaves this pool on its
// own and no claim flag is stored (docs/PROGRESS.md).
import { CONF_SURE, cardTries, type CardStats } from "../../../lib/progress.ts";
import { shuffle } from "../../../lib/random.ts";

export interface ProveCard { id: string; kind: string; tr: string; fa?: string; en?: string }

/** The step shapes the session engine runs: a phrase of three words or more is picked, a shorter one typed from its meaning. */
export type ProveStep<T> = { k: "choice"; c: T; dir: "t"; dpool: readonly T[]; label: string } | { k: "type"; c: T; label: string };

export const claimedWords = <T extends ProveCard>(cards: readonly T[], conf: Record<string, number>, stats: Record<string, CardStats | undefined>): T[] =>
  cards.filter((c) => c.kind === "word" && c.tr && (c.fa || c.en) && (conf[c.id] || 0) >= CONF_SURE && !cardTries(stats[c.id]));

/** Up to `max` words (12), each asked once; `order` is the shuffle. */
export const proveSteps = <T extends ProveCard>(words: readonly T[], max = 12, order: (a: readonly T[]) => T[] = shuffle): ProveStep<T>[] =>
  order(words).slice(0, max).map((c): ProveStep<T> =>
    c.tr.trim().split(/\s+/).length >= 3 ? { k: "choice", c, dir: "t", dpool: words, label: "Prove it" } : { k: "type", c, label: "Prove it" });
