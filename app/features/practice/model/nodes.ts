/* eslint-disable @typescript-eslint/no-explicit-any -- a node and a step are open records (types.ts) */
// The queue of steps a path node plays: a skill's part, a grammar lesson, a words node, a checkpoint, a review. Pure: the course
// and the learner's state come in as arguments (`NodeEnv`).
import { lessonSentences } from "./gloss.ts";
import { wordLessonSteps } from "./lessons.ts";
import { reviewPool, nodeWords, type QCard, type QueueEnv } from "./queues.ts";

export interface Lesson { id: string; order?: number; title: string; section?: string; en?: string; fa?: string; ex?: [string, string, string][]; lite?: any[]; blocks?: any[]; tip?: any; ref?: string; [field: string]: any }
type St = { k: string; [field: string]: any };

export interface NodeEnv extends QueueEnv {
  /** Whether a Turkish voice exists (a listen step needs one). */
  voice(): boolean;
  grammar(id: string): Lesson | undefined;
  card(id: string): QCard | undefined;
  /** The suffix drill kinds: [{ k, lesson }]. */
  drills(): { k: string; lesson: string }[];
  buildable(tr: string, fa?: string): boolean;
  coreWords(lv: string, u: number): QCard[];
  secWords(sec: any, n: number): QCard[];
  secLessons(sec: any): Lesson[];
  unitLessons(lv: string, u: number): Lesson[];
  skillReview(sk: any, i: number): QCard[];
  unitTitle(lv: string, u: number): string;
  mistakeCount(): number;
}

/** One question kind per entry, for the same pool of words. */
export const wordSteps = (env: NodeEnv, pool: QCard[], label: string, kinds: string[]): St[] => kinds.map((k) => ({ k: k === "listen" && !env.voice() ? "type" : k, pool, label }));

const gxSentences = (env: NodeEnv, lessons: Lesson[]) =>
  lessons.flatMap((l) => (l.ex || []).map(([tr, fa, en], i) => ({ id: "gx:" + l.id + ":" + i, tr, fa, en }))).filter((x) => env.buildable(x.tr, x.fa));

/** A lesson's checks: suffix drills of its lesson, then a build step on its example sentences. */
export function lessonSteps(env: NodeEnv, L: Lesson, label: string, light?: boolean): St[] {
  const dts = env.drills().filter((d) => d.lesson === L.id), sents = gxSentences(env, [L]);
  const checks: St[] = [];
  if (dts.length) for (let i = 0; i < (light ? 1 : 3); i++) checks.push({ k: "drill", dtype: dts[i % dts.length].k, label, lesson: L.id });
  if (sents.length) checks.push({ k: "build", spool: sents, label, lesson: L.id });
  if (!checks.length) checks.push({ k: "build", label, lesson: L.id });
  return checks;
}

/** A lite card's check: its own question, or the lesson quiz item at the same place. */
export function liteQ(L: Lesson, i: number): any {
  const c = (L.lite as any[])[i];
  if (c && c.q && Array.isArray(c.q.opts)) return c.q;
  const qz = (L.blocks || []).find((b) => b.t === "widget" && b.w === "quiz");
  const it = qz && qz.o && (qz.o.items || [])[i];
  return it && Array.isArray(it.opts) && it.opts.length > 1 ? it : null;
}

/** One part of a skill (data/path): a grammar lesson's cards, or a lesson of 3-5 new words. */
export function skillQueue(env: NodeEnv, n: any): St[] {
  const p = n.part;
  if (p.t === "lesson") {
    const L = env.grammar(p.g);
    return L ? nodeQueue(env, { type: "lesson", L, title: L.title }).map((x) => (x.k === "build" ? { ...x, hint: true } : x)) : [];
  }
  const rev = env.skillReview(n.sk, n.i);
  const sents = lessonSentences(p.ws, (n.sk.sentences || []).map((id: string) => env.card(id)).filter((c: any) => c && env.buildable(c.tr, c.fa)).map((c: any) => ({ id: c.id, tr: c.tr, fa: c.fa, en: c.en, accept: c.accept, gloss: c.gloss })));
  return [{ k: "intro", title: n.sk.title, sub: p.ws.length + " new words" + (rev.length ? " + " + rev.length + " to review" : "") + " · " + n.sk.en + (n.parts > 1 ? " · part " + (n.i + 1) + " of " + n.parts : ""), icon: "flash" },
    ...wordLessonSteps(p.ws, "New words", env.voice(), rev, sents).map((x) => ({ ...x, hint: true }))] as St[];
}

