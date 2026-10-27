// The Path before the skill tree: one road from A1 Unit 1 to B1 Unit 6. Each book unit is a section of steps: its grammar lessons,
// batches of its core words, a checkpoint and a review. Pure: the course and the learner's state come in as `RoadEnv`.
/* eslint-disable @typescript-eslint/no-explicit-any -- a lesson is an open record (the grammar documents) */

export type NodeType = "lesson" | "words" | "checkpoint" | "review";
export type NodeState = "done" | "open" | "cur" | "locked";
export interface Lesson { id: string; title: string; order?: number; en?: string; [field: string]: any }
export interface RoadNode { id: string; type: NodeType; lv: string; u: number; title: string; k?: number; of?: number; L?: Lesson; state?: NodeState }
/** How far along a unit is (practice's `unitInfo`). */
export interface UnitStat { n: number; known: number; lessons: number; learned: number; pct: number; done?: boolean }
export type UnitState = "past" | "cur" | "later";
export interface RoadUnit { i: number; lv: string; u: number; title: string; nodes: RoadNode[]; state: UnitState; done: boolean; info: UnitStat }

export interface RoadEnv {
  /** A unit's grammar lessons in book order. */
  lessons(lv: string, u: number): Lesson[];
  /** How many core words a unit has. */
  wordCount(lv: string, u: number): number;
  /** The unit index (0-17) the learner is on. */
  curIdx(): number;
  idxUnit(i: number): { lv: string; u: number };
  unitDone(lv: string, u: number): boolean;
  unitTitle(lv: string, u: number): string;
  unitInfo(lv: string, u: number): UnitStat;
  /** Lessons are done when learned, a review when done today, the others when stored. */
  nodeDone(n: RoadNode): boolean;
}

/** Word nodes of a unit: one per ~30 words, between 2 and 6; none without words. */
export const wordNodeCount = (words: number): number => (words ? Math.max(2, Math.min(6, Math.round(words / 30))) : 0);

/** A lesson's id without its `g_<level>_<unit>_` prefix. */
export const lessonSlug = (d: { id: string }): string => String(d.id).replace(/^g_[a-z0-9]+_\d+_/, "");

/** The steps of a unit, in road order: lesson, lesson, words, lesson, lesson, words … checkpoint, review. */
export function unitNodes(env: Pick<RoadEnv, "lessons" | "wordCount">, lv: string, u: number): RoadNode[] {
  const ref = lv + "_" + u, L = env.lessons(lv, u), wn = wordNodeCount(env.wordCount(lv, u)), nodes: RoadNode[] = [];
  let w = 1;
  const word = (k: number): RoadNode => ({ id: ref + "_w" + k, type: "words", lv, u, k, of: wn, title: "New words" + (wn > 1 ? " " + k + "/" + wn : "") });
  L.forEach((d, i) => {
    nodes.push({ id: ref + "_l_" + lessonSlug(d), type: "lesson", lv, u, L: d, title: d.title });
    if (i % 2 === 1 && w <= wn) nodes.push(word(w++));
  });
  while (w <= wn) nodes.push(word(w++));
  if (!nodes.length) return [];
  nodes.push({ id: ref + "_cp", type: "checkpoint", lv, u, title: "Checkpoint" }, { id: ref + "_rv", type: "review", lv, u, title: "Review" });
  return nodes;
}

/** The whole road with each node's state: done, cur (the one next step), open (replay) or locked. */
export function buildPath(env: RoadEnv): RoadUnit[] {
  const units: RoadUnit[] = [], ci = env.curIdx();
  for (let i = 0; i < 18; i++) {
    const { lv, u } = env.idxUnit(i), nodes = unitNodes(env, lv, u);
    if (!nodes.length) continue;
    const state: UnitState = i < ci ? "past" : i === ci ? "cur" : "later";
    let curSet = false;
    for (const n of nodes) {
      const d = env.nodeDone(n);
      if (state === "past") n.state = d ? "done" : "open";
      else if (state === "later") n.state = "locked";
      else if (d) n.state = "done";
      else if (n.type === "review") n.state = env.unitDone(lv, u) ? "cur" : "locked";
      else if (!curSet) { n.state = "cur"; curSet = true; }
      else n.state = "locked";
    }
    units.push({ i, lv, u, title: env.unitTitle(lv, u), nodes, state, done: env.unitDone(lv, u), info: env.unitInfo(lv, u) });
  }
  return units;
}

/** The next unit after index `i` that has path nodes (`i` when there is none). */
export function nextUnitIdx(env: Pick<RoadEnv, "idxUnit" | "lessons" | "wordCount">, i: number): number {
  for (let j = i + 1; j < 18; j++) {
    const { lv, u } = env.idxUnit(j);
    if (unitNodes(env, lv, u).length) return j;
  }
  return i;
}
