// The Path's view of the course and the learner: a unit's words and lessons, the road of steps (before the tree), the skill tree
// (sections of skills, from the `path` collection) and where the learner stands on it. The rules are in model/; this reads the page's
// state (`S`) and the other features. The session kinds (features/practice) call the pickers here for a node's queue.
import { effect, untracked } from "@preact/signals-core";
import { local } from "../../core/local.ts";
import { S, signals } from "../../core/store.ts";
import { CONF_KNOWN, CONF_SURE, dayKey } from "../../lib/progress.ts";
import { LEVELS, idxUnit, refUnit, unitIdx, unitTitle } from "../../lib/units.ts";
import { type UnitInfo, sortByKeys, startNode, unitInfo } from "../practice/index.ts";
import { confBand, confOf, curIdx, isWeak, saveProgress, todayKey, unitDone } from "../progress/index.ts";
import { tree } from "./state.ts";
import { type RoadEnv, type RoadNode, type RoadUnit, buildPath as buildRoad, nextUnitIdx as nextUnit, unitNodes as roadNodes, wordNodeCount as nodeCount } from "./model/road.ts";
import { type Cur, type FlowSection, type Part, type Skill, chunkWords, skillPos, skillParts as partsOf, treeFlow, treeMark } from "./model/tree.ts";
import type { TreeSection } from "./state.ts";

/* eslint-disable @typescript-eslint/no-explicit-any -- cards and lessons are open records (the content collections) */

export { chunkWords };
export type Card = { id: string; kind: string; tr: string; fa?: string; en?: string; ref?: string; core?: boolean; topic?: string; [field: string]: any };
export type Lesson = { id: string; title: string; en?: string; order?: number; ref?: string; [field: string]: any };
export type Flow = ReturnType<typeof buildTree>;

// ---------- a unit of the books ----------

const wordCards = (): Card[] => ([...S.cards.values()] as Card[]).filter((c) => c.kind === "word" && !c.retired);
/** Words of a unit that have a meaning to show. */
export const unitWords = (lv: string, u: number): Card[] => wordCards().filter((c) => c.ref === lv + "_" + u && c.tr && (c.fa || c.en));
/** Core words of a unit (the words the book itself lists). Until cards carry the `core` flag, every unit word counts. */
export function coreWords(lv: string, u: number): Card[] {
  const ws = unitWords(lv, u), core = ws.filter((c) => c.core);
  return core.length ? core : ws;
}
export const wordNodeCount = (lv: string, u: number): number => nodeCount(coreWords(lv, u).length);
export const unitLessons = (lv: string, u: number): Lesson[] => (S.grammar as Lesson[]).filter((d) => d.ref === lv + "_" + u).sort((a, b) => (a.order || 0) - (b.order || 0));

// ---------- the road of steps (the levels the tree does not cover) ----------

const nodeDone = (n: RoadNode): boolean =>
  n.type === "lesson" ? !!S.learned[(n.L as Lesson).id] : n.type === "review" ? !!(S.nd[n.id] && dayKey(new Date(S.nd[n.id].at)) === todayKey()) : !!S.nd[n.id];
export const nodeStars = (n: RoadNode): number => (n.type === "lesson" ? 0 : (S.nd[n.id] || {}).stars || 0);

const roadEnv: RoadEnv = {
  lessons: unitLessons, wordCount: (lv, u) => coreWords(lv, u).length, curIdx, idxUnit, unitDone, unitTitle,
  unitInfo: (lv, u) => unitInfo(lv, u), nodeDone,
};
export const unitNodes = (lv: string, u: number): RoadNode[] => roadNodes(roadEnv, lv, u);
export const buildPath = (): RoadUnit[] => buildRoad(roadEnv);
export const nextUnitIdx = (i: number): number => nextUnit(roadEnv, i);
export type { RoadNode, RoadUnit, UnitInfo };

// ---------- the skill tree ----------

