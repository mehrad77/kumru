/* eslint-disable @typescript-eslint/no-explicit-any -- the steps are open records (types.ts) */
// What a step asks, decided once when it comes up: which card, which wrong options, which tiles. Random choices live here and in
// the model, never in a component, so a redraw cannot change the question. A step that cannot be asked (no card, no sentences) falls
// back to another kind, as it always did: flash, choice, type and match to a suffix drill; build to choice.
import { S } from "../../core/store.ts";
import { ALL_V, plainParts } from "../../lib/morphology.ts";
import { shuffle } from "../../lib/random.ts";
import { hasVoice } from "../../ui/speech.ts";
import { drillOptions, makeDrillQ, pickDrillType, type DrillQ, type DrillType } from "../drills/index.ts";
import { confOf, drillAcc, myLevel, recordSeen } from "../progress/index.ts";
import { pickMistake, type Mistake } from "../tutor/index.ts";
import { all, CONF_KNOWN, CONF_SURE, meaningText, pickCard, pickSentence, practiceDeck, properWord, sentencePool, synonymsOf, type BuildSentence } from "./cards.ts";
import { compileAccept, normT } from "./model/answers.ts";
import { decoyTiles, distractors, sentenceWords, tileText } from "./model/deck.ts";
import { type Card as GCard, meaningClash } from "./model/gloss.ts";
import { letterPlan, type LetterPlan } from "./model/letters.ts";
import type { Card, Step } from "./types.ts";

export interface Tile { t: string; i: number }

export type Prep =
  | { type: "flash"; c: Card; rev: boolean }
  | { type: "choice"; c: Card; toTr: boolean; list: Card[]; audio: boolean; hint: boolean; skip: boolean }
  | { type: "type"; c: Card; listen: boolean; voice: boolean; hint: boolean; target: string; plan: LetterPlan | null; recall: boolean; syn: string[] }
  | { type: "match"; picks: Card[]; left: Card[]; right: Card[]; pool: any; label: any }
  | { type: "build"; s: BuildSentence; accept: ReturnType<typeof compileAccept>; tiles: Tile[]; hint: boolean; audio: boolean }
  | { type: "drill"; t: DrillType; q: DrillQ; answer: string; opts: string[]; vi: number; n: number; acc: number }
  | { type: "learn"; c: Card; st: Step }
  | { type: "spot"; m: Mistake; opts: string[] }
  | { type: "fixit"; m: Mistake }
  | { type: "allfixed" }
  | { type: "intro"; st: Step }
  | { type: "read"; st: Step }
  | { type: "card"; st: Step }
  | { type: "lessondone"; st: Step }
  | { type: "report"; st: Step }
  | { type: "cardq"; st: Step; order: number[] };

/** The drill kind this step asks: the session's own (a drill session, or the step's `dtype`), else the weakest of the learner's drills. */
function drillType(): DrillType {
  const s = S.session;
  const forced = s ? (s.kind === "drill" ? s.dtype : s.kind === "custom" ? s.stepDtype : "") : "";
  return pickDrillType(myLevel(), forced || "", !!(s && s.focus && s.focus.verbs), drillAcc) as DrillType;
}

function drill(): Prep {
  const t = drillType(), q = makeDrillQ(t), answer = plainParts(q.ps as any);
  const o = q.orig as string, vi = Math.max(...[...ALL_V].map((v) => o.lastIndexOf(v)));
  const { t: n, acc } = drillAcc(t.k);
  return { type: "drill", t, q, answer, opts: shuffle([answer, ...drillOptions(q, answer)]), vi, n, acc };
}

function choice(): Prep {
  const s = S.session, st = s.cur || {};
  const c: Card | null = st.c || pickCard(practiceDeck(), s.used);
  if (!c) return drill();
  s.used.add(c.id);
  const toTr = st.dir ? st.dir === "t" : Math.random() < 0.35;
  const same = all(c.kind || "word").filter((x) => x.id !== c.id && x.tr && meaningText(x));
  const near = ((st.dpool || []) as Card[]).filter((x) => x.id !== c.id && x.tr && meaningText(x));
  const list = shuffle(distractors(c as GCard, same, near, (x) => (toTr ? x.tr : meaningText(x as Card)) as string) as Card[]);
  return { type: "choice", c, toTr, list, audio: !!st.audio, hint: !!st.hint, skip: !!(st.c && st.pool && st.pool.includes(c) && confOf(c.id) < CONF_SURE) };
}

