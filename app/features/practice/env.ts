// The learner's state and the course as the session kinds' pure model (model/queues.ts, model/nodes.ts, model/unit.ts) wants it: the
// store, the progress feature, and what the Path owns (a unit's words and lessons, the skill tree's pickers).
import { S } from "../../core/store.ts";
import { cardTries } from "../../lib/progress.ts";
import { levelRank, refUnit, unitIdx, unitLabel, unitTitle } from "../../lib/units.ts";
import { hasVoice } from "../../ui/speech.ts";
import { DT } from "../drills/index.ts";
import { isKnown, isSkippedUnit, isWeak, levelDist } from "../progress/index.ts";
import { coreWords, secLessons, secWords, skillReview, treePlacedWords, treeWordIds, unitLessons } from "../path/index.ts";
import { mistakes } from "../tutor/index.ts";
import { all } from "./cards.ts";
import { buildable } from "./model/deck.ts";
import type { Lesson, NodeEnv } from "./model/nodes.ts";
import type { QCard, QueueEnv } from "./model/queues.ts";
import type { UnitEnv } from "./model/unit.ts";

const tries = (id: string): number => cardTries(S.stats[id]);

/** The queues' view of the learner. */
export const queueEnv: QueueEnv = {
  words: () => all("word") as QCard[],
  wordCards: () => [...S.cards.values()] as QCard[],
  tries,
  isWeak,
  isKnown,
  refUnit,
  isSkippedUnit,
  unitIdx,
  unitLabel,
  levelDist,
  levelRank,
  // the skill tree is the Path's: its words are taught by their skills
  treeWordIds,
  treePlacedWords: () => treePlacedWords() as QCard[],
};

/** What a path node's queue needs: the queues' view plus the course's lessons and the Path's word pickers. */
export const nodeEnv: NodeEnv = {
  ...queueEnv,
  voice: () => !!hasVoice(),
  grammar: (id) => (S.grammar as Lesson[]).find((d) => d.id === id),
  card: (id) => S.cards.get(id) as QCard | undefined,
  drills: () => DT,
  buildable,
  coreWords: (lv, u) => coreWords(lv, u) as QCard[],
  secWords: (sec, n) => secWords(sec, n) as QCard[],
  secLessons: (sec) => secLessons(sec) as Lesson[],
  unitLessons: (lv, u) => unitLessons(lv, u) as Lesson[],
  skillReview: (sk, i) => skillReview(sk, i) as QCard[],
  unitTitle,
  mistakeCount: () => mistakes().length,
};

/** What a unit's progress needs. */
export const unitEnv: UnitEnv = {
  words: (ref) => all("word").filter((c) => c.ref === ref),
  lessons: (ref) => (S.grammar as Lesson[]).filter((d) => d.ref === ref),
  isKnown,
  tries,
  learned: (id) => !!S.learned[id],
  unitTitle,
};
