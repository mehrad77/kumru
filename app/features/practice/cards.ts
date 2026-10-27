// The cards a practice question draws from, read from the learner's state: the deck the learner picked, the sentences that can be
// built, word hints, and which meaning to show. The choosing itself is model/deck.ts.
import { S } from "../../core/store.ts";
import { CONF_KNOWN, CONF_SURE, cardTries } from "../../lib/progress.ts";
import { levelRank } from "../../lib/units.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { confOf, isWeak, myLevel } from "../progress/index.ts";
import { buildGlossIndex, type GlossIndex, meaningClash } from "./model/gloss.ts";
import { normT } from "./model/answers.ts";
import { buildable, pickWeighted, plainFa, weightOf } from "./model/deck.ts";
import type { Card } from "./types.ts";
import { meaningLang } from "../../core/lang.ts";

export { CONF_KNOWN, CONF_SURE };
/** Capitalise the Turkish way. */
export const cap = (v: string): string => (v ? v.charAt(0).toLocaleUpperCase("tr") + v.slice(1) : v);
export const T = bidiTxt;

/** Every live card of a kind (`verb`, `shared` and `false` pick word cards by part of speech or origin). */
export function all(kind: string): Card[] {
  return ([...S.cards.values()] as Card[]).filter((c) => (kind === "verb" ? c.kind === "word" && c.pos === "verb" : kind === "shared" || kind === "false" ? c.kind === "word" && c.origin === kind : c.kind === kind)).filter((c) => !c.retired);
}

const effLevel = (): string => (S.plevel === "mine" ? myLevel() : S.plevel);

/** The cards of the running session's pool, else of the deck the learner picked (kind, level, unit, topic). */
export function practiceDeck(): Card[] {
  if (S.session && S.session.pool) return (S.session.pool as Card[]).filter((c) => c.tr && (c.fa || c.en));
  let d: Card[];
  if (S.deck === "weak") d = ([...S.cards.values()] as Card[]).filter((c) => (c.kind === "word" || c.kind === "sentence") && isWeak(c.id));
  else if (S.deck === "new") d = all("word").filter((c) => !cardTries(S.stats[c.id]));
  else d = all(S.deck);
  const lv = effLevel();
  if (lv) d = S.deck === "weak" && S.plevel === "mine" ? d.filter((c) => !c.level || levelRank(c.level) <= levelRank(lv)) : d.filter((c) => c.level === lv);
  if (lv && S.punit) d = d.filter((c) => c.ref === lv + "_" + S.punit);
  if (S.ptopic && S.deck !== "sentence") d = d.filter((c) => c.topic === S.ptopic);
  return d.filter((c) => c.tr && (c.fa || c.en));
}

/** A card chosen by weight from `pool`, avoiding what this session already asked. */
export const pickCard = (pool: Card[], avoid?: Set<string> | null): Card | null =>
  pickWeighted(pool, avoid, (c) => weightOf(confOf(c.id), CONF_SURE, isWeak(c.id), !!cardTries(S.stats[c.id])));

/** A sentence chosen by weight (weak and unseen ones first). */
export const pickSentence = <T extends { id: string }>(pool: T[]): T | null =>
  pickWeighted(pool, null, (x) => 1 + (isWeak(x.id) ? 4 : 0) + (cardTries(S.stats[x.id]) ? 0 : 2));

export interface BuildSentence { id: string; tr: string; fa: string; en?: string; accept?: string[]; gloss?: Record<string, string> }

/** The sentences a Build question can use: the session's own, else the reading sentences and the lessons' examples. */
export function sentencePool(): BuildSentence[] {
  if (S.session && S.session.spool) return S.session.spool;
  const out: BuildSentence[] = all("sentence").filter((c) => c.tr && c.fa && plainFa(c.fa)).map((c) => ({ id: c.id, tr: c.tr, fa: c.fa as string, en: c.en, accept: c.accept, gloss: c.gloss }));
  for (const g of S.grammar) (g.ex || []).forEach(([tr, fa, en]: [string, string, string], i: number) => { if (buildable(tr, fa)) out.push({ id: "gx:" + g.id + ":" + i, tr, fa, en }); });
  return out;
}

/** The meaning in the learner's language (Persian or English; a card with only one shows that one). */
export const meaningText = (c: Card): string => ((meaningLang() === "en" ? c.en || c.fa : c.fa || c.en) as string);
export const meaningIsFa = (c: Card): boolean => (meaningLang() === "en" ? !c.en : !!c.fa);
/** A word the learner doesn't know yet shows both meanings, whatever the language setting says. */
export const bothFor = (c: Card): boolean => meaningLang() === "both" || confOf(c.id) < CONF_KNOWN;

let glossIdx: GlossIndex | null = null, glossIdxN = -1;
/** The word → card index behind the hints (rebuilt when the cards change). */
export function wordGlossIdx(): GlossIndex {
  if (glossIdxN !== S.cards.size || !glossIdx) { glossIdx = buildGlossIndex([...S.cards.values()]); glossIdxN = S.cards.size; }
  return glossIdx;
}

let proper: Set<string> | null = null;
/** One-word cards the Words deck spells with a capital (names, places, nationalities) keep it on a sentence tile; phrases like "Ben de." do not. */
export const properWord = (t: string): boolean => {
  if (!proper) proper = new Set(([...S.cards.values()] as Card[]).filter((c) => c.kind === "word" && /^[A-ZÇĞİÖŞÜ][^\s.!?]*$/.test(c.tr)).map((c) => c.tr));
  return proper.has(t);
};

/** The other Turkish words that mean the same as this card (bay and bey): a typed answer may be any of them. */
export const synonymsOf = (c: Card): string[] => all("word").filter((x) => x.id !== c.id && x.tr && normT(x.tr) !== normT(c.tr) && meaningClash(c, x)).map((x) => x.tr);