function type(listen: boolean): Prep {
  const s = S.session, deck = practiceDeck().filter((c) => c.kind === "word" || String(c.tr).split(" ").length <= 6);
  const c: Card | null = (s.cur && s.cur.c) || pickCard(deck.length ? deck : practiceDeck(), s.used);
  if (!c) return drill();
  s.used.add(c.id);
  const voice = !!(s.focus && s.focus.voice);
  const target = normT(c.tr.replace(/\([^)]*\)/g, "").split(/\s[/·;]\s|;/)[0]) || normT(c.tr);
  return { type: "type", c, listen, voice, hint: !!(s.cur && s.cur.hint), target, plan: voice ? null : letterPlan(target), recall: confOf(c.id) >= CONF_KNOWN, syn: synonymsOf(c) };
}

function match(): Prep {
  const s = S.session, st = s.cur || {};
  const picks: Card[] = [], means = new Set<string>();
  const take = (c: Card) => { const m = meaningText(c); if (means.has(m) || picks.some((p) => p.tr === c.tr || meaningClash(p as GCard, c as GCard))) return; means.add(m); picks.push(c); };
  if (st.cards) (st.cards as Card[]).forEach(take);
  else {
    let deck = practiceDeck().filter((c) => c.kind === "word");
    if (deck.length < 3) deck = all("word");
    const used = new Set<string>();
    while (picks.length < 5 && used.size < deck.length) { const c = pickCard(deck, used); if (!c) break; used.add(c.id); take(c); }
  }
  if (picks.length < 2) return drill();
  return { type: "match", picks, left: shuffle(picks), right: shuffle(picks), pool: st.pool, label: st.label };
}

function build(): Prep {
  const s = S.session, st = s.cur || {}, pool = sentencePool();
  if (!pool.length) return choice();
  const sent: BuildSentence = st.sent || pickSentence(pool) || pool[0];
  const toks = sentenceWords(sent.tr), A = compileAccept(sent.tr, sent.accept);
  const show = (t: string, j: number) => tileText(t, j, properWord);
  const others = decoyTiles(pool, sent, A.toks, Math.min(3, Math.max(1, 6 - toks.length)), properWord);
  const tiles = shuffle(toks.map(show).concat(others)).map((t, i) => ({ t, i }));
  return { type: "build", s: sent, accept: A, tiles, hint: !!st.hint, audio: !!st.audio };
}

function flash(): Prep {
  const s = S.session, c: Card | null = (s.cur && s.cur.c) || pickCard(practiceDeck(), s.used);
  if (!c) return drill();
  s.used.add(c.id);
  return { type: "flash", c, rev: Math.random() < 0.25 };
}

/** A teach card: the word counts as met and goes on the report's list of new words. */
function learn(st: Step): Prep {
  const s = S.session, c = st.c as Card;
  s.used.add(c.id);
  recordSeen(c.id);
  if (!s.newWords.includes(c)) s.newWords.push(c);
  return { type: "learn", c, st };
}

function spot(): Prep {
  const m = pickMistake();
  return m ? { type: "spot", m, opts: shuffle([m.orig, m.fixed]) } : { type: "allfixed" };
}

function fixit(): Prep {
  const m = pickMistake();
  return m ? { type: "fixit", m } : { type: "allfixed" };
}

/** Decide what `st` asks. A `listen` step without a Turkish voice becomes a `type` step. */
export function prepareStep(st: Step): Prep {
  const s = S.session;
  if (st.k === "listen" && !hasVoice()) st.k = "type";
  switch (st.k) {
    case "flash": return flash();
    case "type": return type(false);
    case "listen": return type(true);
    case "match": return match();
    case "build": return build();
    case "drill": return drill();
    case "learn": return learn(st);
    case "intro": return { type: "intro", st };
    case "read": return { type: "read", st };
    case "card": return { type: "card", st };
    case "report": return { type: "report", st };
    case "lessonDone": return { type: "lessondone", st };
    case "cardq": return { type: "cardq", st, order: shuffle((st.it.opts as string[]).map((_, j) => j)) };
    case "spot": return spot();
    case "fixit": return fixit();
    case "hearpick": { const cur = s.cur || (s.cur = {}); cur.audio = true; cur.dir = "m"; return choice(); }
    case "hearbuild": { const cur = s.cur || (s.cur = {}); cur.audio = true; return build(); }
    default: return choice();
  }
}