/** The tree is shown to editors (unless ?tree=0) and to anyone who opened the page with ?tree (remembered). */
export function applyTreeSwitch(): void {
  const q = location.search;
  if (/[?&]tree=0\b/.test(q)) local.set("tree", "0");
  else if (/[?&]tree\b/.test(q)) local.set("tree", "1");
}
export const treeWanted = (): boolean => local.get("tree", "") === "1" || !!S.canEdit;
/** The sections shown: all of them to editors and with ?tree, otherwise only those no longer marked draft in data/path. */
export const treeSecs = (): TreeSection[] => {
  const on = local.get("tree", "") === "1" || (S.canEdit && local.get("tree", "") !== "0");
  return tree.value.filter((s) => on || !s.draft);
};
export const useTree = (): boolean => treeSecs().length > 0;
export const wordCardOf = (id: string): Card | null => { const c = S.cards.get(id) as Card | undefined; return c && c.tr && (c.fa || c.en) ? c : null; };
export const skillParts = (sk: Skill, cardOf: (id: string) => Card | null = wordCardOf): Part<Card>[] => partsOf<Card>(sk, cardOf);
export const buildTree = () => treeFlow<Card>(treeSecs(), S.tp, (sk) => skillParts(sk));
export type TreeFlow = ReturnType<typeof buildTree>;
export type FlowSec = FlowSection<Card> & { sec: TreeSection };
export type TreeCur = Cur<Card>;

/** Words and lessons of a section, for its checkpoint (the weakest words first). */
export const secWords = (sec: TreeSection, n: number): Card[] =>
  sortByKeys(sec.skills.flatMap((sk) => (sk.words || []).map(wordCardOf).filter(Boolean) as Card[]), (c: Card) => [confOf(c.id), String(c.id)]).slice(0, n);
export const secLessons = (sec: TreeSection): Lesson[] => sec.skills.flatMap((sk) => sk.lessons || []).map((g) => (S.grammar as Lesson[]).find((d) => d.id === g)).filter(Boolean) as Lesson[];
/** Every word of the tree (null without it): taught by their skills, so the new-word queues leave them out. */
export const treeWordIds = (): Set<string> | null => (useTree() ? new Set(treeSecs().flatMap((s) => s.skills.flatMap((k) => k.words || []))) : null);

const lessonIdxOf = (g: string): number | null => { const L = (S.grammar as Lesson[]).find((d) => d.id === g), m = L && /^([A-Z]\d)_(\d+)$/.exec(L.ref || ""); return m ? unitIdx(m[1], +m[2]) : null; };
const wordIdxOf = (id: string): number | null => { const c = S.cards.get(id) as Card | undefined, r = c && refUnit(c); return r ? unitIdx(r.lv, r.u) : null; };
const treeCtx = () => ({ ci: curIdx(), partsOf: (sk: Skill) => skillParts(sk), posOf: (sk: Skill) => skillPos(sk, lessonIdxOf, wordIdxOf), known: (id: string) => confOf(id) >= CONF_KNOWN, learned: (g: string) => !!S.learned[g], now: Date.now() });

/** Once per learner, when the tree first shows: skills they already know become done, skills before their unit become placed. */
export function treeMigrate(): void {
  if (S.tp.mig || !useTree() || !S.loaded || !S.gLoaded || !S.progLoaded || !S.pos) return;
  S.tp = treeMark(treeSecs(), S.tp, treeCtx(), { migrate: true, place: true });
  saveProgress();
}
/** After a placement or a position change: place the skills before the new unit (place) or only drop placed marks that no longer apply. */
export function treeSync(ci: number, opt: { place?: boolean }): void {
  S.tp = treeMark(treeSecs(), S.tp, { ...treeCtx(), ci }, opt);
}
/**
 * The old-style position (S.pos: friends, tutor level, the unit path of A2 and B1) follows the tree forward only: the book unit of the first
 * unfinished skill, or the unit after the last tree level once everything is done. It never places a skill. True when it moved.
 */