/** The steps of a node, by its type. */
export function nodeQueue(env: NodeEnv, n: any): St[] {
  const q: St[] = [];
  if (n.type === "skill") return skillQueue(env, n);
  if (n.type === "lesson") {
    const L: Lesson = n.L, lite = Array.isArray(L.lite) && L.lite.length ? L.lite : null;
    if (lite) {
      q.push({ k: "intro", title: "Lesson " + L.order + ": " + L.title, sub: lite.length + " short cards, each with a quick check.", icon: "book" });
      lite.forEach((_c, i) => { q.push({ k: "card", L, i }); const it = liteQ(L, i); if (it) q.push({ k: "cardq", L, i, it, label: "Lesson " + L.order }); });
      q.push(...lessonSteps(env, L, "Lesson " + L.order + " check", true), { k: "lessonDone", L });
    } else q.push({ k: "intro", title: "Lesson " + L.order + ": " + L.title, sub: L.section + " · read it, then a quick check.", icon: "book" }, { k: "read", L }, ...lessonSteps(env, L, "Lesson " + L.order + " check"), { k: "lessonDone", L });
  } else if (n.type === "words") {
    const ws = nodeWords(env, env.coreWords(n.lv, n.u));
    q.push({ k: "intro", title: "New words", sub: ws.length + " words from " + env.unitLabel(n.lv, n.u) + ", then practise.", icon: "flash" });
    q.push(...wordLessonSteps(ws, "New words", env.voice()) as St[]);
  } else if (n.type === "checkpoint" || n.type === "treecp") {
    const tc = n.type === "treecp", ws = tc ? env.secWords(n.sec, 10) : env.coreWords(n.lv, n.u), L = tc ? env.secLessons(n.sec) : env.unitLessons(n.lv, n.u);
    const dts = env.drills().filter((d) => L.some((l) => l.id === d.lesson)), sents = gxSentences(env, L);
    q.push({ k: "intro", title: tc ? "Checkpoint: " + n.sec.title : "Checkpoint: " + env.unitTitle(n.lv, n.u), sub: tc ? "A mixed check of the whole section. Finish it to open the next one." : "A mixed check of the whole unit. Finish it to complete Unit " + n.u + ".", icon: "flag" },
      ...wordSteps(env, ws, "Checkpoint", ["choice", "type", "match", "choice", "listen"]));
    if (dts.length) for (let i = 0; i < 3; i++) q.push({ k: "drill", dtype: dts[i % dts.length].k, label: "Checkpoint" });
    else q.push(...wordSteps(env, ws, "Checkpoint", ["type", "choice"]));
    if (sents.length) q.push({ k: "build", spool: sents, label: "Checkpoint" }, { k: "build", spool: sents, label: "Checkpoint" });
  } else {
    const lim = env.unitIdx(n.lv, n.u), pool = reviewPool(env).filter((c) => { const r = env.refUnit(c); return !r || env.unitIdx(r.lv, r.u) <= lim; });
    const p = pool.length >= 4 ? pool : env.coreWords(n.lv, n.u);
    q.push({ k: "intro", title: "Review", sub: "Words and endings you've met, weakest first.", icon: "refresh" }, ...wordSteps(env, p, "Review", ["flash", "choice", "type", "listen"]));
    for (let i = 0; i < 3; i++) q.push({ k: "drill", dtype: "", label: "Review" });
    if (env.mistakeCount()) q.push({ k: "spot" }, { k: "fixit" });
  }
  return q;
}

/** Stars for a node from its accuracy: 3 from 90%, 2 from 70%, else 1. */
export function nodeStars(right: number, wrong: number): { tot: number; acc: number; stars: number } {
  const tot = right + wrong, acc = tot ? right / tot : 1;
  return { tot, acc, stars: acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1 };
}

/** The misses of a report, one per Turkish word, ten at most. */
export const missedList = (missed: [string, string][]): [string, string][] => [...new Map(missed.map((m) => [m[0], m] as const)).values()].slice(0, 10);
