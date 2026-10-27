// The skill tree (docs/PROGRESS.md section 8): a skill's parts, the road through the sections, where a skill sits
// in the book, and the placed and migrated marks. Pure: the page's state comes in as arguments.
import { chunkWords } from "../../../lib/chunk.ts";

/** A skill of the `path` collection (data/path): a themed word set, a grammar lesson, or both. */
export interface Skill { id: string; title: string; en: string; icon?: string; lessons?: string[]; words?: string[]; sentences?: string[] }
/** A section: skills one after another, a checkpoint closing it. */
export interface Section { id: string; order: number; title: string; en: string; level: string; skills: Skill[]; draft?: boolean }
/** How a skill or section got its mark: `placed` and `test` skip it, `migrated` marks what the learner already knew, `cp` is a checkpoint. */
export type How = "placed" | "test" | "migrated" | "cp";
export interface SkillRec { l?: number; at?: number; how?: How; stars?: number }
export interface SecRec { at?: number; how?: How; stars?: number }
/** `progress.tree`. */
export interface TreeProgress { v?: number; sk?: Record<string, SkillRec>; sec?: Record<string, SecRec>; mig?: number }
export interface WordCard { id: string; tr?: string; en?: string; fa?: string }
export type Part<C = WordCard> = { t: "lesson"; g: string } | { t: "words"; ws: C[] };

export { chunkWords };

/** A skill's lessons first, then its words in lessons; a word without a card is skipped. */
export function skillParts<C>(sk: Skill, cardOf: (id: string) => C | null | undefined): Part<C>[] {
  const lessons = (sk.lessons || []).map((g): Part<C> => ({ t: "lesson", g }));
  const words = chunkWords((sk.words || []).map(cardOf).filter(Boolean) as C[]).map((ws): Part<C> => ({ t: "words", ws }));
  return [...lessons, ...words];
}

export type SkillState = "done" | "placed" | "cur" | "locked";
export interface FlowSkill<C = WordCard> { sk: Skill; parts: Part<C>[]; L: number; l: number; state: SkillState; stars: number }
export interface FlowSection<C = WordCard> {
  sec: Section; skills: FlowSkill<C>[]; cp: "locked" | "cur" | "done"; passed: boolean; skipped: boolean; state: "done" | "cur" | "later";
}
export type Cur<C = WordCard> = { sec: Section; sk: Skill; parts: Part<C>[]; l: number; L: number } | { sec: Section; cp: true } | null;

/**
 * The road through the tree: each skill is done, cur (the one next step) or locked; a section's checkpoint opens after
 * its skills. A skill that was placed or tested out is open to replay but never blocks the road.
 */
export function treeFlow<C>(secs: Section[], tp: TreeProgress, partsOf: (sk: Skill) => Part<C>[]): { secs: FlowSection<C>[]; cur: Cur<C> } {
  let cur: Cur<C> = null;
  const out = secs.map((sec): FlowSection<C> => {
    const skills = sec.skills.map((sk): FlowSkill<C> => {
      const parts = partsOf(sk), L = parts.length, rec = (tp.sk || {})[sk.id] || {}, l = Math.min(L, rec.l || 0);
      let state: SkillState = l >= L ? "done" : rec.how === "placed" || rec.how === "test" ? "placed" : "locked";
      if (state === "locked" && !cur) {
        state = "cur";
        cur = { sec, sk, parts, l, L };
      }
      return { sk, parts, L, l, state, stars: rec.stars || 0 };
    });
    const srec = (tp.sec || {})[sec.id], passed = !!srec;
    let cp: "locked" | "cur" | "done" = "locked";
    if (passed) cp = "done";
    else if (skills.every((x) => x.state === "done" || x.state === "placed") && !cur) {
      cp = "cur";
      cur = { sec, cp: true };
    }
    return { sec, skills, cp, passed, skipped: passed && (srec.how === "placed" || srec.how === "test"), state: passed ? "done" : cur && cur.sec === sec ? "cur" : "later" };
  });
  return { secs: out, cur };
}

/**
 * Where a skill sits in the book, as a unit index 0-17: the highest unit of its lessons (its words only accompany them),
 * or for a words skill the 80th-percentile unit of its words; null with no unit info.
 */
export function skillPos(sk: Skill, lessonIdx: (g: string) => number | null | undefined, wordIdx: (id: string) => number | null | undefined): number | null {
  const ps: number[] = [];
  for (const g of sk.lessons || []) {
    const i = lessonIdx(g);
    if (i != null) ps.push(i);
  }
  if (ps.length) return Math.max(...ps);
  const ws = (sk.words || []).map(wordIdx).filter((i): i is number => i != null).sort((a, b) => a - b);
  return ws.length ? ws[Math.min(ws.length - 1, Math.floor(ws.length * 0.8))] : null;
}

export interface MarkContext<C = WordCard> {
  /** The learner's unit index. */
  ci: number;
  partsOf: (sk: Skill) => Part<C>[];
  posOf: (sk: Skill) => number | null;
  known: (id: string) => boolean;
  learned: (lessonId: string) => boolean;
  now: number;
}

/**
 * The placed and migrated marks of progress.tree. `place` marks unfinished skills that lie before the learner's unit as
 * placed; `migrate` also marks skills the learner already knows (lessons learned, 80% of the words known) as done. A placed
 * mark is dropped again once the position moves back below its skill; a skill that was finished or tested stays.
 */
export function treeMark<C>(secs: Section[], tp: TreeProgress, x: MarkContext<C>, opt: { place?: boolean; migrate?: boolean }): TreeProgress {
  const sk = { ...tp.sk }, sec = { ...tp.sec };
  let prev = 0;
  for (const s of secs) {
    for (const k of s.skills) {
      const L = x.partsOf(k).length, rec = sk[k.id];
      let p = x.posOf(k);
      if (p == null) p = prev;
      prev = p;
      if (rec && ((rec.l || 0) >= L || rec.how === "test")) continue;
      if (rec && rec.how === "placed") {
        if (p < x.ci) continue;
        delete sk[k.id];
      }
      if (opt.migrate && !sk[k.id] && L > 0) {
        const ids = k.words || [];
        if ((k.lessons || []).every(x.learned) && (!ids.length || ids.filter(x.known).length / ids.length >= 0.8)) {
          sk[k.id] = { l: L, at: x.now, how: "migrated" };
          continue;
        }
      }
      if (opt.place && !sk[k.id] && p < x.ci) sk[k.id] = { l: 0, at: x.now, how: "placed" };
    }
  }
  // a section whose skills are all placed or done (and at least one placed) needs no checkpoint
  for (const s of secs) {
    const fin = (k: Skill) => {
      const r = sk[k.id];
      return x.partsOf(k).length === 0 || (r && ((r.l || 0) >= x.partsOf(k).length || r.how === "placed" || r.how === "test"));
    };
    const all = s.skills.every(fin) && s.skills.some((k) => sk[k.id] && sk[k.id].how === "placed");
    if (all && !sec[s.id]) sec[s.id] = { at: x.now, how: "placed" };
    else if (!all && sec[s.id] && sec[s.id].how === "placed") delete sec[s.id];
  }
  return { ...tp, v: 1, sk, sec, ...(opt.migrate ? { mig: 1 } : {}) };
}
