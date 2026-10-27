// The word pools a Lab sheet can draw from, and how a Lab session starts. The pools read the learner's cards and progress; the
// session kinds are the practice feature's.
import { local } from "../../core/local.ts";
import { S } from "../../core/store.ts";
import { cardTries } from "../../lib/progress.ts";
import { closeSheet } from "../../ui/sheet.ts";
import { useTree, weakPool } from "../path/index.ts";
import { catchUpWords, newWordBatch, startCustom, topicRank } from "../practice/index.ts";
import { toast } from "../../ui/toast.ts";
import { countText, topicGroups, type LabCard } from "./model/decks.ts";
import { claimedWords, proveSteps } from "./model/prove.ts";

/** Every live card of a kind. */
export const cardsOf = (kind: string): LabCard[] => ([...S.cards.values()] as LabCard[]).filter((c) => c.kind === kind && !c.retired);

/** Words with a meaning to show. */
export const labWords = (): LabCard[] => cardsOf("word").filter((c) => c.tr && (c.fa || c.en));
export const labTopics = (): [string, LabCard[]][] => topicGroups(labWords(), (t) => topicRank(t));

const tried = (c: LabCard): boolean => cardTries(S.stats[c.id]) > 0;

export interface LabSource { id: string; icon: "target" | "x" | "flash" | "choice" | "book"; c: string; t: string; pool: LabCard[]; sub: string; topics?: boolean }

export function labSources(): LabSource[] {
  const w = labWords(), seen = w.filter(tried), weak = weakPool(), miss = w.filter((c) => (S.stats[c.id] || {}).l === 0 && tried(c));
  const nb = newWordBatch<LabCard>(12), nw = nb.words, cu = catchUpWords<LabCard>();
  const out: (LabSource | null)[] = [
    { id: "weak", icon: "target", c: "var(--bad)", t: "Weak spots", pool: weak, sub: countText(weak.length, " word to fix", " words to fix") || "Nothing weak right now" },
    { id: "miss", icon: "x", c: "var(--m-neg)", t: "Mistake bank", pool: miss, sub: countText(miss.length, " word you last missed", " words you last missed") || "No misses to fix" },
    { id: "new", icon: "flash", c: "var(--accent)", t: "New words", pool: nw, sub: nw.length ? "Next up: " + (nb.label || "vocabulary") : "You've met every word" },
    cu.length ? { id: "catch", icon: "flash", c: "var(--sage-d,var(--accent))", t: "Catch up", pool: newWordBatch(12, null, cu).words, sub: cu.length + (useTree() ? " words from skills you skipped" : " words from units you were placed past") } : null,
    { id: "seen", icon: "choice", c: "var(--m-pl)", t: "Words I've met", pool: seen, sub: countText(seen.length, " word you've met", " words you've met") || "Meet some words first" },
    { id: "topic", icon: "book", c: "var(--m-tense)", t: "By topic", pool: w, sub: "Food, family, travel…", topics: true },
  ];
  return out.filter((x): x is LabSource => !!x);
}

export const topicSeen = (l: LabCard[]): number => l.filter(tried).length;

/** The reading sentences, as a session pool. */
export const labSentences = (): { t: string; spool: unknown[] } => ({
  t: "Reading sentences",
  spool: cardsOf("sentence").filter((c) => c.src === "reading" && c.tr && c.fa).map((c) => ({ id: c.id, tr: c.tr, fa: c.fa, en: c.en, accept: c.accept, gloss: c.gloss })),
});

export interface LabPool { t: string; pool?: LabCard[]; spool?: unknown[] }

const rememberLen = (mins: number): void => local.set("labMin", String(mins));

/** Start a Lab session; "Again" on its report reopens the same one. */
export function labStart(mins: number, kind: string, src: LabPool): void {
  rememberLen(mins);
  closeSheet();
  const f: Record<string, unknown> = { kind, pool: src.pool, spool: src.spool, title: src.t, label: src.t, lab: true };
  f.again = () => labStart(mins, kind, src);
  startCustom(mins, f);
}

/** A suffix-drill session over the verb drills only (`dtype` "" = mixed, weakest first). */
export function verbStart(mins: number, dtype: string, label: string | null): void {
  rememberLen(mins);
  closeSheet();
  const f: Record<string, unknown> = { kind: "drill", dtype, title: "Verb gym" + (label ? ": " + label : ""), label: label || "Verb gym", lab: true, verbs: true };
  f.again = () => verbStart(mins, dtype, label);
  startCustom(mins, f);
}

/** The words the learner claimed to know and has not been asked. */
export const claimedNow = (): LabCard[] => claimedWords([...S.cards.values()] as LabCard[], S.conf, S.stats);

export function proveStart(): void {
  const words = claimedNow();
  if (!words.length) { toast("No claimed words are waiting."); return; }
  startCustom(0, { steps: proveSteps(words), title: "Prove it", label: "Prove it", lab: true, prove: true, again: proveStart });
}
