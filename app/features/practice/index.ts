// The practice feature: the session runner and every question type (flashcards, multiple choice, type it, listen and type, match
// pairs, build the sentence, suffix drill, a new word's teach card, and Fix my mistakes' two questions), and the session kinds that
// use them (a path node, timed and review sessions, the Lab's, with their intro and lesson cards and reports). No tab, no server half.
// kinds.ts builds the `S.session` object and registers the driver; README.md has the contract.
import type { WebFeature } from "../../core/feature.ts";
import { S } from "../../core/store.ts";
import { queueEnv, unitEnv } from "./env.ts";
import { newBatch, catchUpQueue, sortByKeys, topicRank, type QCard } from "./model/queues.ts";
import { unitInfo as unitInfoOf, type UnitInfo } from "./model/unit.ts";
import { endSession } from "./session.ts";
import type { Card } from "./types.ts";

export { EXTYPES, type ExType } from "./extypes.ts";
/** The word-hint model (an index of the cards, a sentence cut into glossed words), for the story reader; loaded on demand. */
export const loadGlossModel = () => import("./model/gloss.ts");
export type { GlossIndex } from "./model/gloss.ts";
export { endSession, startSession } from "./session.ts";
export { startCustom, startNode } from "./kinds.ts";
/** The next words to meet (`queue` overrides the default order), the words of units or skills the learner was placed past, and where a topic sits in the course's order. */
export const newWordBatch = <C extends { id: string }>(n: number, skip?: Set<string> | null, queue?: C[]): { words: C[]; label: string; ref?: string } => newBatch(queueEnv, n, skip, queue as unknown as QCard[]) as unknown as { words: C[]; label: string; ref?: string };
export const catchUpWords = <C extends { id: string } = Card>(): C[] => catchUpQueue(queueEnv) as unknown as C[];
export { topicRank, sortByKeys };
/** How far along a unit of the books is (words known, lessons learned). */
export const unitInfo = (lv: string, u: number): UnitInfo => unitInfoOf(unitEnv, lv, u);
export type { UnitInfo };
export type { Card, Driver, Foot, Session, Step } from "./types.ts";

export const feature: WebFeature = {
  id: "practice",
  /** Another tab ends a running session without its report. */
  onLeave: () => { if (S.session) endSession(true); },
};