export function treeSyncPos(): boolean {
  if (!useTree()) return false;
  const T = buildTree(), before = curIdx();
  let p: number | null = null;
  if (T.cur) { const ks = "sk" in T.cur ? [T.cur.sk] : T.cur.sec.skills; p = Math.max(...ks.map((k) => skillPos(k, lessonIdxOf, wordIdxOf) ?? 0)); }
  else { const last = treeSecs().reduce((m, s) => Math.max(m, unitIdx(s.level, 6)), 0), j = nextUnitIdx(last); if (j !== last) p = j; }
  if (p != null && p > before) { const x = idxUnit(p); S.pos = { lv: x.lv, u: x.u }; }
  return curIdx() > before;
}
/** Words of the skills the learner was placed past or tested out of: offered under Catch up. */
export const treePlacedWords = (): Card[] => buildTree().secs.flatMap((s) => s.skills.filter((x) => x.state === "placed").flatMap((x) => ((x.sk.words || []).map(wordCardOf).filter(Boolean) as Card[])));
/** Up to 4 words to warm up on before part i of a skill: words the learner met in its earlier parts and in the skills before it, weakest first. */
export function skillReview(sk: Skill, i: number, max = 4): Card[] {
  const own = skillParts(sk).slice(0, i).flatMap((p) => (p.t === "words" ? p.ws : [])).reverse(), before: string[] = [];
  outer: for (const s of buildTree().secs) for (const x of s.skills) { if (x.sk.id === sk.id) break outer; if (x.state === "done") before.push(...(x.sk.words || [])); }
  const here = new Set((skillParts(sk)[i] as { ws?: Card[] } | undefined)?.ws?.map((c) => c.id)), seen = new Set<string>();
  const cand = own.concat(before.reverse().map(wordCardOf) as Card[]).filter((c) => c && !here.has(c.id) && !seen.has(c.id) && seen.add(c.id) && confBand(c.id) !== "new" && confOf(c.id) < CONF_SURE).slice(0, 10);
  return sortByKeys(cand, (c: Card) => [confOf(c.id)]).slice(0, max);
}

/** Play part `i` of a skill (the first one not done yet when `i` is not given). */
export function startSkill(x: { sk: Skill; parts: Part<Card>[]; l: number }, i?: number | null): void {
  const k = Math.max(0, Math.min(x.parts.length - 1, i == null ? x.l : i));
  startNode({ id: "sk:" + x.sk.id + ":" + k, type: "skill", sk: x.sk, i: k, part: x.parts[k], parts: x.parts.length, title: x.sk.title });
}
export const startTreeCp = (s: { sec: TreeSection }): void => startNode({ id: "sec:" + s.sec.id, type: "treecp", sec: s.sec, title: "Checkpoint" });

/** What is next, in words, for a tap on a locked step. */
export function nextStepName(): string {
  const c = buildTree().cur;
  return !c ? "" : "cp" in c ? "the checkpoint" : "“" + c.sk.title + "”";
}

// ---------- the learner's place ----------

/**
 * Runs once when cards, lessons and progress have loaded and the saved doc predates the path (v<3): position from the old level and
 * start unit, finished units from their old 80% rule, XP from answers given.
 */
export function migrateProgress(): void {
  if (S.pv >= 3 || S.migrated || !S.loaded || !S.gLoaded || !S.progLoaded) return;
  S.migrated = true;
  const lg = S.legacy || {}, done: [string, number][] = [];
  for (const lv of LEVELS) for (let u = 1; u <= 6; u++) { const x = unitInfo(lv, u); if ((x.n || x.lessons) && x.done) done.push([lv, u]); }
  for (const [lv, u] of done) {
    const at = Date.now();
    S.nd[lv + "_" + u + "_cp"] = { at, migrated: true };
    for (let k = 1; k <= wordNodeCount(lv, u); k++) S.nd[lv + "_" + u + "_w" + k] = { at, migrated: true };
  }
  if (!S.pos) {
    let i = lg.level && LEVELS.includes(lg.level) ? unitIdx(lg.level, Math.max(1, Math.min(6, +lg.startUnit || 1))) : 0;
    while (i < 17 && unitDone(idxUnit(i).lv, idxUnit(i).u)) i++;
    S.pos = idxUnit(i);
  }
  if (!S.xp) { S.xpDays = { ...S.days }; S.xp = (Object.values(S.days) as number[]).reduce((a, n) => a + n, 0); }
  S.pv = 3;
  S.legacy = null;
  saveProgress();
}
/**
 * Moves old progress onto the path, and the tree's marks onto the learner's place, as soon as everything they need has loaded (cards,
 * lessons, progress, and the tree's sections for the second).
 */
export function watchMigration(): void {
  effect(() => {
    for (const s of [signals.loaded, signals.gLoaded, signals.progLoaded, signals.tLoaded, signals.canEdit, tree]) void s.value;
    if (S.loaded && S.gLoaded && S.progLoaded) untracked(() => { migrateProgress(); treeMigrate(); });
  });
}

/** Words and sentences the learner keeps getting wrong. */
export const weakPool = (): Card[] => ([...S.cards.values()] as Card[]).filter((c) => (c.kind === "word" || c.kind === "sentence") && isWeak(c.id));
